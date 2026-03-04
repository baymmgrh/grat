from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.production import WorkOrder, WorkOrderStatusHistory, ShiftProduction, Machine
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from utils.timezone import get_local_now, get_local_today

wo_monitoring_bp = Blueprint('work_order_monitoring', __name__)

@wo_monitoring_bp.route('/api/work-orders/monitoring', methods=['GET'])
@jwt_required()
def get_work_orders_monitoring():
    """Get all work orders with monitoring data (progress, status, delays)"""
    try:
        # Get query parameters
        status_filter = request.args.get('status')
        machine_id = request.args.get('machine_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Base query
        query = WorkOrder.query
        
        # Apply filters
        if status_filter:
            query = query.filter(WorkOrder.status == status_filter)
        if machine_id:
            query = query.filter(WorkOrder.machine_id == machine_id)
        if date_from:
            query = query.filter(WorkOrder.scheduled_start_date >= datetime.strptime(date_from, '%Y-%m-%d'))
        if date_to:
            query = query.filter(WorkOrder.scheduled_start_date <= datetime.strptime(date_to, '%Y-%m-%d'))
        
        work_orders = query.order_by(WorkOrder.scheduled_start_date.desc()).all()
        
        result = []
        for wo in work_orders:
            # Calculate progress
            qty_planned = float(wo.quantity) if wo.quantity else 0
            qty_produced = float(wo.quantity_produced) if wo.quantity_produced else 0
            progress_pct = round((qty_produced / qty_planned * 100), 1) if qty_planned > 0 else 0
            
            # Calculate estimated completion
            estimated_completion = None
            if wo.machine and wo.machine.default_speed and qty_planned > qty_produced:
                remaining_qty = qty_planned - qty_produced
                speed_per_min = wo.machine.default_speed
                estimated_minutes = remaining_qty / speed_per_min if speed_per_min > 0 else 0
                if wo.actual_start_date:
                    estimated_completion = get_local_now() + timedelta(minutes=estimated_minutes)
                elif wo.scheduled_start_date:
                    estimated_completion = wo.scheduled_start_date + timedelta(minutes=estimated_minutes)
            
            # Check if delayed
            is_delayed = False
            delay_hours = 0
            if wo.required_date and wo.status not in ['completed', 'cancelled']:
                required_datetime = datetime.combine(wo.required_date, datetime.min.time())
                if get_local_now() > required_datetime:
                    is_delayed = True
                    delay_hours = round((get_local_now() - required_datetime).total_seconds() / 3600, 1)
            
            # Get total downtime from production records
            total_downtime = 0
            for record in wo.production_records:
                if hasattr(record, 'shift_productions'):
                    for sp in record.shift_productions:
                        downtime = (sp.downtime_mesin or 0) + (sp.downtime_operator or 0) + \
                                   (sp.downtime_material or 0) + (sp.downtime_design or 0) + \
                                   (sp.downtime_others or 0)
                        total_downtime += downtime
            
            wo_data = {
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_name': wo.product.name if wo.product else None,
                'product_code': wo.product.code if wo.product else None,
                'machine_id': wo.machine_id,
                'machine_name': wo.machine.name if wo.machine else None,
                'status': wo.status,
                'priority': wo.priority,
                'quantity_planned': qty_planned,
                'quantity_produced': qty_produced,
                'quantity_good': float(wo.quantity_good) if wo.quantity_good else 0,
                'quantity_scrap': float(wo.quantity_scrap) if wo.quantity_scrap else 0,
                'quantity_rework': float(wo.quantity_rework) if hasattr(wo, 'quantity_rework') and wo.quantity_rework else 0,
                'setting_sticker': float(wo.setting_sticker) if hasattr(wo, 'setting_sticker') and wo.setting_sticker else 0,
                'setting_packaging': float(wo.setting_packaging) if hasattr(wo, 'setting_packaging') and wo.setting_packaging else 0,
                'progress_percentage': progress_pct,
                'scheduled_start': wo.scheduled_start_date.isoformat() if wo.scheduled_start_date else None,
                'scheduled_end': wo.scheduled_end_date.isoformat() if wo.scheduled_end_date else None,
                'actual_start': wo.actual_start_date.isoformat() if wo.actual_start_date else None,
                'actual_end': wo.actual_end_date.isoformat() if wo.actual_end_date else None,
                'required_date': wo.required_date.isoformat() if wo.required_date else None,
                'estimated_completion': estimated_completion.isoformat() if estimated_completion else None,
                'is_delayed': is_delayed,
                'delay_hours': delay_hours,
                'total_downtime_minutes': total_downtime,
                'created_at': wo.created_at.isoformat() if wo.created_at else None,
            }
            result.append(wo_data)
        
        return jsonify({
            'work_orders': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@wo_monitoring_bp.route('/api/work-orders/<int:wo_id>/timeline', methods=['GET'])
@jwt_required()
def get_work_order_timeline(wo_id):
    """Get status timeline for a work order"""
    try:
        wo = WorkOrder.query.get_or_404(wo_id)
        
        timeline = []
        for history in wo.status_history:
            timeline.append({
                'id': history.id,
                'from_status': history.from_status,
                'to_status': history.to_status,
                'changed_by': history.changed_by_user.username if history.changed_by_user else None,
                'changed_at': history.changed_at.isoformat(),
                'notes': history.notes
            })
        
        return jsonify({
            'wo_number': wo.wo_number,
            'current_status': wo.status,
            'timeline': timeline
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wo_monitoring_bp.route('/api/work-orders/<int:wo_id>/breakdown-impact', methods=['GET'])
@jwt_required()
def get_breakdown_impact(wo_id):
    """Get machine breakdown impact analysis for a work order"""
    try:
        wo = WorkOrder.query.get_or_404(wo_id)
        
        if not wo.machine_id:
            return jsonify({'error': 'Work order has no assigned machine'}), 400
        
        # Get all shift productions for this WO
        breakdown_events = []
        total_breakdown_time = 0
        total_idle_time = 0
        
        for record in wo.production_records:
            if hasattr(record, 'shift_productions'):
                for sp in record.shift_productions:
                    # Calculate breakdown time
                    breakdown_time = (sp.downtime_mesin or 0)
                    idle_time = (sp.idle_time or 0)
                    
                    if breakdown_time > 0 or idle_time > 0:
                        # Parse issues to get breakdown details
                        issues = []
                        if sp.issues:
                            import json
                            try:
                                issues_data = json.loads(sp.issues)
                                for issue in issues_data:
                                    if issue.get('category') in ['mesin', 'idle']:
                                        issues.append({
                                            'category': issue.get('category'),
                                            'reason': issue.get('issue', ''),
                                            'duration': issue.get('duration', 0)
                                        })
                            except:
                                pass
                        
                        breakdown_events.append({
                            'date': sp.production_date.isoformat() if sp.production_date else None,
                            'shift': sp.shift,
                            'breakdown_minutes': breakdown_time,
                            'idle_minutes': idle_time,
                            'issues': issues
                        })
                        
                        total_breakdown_time += breakdown_time
                        total_idle_time += idle_time
        
        # Calculate impact on completion
        qty_planned = float(wo.quantity) if wo.quantity else 0
        qty_produced = float(wo.quantity_produced) if wo.quantity_produced else 0
        remaining_qty = qty_planned - qty_produced
        
        # Estimate delay caused by breakdowns
        machine_speed = wo.machine.default_speed if wo.machine else 0
        lost_production = 0
        if machine_speed > 0:
            lost_production = (total_breakdown_time + total_idle_time) * machine_speed
        
        delay_impact_hours = 0
        if machine_speed > 0 and remaining_qty > 0:
            # Time needed to recover lost production
            delay_impact_hours = round((total_breakdown_time + total_idle_time) / 60, 1)
        
        return jsonify({
            'wo_number': wo.wo_number,
            'machine_name': wo.machine.name if wo.machine else None,
            'total_breakdown_minutes': total_breakdown_time,
            'total_idle_minutes': total_idle_time,
            'total_lost_time_minutes': total_breakdown_time + total_idle_time,
            'estimated_lost_production': round(lost_production, 0),
            'delay_impact_hours': delay_impact_hours,
            'breakdown_events': breakdown_events,
            'breakdown_count': len(breakdown_events)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@wo_monitoring_bp.route('/api/work-orders/breakdown-summary', methods=['GET'])
@jwt_required()
def get_breakdown_summary():
    """Get summary of all work orders affected by machine breakdowns"""
    try:
        # Get date range
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        if not date_from:
            date_from = (get_local_now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = get_local_now().strftime('%Y-%m-%d')
        
        # Get all active/in-progress work orders
        work_orders = WorkOrder.query.filter(
            WorkOrder.status.in_(['in_progress', 'released'])
        ).all()
        
        affected_wos = []
        total_breakdown_time = 0
        
        for wo in work_orders:
            wo_breakdown_time = 0
            
            for record in wo.production_records:
                if hasattr(record, 'shift_productions'):
                    for sp in record.shift_productions:
                        breakdown = (sp.downtime_mesin or 0)
                        wo_breakdown_time += breakdown
            
            if wo_breakdown_time > 0:
                total_breakdown_time += wo_breakdown_time
                
                # Calculate impact
                qty_planned = float(wo.quantity) if wo.quantity else 0
                qty_produced = float(wo.quantity_produced) if wo.quantity_produced else 0
                progress = round((qty_produced / qty_planned * 100), 1) if qty_planned > 0 else 0
                
                affected_wos.append({
                    'wo_number': wo.wo_number,
                    'product_name': wo.product.name if wo.product else None,
                    'machine_name': wo.machine.name if wo.machine else None,
                    'status': wo.status,
                    'progress_percentage': progress,
                    'breakdown_minutes': wo_breakdown_time,
                    'required_date': wo.required_date.isoformat() if wo.required_date else None
                })
        
        # Sort by breakdown time (highest first)
        affected_wos.sort(key=lambda x: x['breakdown_minutes'], reverse=True)
        
        return jsonify({
            'date_from': date_from,
            'date_to': date_to,
            'total_affected_wos': len(affected_wos),
            'total_breakdown_minutes': total_breakdown_time,
            'total_breakdown_hours': round(total_breakdown_time / 60, 1),
            'affected_work_orders': affected_wos[:20]  # Top 20
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
