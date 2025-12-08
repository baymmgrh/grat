from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Machine, MaintenanceRecord, MaintenanceSchedule, User
from utils.i18n import success_response, error_response, get_message
from models.oee import OEERecord, OEEDowntimeRecord, OEETarget, OEEAlert, MaintenanceImpact, OEEAnalytics, QualityDefect
from utils import generate_number
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, or_, desc
import json

oee_bp = Blueprint('oee', __name__)

@oee_bp.route('/records', methods=['GET'])
@oee_bp.route('/records/', methods=['GET'])
@jwt_required()
def get_records():
    """Get OEE records from both OEERecord and ShiftProduction"""
    try:
        from models.production import ShiftProduction
        
        machine_id = request.args.get('machine_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        all_records = []
        
        # Get from OEERecord
        oee_query = OEERecord.query
        if machine_id:
            oee_query = oee_query.filter(OEERecord.machine_id == machine_id)
        
        oee_records = oee_query.order_by(OEERecord.record_date.desc()).limit(limit).all()
        for r in oee_records:
            all_records.append({
                'id': r.id,
                'source': 'oee_record',
                'record_number': r.record_number,
                'machine_id': r.machine_id,
                'machine_name': r.machine.name if r.machine else None,
                'record_date': r.record_date.isoformat() if r.record_date else None,
                'availability': float(r.availability) if r.availability else 0,
                'performance': float(r.performance) if r.performance else 0,
                'quality': float(r.quality) if r.quality else 0,
                'oee_percentage': float(r.oee) if r.oee else 0
            })
        
        # Get from ShiftProduction
        shift_query = ShiftProduction.query
        if machine_id:
            shift_query = shift_query.filter(ShiftProduction.machine_id == machine_id)
        
        shift_records = shift_query.order_by(ShiftProduction.production_date.desc()).limit(limit).all()
        for sp in shift_records:
            all_records.append({
                'id': sp.id,
                'source': 'shift_production',
                'record_number': f"SP-{sp.id}",
                'machine_id': sp.machine_id,
                'machine_name': sp.machine.name if sp.machine else None,
                'record_date': sp.production_date.isoformat() if sp.production_date else None,
                'availability': float(sp.efficiency_rate) if sp.efficiency_rate else 0,
                'performance': 100.0,  # Default performance
                'quality': float(sp.quality_rate) if sp.quality_rate else 0,
                'oee_percentage': float(sp.oee_score) if sp.oee_score else 0
            })
        
        # Sort by date and limit
        all_records.sort(key=lambda x: x['record_date'] or '', reverse=True)
        all_records = all_records[:limit]
        
        return jsonify({
            'records': all_records
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/records', methods=['POST'])
@jwt_required()
def create_record():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        record_number = generate_number('OEE', OEERecord, 'record_number')
        
        # Calculate OEE metrics
        availability = ((data['planned_production_time'] - data['downtime']) / data['planned_production_time']) * 100
        performance = ((data['total_pieces_produced'] * data['ideal_cycle_time']) / data['actual_production_time']) * 100 if data['actual_production_time'] > 0 else 0
        quality = (data['good_pieces'] / data['total_pieces_produced']) * 100 if data['total_pieces_produced'] > 0 else 0
        oee = (availability * performance * quality) / 10000
        
        record = OEERecord(
            record_number=record_number,
            machine_id=data['machine_id'],
            work_order_id=data.get('work_order_id'),
            record_date=datetime.fromisoformat(data['record_date']),
            shift=data.get('shift'),
            planned_production_time=data['planned_production_time'],
            downtime=data['downtime'],
            actual_production_time=data['actual_production_time'],
            ideal_cycle_time=data['ideal_cycle_time'],
            total_pieces_produced=data['total_pieces_produced'],
            good_pieces=data['good_pieces'],
            rejected_pieces=data['rejected_pieces'],
            availability=availability,
            performance=performance,
            quality=quality,
            oee=oee,
            recorded_by=user_id
        )
        
        db.session.add(record)
        db.session.commit()
        return jsonify({'message': 'OEE record created', 'record_id': record.id, 'oee': oee}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/downtime', methods=['GET'])
@jwt_required()
def get_downtime():
    """Get downtime records from both OEEDowntimeRecord and ShiftProduction"""
    try:
        from models.production import ShiftProduction
        
        machine_id = request.args.get('machine_id', type=int)
        limit = request.args.get('limit', 50, type=int)
        
        all_records = []
        
        # Get from OEEDowntimeRecord
        query = OEEDowntimeRecord.query
        if machine_id:
            query = query.filter(OEEDowntimeRecord.machine_id == machine_id)
        
        oee_downtimes = query.order_by(OEEDowntimeRecord.start_time.desc()).limit(limit).all()
        for r in oee_downtimes:
            all_records.append({
                'id': r.id,
                'source': 'oee_downtime',
                'machine_id': r.machine_id,
                'reason': r.reason or r.downtime_category or 'Unknown',
                'duration_minutes': r.duration_minutes or 0,
                'start_time': r.start_time.isoformat() if r.start_time else None,
                'end_time': r.end_time.isoformat() if r.end_time else None,
                'downtime_category': r.downtime_category
            })
        
        # Get from ShiftProduction - create downtime entries per category
        shift_query = ShiftProduction.query
        if machine_id:
            shift_query = shift_query.filter(ShiftProduction.machine_id == machine_id)
        
        shift_records = shift_query.order_by(ShiftProduction.production_date.desc()).limit(limit).all()
        for sp in shift_records:
            base_time = datetime.combine(sp.production_date, sp.shift_start) if sp.production_date and sp.shift_start else datetime.now()
            
            # Add downtime entries for each category that has minutes
            if sp.downtime_mesin and sp.downtime_mesin > 0:
                all_records.append({
                    'id': f"sp-{sp.id}-mesin",
                    'source': 'shift_production',
                    'machine_id': sp.machine_id,
                    'reason': 'Downtime Mesin',
                    'duration_minutes': sp.downtime_mesin,
                    'start_time': base_time.isoformat(),
                    'end_time': None,
                    'downtime_category': 'mesin'
                })
            
            if sp.downtime_operator and sp.downtime_operator > 0:
                all_records.append({
                    'id': f"sp-{sp.id}-operator",
                    'source': 'shift_production',
                    'machine_id': sp.machine_id,
                    'reason': 'Downtime Operator',
                    'duration_minutes': sp.downtime_operator,
                    'start_time': base_time.isoformat(),
                    'end_time': None,
                    'downtime_category': 'operator'
                })
            
            if sp.downtime_material and sp.downtime_material > 0:
                all_records.append({
                    'id': f"sp-{sp.id}-material",
                    'source': 'shift_production',
                    'machine_id': sp.machine_id,
                    'reason': 'Downtime Material',
                    'duration_minutes': sp.downtime_material,
                    'start_time': base_time.isoformat(),
                    'end_time': None,
                    'downtime_category': 'material'
                })
            
            if sp.downtime_design and sp.downtime_design > 0:
                all_records.append({
                    'id': f"sp-{sp.id}-design",
                    'source': 'shift_production',
                    'machine_id': sp.machine_id,
                    'reason': 'Downtime Design Change',
                    'duration_minutes': sp.downtime_design,
                    'start_time': base_time.isoformat(),
                    'end_time': None,
                    'downtime_category': 'design'
                })
            
            if sp.downtime_others and sp.downtime_others > 0:
                all_records.append({
                    'id': f"sp-{sp.id}-others",
                    'source': 'shift_production',
                    'machine_id': sp.machine_id,
                    'reason': sp.issues or 'Downtime Lainnya',
                    'duration_minutes': sp.downtime_others,
                    'start_time': base_time.isoformat(),
                    'end_time': None,
                    'downtime_category': 'others'
                })
        
        # Sort by start_time and limit
        all_records.sort(key=lambda x: x['start_time'] or '', reverse=True)
        all_records = all_records[:limit]
        
        return jsonify({
            'records': all_records
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/downtime', methods=['POST'])
@jwt_required()
def create_downtime():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        downtime = OEEDowntimeRecord(
            oee_record_id=data.get('oee_record_id'),
            machine_id=data['machine_id'],
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
            duration_minutes=data.get('duration_minutes'),
            downtime_category=data['downtime_category'],
            reason=data.get('reason'),
            recorded_by=user_id
        )
        
        db.session.add(downtime)
        db.session.commit()
        return jsonify(success_response('api.success')), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/shift-production/<int:id>/downtime', methods=['PUT'])
@jwt_required()
def update_shift_production_downtime(id):
    """Update downtime breakdown for a ShiftProduction record"""
    try:
        from models.production import ShiftProduction
        
        sp = ShiftProduction.query.get(id)
        if not sp:
            return jsonify({'error': 'ShiftProduction not found'}), 404
        
        data = request.get_json()
        
        # Update downtime by category
        if 'downtime_mesin' in data:
            sp.downtime_mesin = int(data['downtime_mesin'])
        if 'downtime_operator' in data:
            sp.downtime_operator = int(data['downtime_operator'])
        if 'downtime_material' in data:
            sp.downtime_material = int(data['downtime_material'])
        if 'downtime_design' in data:
            sp.downtime_design = int(data['downtime_design'])
        if 'downtime_others' in data:
            sp.downtime_others = int(data['downtime_others'])
        
        # Recalculate total downtime
        sp.downtime_minutes = (sp.downtime_mesin or 0) + (sp.downtime_operator or 0) + \
                              (sp.downtime_material or 0) + (sp.downtime_design or 0) + \
                              (sp.downtime_others or 0)
        
        # Recalculate loss percentages
        planned_runtime = sp.planned_runtime or 480
        sp.loss_mesin = round((sp.downtime_mesin or 0) / planned_runtime * 100, 2) if planned_runtime > 0 else 0
        sp.loss_operator = round((sp.downtime_operator or 0) / planned_runtime * 100, 2) if planned_runtime > 0 else 0
        sp.loss_material = round((sp.downtime_material or 0) / planned_runtime * 100, 2) if planned_runtime > 0 else 0
        sp.loss_design = round((sp.downtime_design or 0) / planned_runtime * 100, 2) if planned_runtime > 0 else 0
        sp.loss_others = round((sp.downtime_others or 0) / planned_runtime * 100, 2) if planned_runtime > 0 else 0
        
        # Recalculate efficiency and OEE
        sp.actual_runtime = planned_runtime - sp.downtime_minutes
        sp.efficiency_rate = round((sp.actual_runtime / planned_runtime * 100) if planned_runtime > 0 else 100, 2)
        sp.oee_score = round((sp.efficiency_rate * float(sp.quality_rate or 100)) / 100, 2)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Downtime updated successfully',
            'data': {
                'id': sp.id,
                'downtime_mesin': sp.downtime_mesin,
                'downtime_operator': sp.downtime_operator,
                'downtime_material': sp.downtime_material,
                'downtime_design': sp.downtime_design,
                'downtime_others': sp.downtime_others,
                'downtime_minutes': sp.downtime_minutes,
                'efficiency_rate': float(sp.efficiency_rate),
                'oee_score': float(sp.oee_score)
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/shift-production', methods=['GET'])
@jwt_required()
def get_shift_productions():
    """Get ShiftProduction records for editing"""
    try:
        from models.production import ShiftProduction
        
        machine_id = request.args.get('machine_id', type=int)
        limit = request.args.get('limit', 50, type=int)
        
        query = ShiftProduction.query
        if machine_id:
            query = query.filter(ShiftProduction.machine_id == machine_id)
        
        records = query.order_by(ShiftProduction.production_date.desc()).limit(limit).all()
        
        return jsonify({
            'records': [{
                'id': sp.id,
                'production_date': sp.production_date.isoformat() if sp.production_date else None,
                'shift': sp.shift,
                'machine_id': sp.machine_id,
                'machine_name': sp.machine.name if sp.machine else None,
                'product_name': sp.product.name if sp.product else None,
                'actual_quantity': float(sp.actual_quantity) if sp.actual_quantity else 0,
                'downtime_minutes': sp.downtime_minutes or 0,
                'downtime_mesin': sp.downtime_mesin or 0,
                'downtime_operator': sp.downtime_operator or 0,
                'downtime_material': sp.downtime_material or 0,
                'downtime_design': sp.downtime_design or 0,
                'downtime_others': sp.downtime_others or 0,
                'efficiency_rate': float(sp.efficiency_rate) if sp.efficiency_rate else 0,
                'quality_rate': float(sp.quality_rate) if sp.quality_rate else 0,
                'oee_score': float(sp.oee_score) if sp.oee_score else 0,
                'issues': sp.issues
            } for sp in records]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# ENHANCED OEE ENDPOINTS
# ===============================

@oee_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_oee_dashboard():
    """Get comprehensive OEE dashboard data from both OEERecord and ShiftProduction"""
    try:
        from models.production import ShiftProduction
        
        # Get query parameters
        machine_id_param = request.args.get('machine_id')
        machine_id = None
        if machine_id_param and machine_id_param != 'null' and machine_id_param != '':
            try:
                machine_id = int(machine_id_param)
            except (ValueError, TypeError):
                machine_id = None
        
        days = request.args.get('days', 30, type=int)
        
        # Date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get OEERecord data
        oee_query = OEERecord.query.filter(
            OEERecord.record_date.between(start_date, end_date)
        )
        if machine_id:
            oee_query = oee_query.filter(OEERecord.machine_id == machine_id)
        oee_records = oee_query.all()
        
        # Get ShiftProduction data (from WorkOrder production input)
        shift_query = ShiftProduction.query.filter(
            ShiftProduction.production_date.between(start_date, end_date)
        )
        if machine_id:
            shift_query = shift_query.filter(ShiftProduction.machine_id == machine_id)
        shift_records = shift_query.all()
        
        # Combine records for calculations
        records = oee_records  # Keep original for compatibility
        
        # Calculate overall metrics combining both sources
        all_oee_values = []
        all_availability_values = []
        all_performance_values = []
        all_quality_values = []
        
        # From OEERecord
        for r in oee_records:
            all_oee_values.append(float(r.oee) if r.oee else 0)
            all_availability_values.append(float(r.availability) if r.availability else 0)
            all_performance_values.append(float(r.performance) if r.performance else 0)
            all_quality_values.append(float(r.quality) if r.quality else 0)
        
        # From ShiftProduction
        for sp in shift_records:
            all_oee_values.append(float(sp.oee_score) if sp.oee_score else 0)
            all_availability_values.append(float(sp.efficiency_rate) if sp.efficiency_rate else 0)  # efficiency as availability proxy
            all_performance_values.append(100.0)  # Default performance
            all_quality_values.append(float(sp.quality_rate) if sp.quality_rate else 0)
        
        if all_oee_values:
            avg_oee = sum(all_oee_values) / len(all_oee_values)
            avg_availability = sum(all_availability_values) / len(all_availability_values)
            avg_performance = sum(all_performance_values) / len(all_performance_values)
            avg_quality = sum(all_quality_values) / len(all_quality_values)
            best_oee = max(all_oee_values)
            worst_oee = min(all_oee_values)
        else:
            avg_oee = avg_availability = avg_performance = avg_quality = 0
            best_oee = worst_oee = 0
        
        # Get machine performance data
        machines_query = Machine.query.filter(Machine.is_active == True)
        if machine_id:
            machines_query = machines_query.filter(Machine.id == machine_id)
        
        machines = machines_query.all()
        machine_performance = []
        
        for machine in machines:
            # From OEERecord
            machine_oee_records = [r for r in oee_records if r.machine_id == machine.id]
            # From ShiftProduction
            machine_shift_records = [sp for sp in shift_records if sp.machine_id == machine.id]
            
            # Combine OEE values
            machine_oee_values = []
            machine_downtime = 0
            machine_production = 0
            
            for r in machine_oee_records:
                machine_oee_values.append(float(r.oee) if r.oee else 0)
                machine_downtime += r.downtime or 0
                machine_production += r.total_pieces_produced or 0
            
            for sp in machine_shift_records:
                machine_oee_values.append(float(sp.oee_score) if sp.oee_score else 0)
                machine_downtime += sp.downtime_minutes or 0
                machine_production += float(sp.actual_quantity) if sp.actual_quantity else 0
            
            if machine_oee_values:
                machine_avg_oee = sum(machine_oee_values) / len(machine_oee_values)
            else:
                machine_avg_oee = 0
            
            # Get maintenance info
            next_maintenance = MaintenanceSchedule.query.filter(
                MaintenanceSchedule.machine_id == machine.id,
                MaintenanceSchedule.is_active == True,
                MaintenanceSchedule.next_maintenance_date >= date.today()
            ).order_by(MaintenanceSchedule.next_maintenance_date).first()
            
            # Get recent alerts
            recent_alerts = OEEAlert.query.filter(
                OEEAlert.machine_id == machine.id,
                OEEAlert.status == 'active'
            ).count()
            
            machine_performance.append({
                'machine_id': machine.id,
                'machine_name': machine.name,
                'machine_code': machine.code,
                'status': machine.status,
                'avg_oee': round(machine_avg_oee, 2),
                'total_downtime': machine_downtime,
                'total_production': machine_production,
                'next_maintenance': next_maintenance.next_maintenance_date.isoformat() if next_maintenance else None,
                'active_alerts': recent_alerts,
                'efficiency': float(machine.efficiency) if machine.efficiency else 100,
                'availability': float(machine.availability) if machine.availability else 100
            })
        
        # Get trend data (last 7 days) - combining both sources
        trend_data = []
        for i in range(7):
            trend_date = end_date - timedelta(days=i)
            day_oee_values = []
            
            # From OEERecord
            for r in oee_records:
                if r.record_date == trend_date:
                    day_oee_values.append(float(r.oee) if r.oee else 0)
            
            # From ShiftProduction
            for sp in shift_records:
                if sp.production_date == trend_date:
                    day_oee_values.append(float(sp.oee_score) if sp.oee_score else 0)
            
            if day_oee_values:
                day_avg_oee = sum(day_oee_values) / len(day_oee_values)
            else:
                day_avg_oee = 0
            
            trend_data.append({
                'date': trend_date.isoformat(),
                'oee': round(day_avg_oee, 2)
            })
        
        trend_data.reverse()  # Show oldest to newest
        
        # Get active alerts
        alerts_query = OEEAlert.query.filter(OEEAlert.status == 'active')
        if machine_id:
            alerts_query = alerts_query.filter(OEEAlert.machine_id == machine_id)
        
        active_alerts = alerts_query.order_by(desc(OEEAlert.alert_date)).limit(10).all()
        
        # Get downtime analysis - combining both sources
        downtime_by_category = {}
        
        # From OEEDowntimeRecord
        downtime_records = OEEDowntimeRecord.query.join(OEERecord).filter(
            OEERecord.record_date.between(start_date, end_date)
        )
        if machine_id:
            downtime_records = downtime_records.filter(OEEDowntimeRecord.machine_id == machine_id)
        
        for downtime in downtime_records.all():
            category = downtime.downtime_category or 'others'
            if category not in downtime_by_category:
                downtime_by_category[category] = 0
            downtime_by_category[category] += downtime.duration_minutes or 0
        
        # From ShiftProduction - add downtime by category
        for sp in shift_records:
            if sp.downtime_mesin and sp.downtime_mesin > 0:
                downtime_by_category['mesin'] = downtime_by_category.get('mesin', 0) + sp.downtime_mesin
            if sp.downtime_operator and sp.downtime_operator > 0:
                downtime_by_category['operator'] = downtime_by_category.get('operator', 0) + sp.downtime_operator
            if sp.downtime_material and sp.downtime_material > 0:
                downtime_by_category['material'] = downtime_by_category.get('material', 0) + sp.downtime_material
            if sp.downtime_design and sp.downtime_design > 0:
                downtime_by_category['design'] = downtime_by_category.get('design', 0) + sp.downtime_design
            if sp.downtime_others and sp.downtime_others > 0:
                downtime_by_category['others'] = downtime_by_category.get('others', 0) + sp.downtime_others
        
        return jsonify({
            'summary': {
                'avg_oee': round(avg_oee, 2),
                'avg_availability': round(avg_availability, 2),
                'avg_performance': round(avg_performance, 2),
                'avg_quality': round(avg_quality, 2),
                'best_oee': round(best_oee, 2),
                'worst_oee': round(worst_oee, 2),
                'total_records': len(oee_records) + len(shift_records),
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            },
            'machine_performance': machine_performance,
            'trend_data': trend_data,
            'active_alerts': [{
                'id': alert.id,
                'machine_name': alert.machine.name,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message,
                'alert_date': alert.alert_date.isoformat(),
                'threshold_value': float(alert.threshold_value) if alert.threshold_value else None,
                'actual_value': float(alert.actual_value) if alert.actual_value else None
            } for alert in active_alerts],
            'downtime_analysis': [
                {'category': category, 'minutes': minutes}
                for category, minutes in downtime_by_category.items()
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get OEE alerts"""
    try:
        status = request.args.get('status', 'active')
        
        # Handle machine_id parameter properly
        machine_id_param = request.args.get('machine_id')
        machine_id = None
        if machine_id_param and machine_id_param != 'null' and machine_id_param != '':
            try:
                machine_id = int(machine_id_param)
            except (ValueError, TypeError):
                machine_id = None
        
        severity = request.args.get('severity')
        
        query = OEEAlert.query
        
        if status:
            query = query.filter(OEEAlert.status == status)
        if machine_id:
            query = query.filter(OEEAlert.machine_id == machine_id)
        if severity:
            query = query.filter(OEEAlert.severity == severity)
        
        alerts = query.order_by(desc(OEEAlert.alert_date)).all()
        
        return jsonify({
            'alerts': [{
                'id': alert.id,
                'machine_id': alert.machine_id,
                'machine_name': alert.machine.name,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message,
                'threshold_value': float(alert.threshold_value) if alert.threshold_value else None,
                'actual_value': float(alert.actual_value) if alert.actual_value else None,
                'alert_date': alert.alert_date.isoformat(),
                'status': alert.status,
                'acknowledged_by': alert.acknowledged_by_user.username if alert.acknowledged_by_user else None,
                'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                'resolved_by': alert.resolved_by_user.username if alert.resolved_by_user else None,
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
            } for alert in alerts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/alerts/<int:alert_id>/acknowledge', methods=['PUT'])
@jwt_required()
def acknowledge_alert(alert_id):
    """Acknowledge an OEE alert"""
    try:
        user_id = get_jwt_identity()
        alert = OEEAlert.query.get_or_404(alert_id)
        
        alert.status = 'acknowledged'
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve an OEE alert"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        alert = OEEAlert.query.get_or_404(alert_id)
        
        alert.status = 'resolved'
        alert.resolved_by = user_id
        alert.resolved_at = datetime.utcnow()
        alert.resolution_notes = data.get('resolution_notes', '')
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/maintenance-impact', methods=['POST'])
@jwt_required()
def create_maintenance_impact():
    """Create maintenance impact record"""
    try:
        data = request.get_json()
        
        impact = MaintenanceImpact(
            maintenance_record_id=data['maintenance_record_id'],
            machine_id=data['machine_id'],
            impact_date=datetime.strptime(data['impact_date'], '%Y-%m-%d').date(),
            planned_downtime_hours=data.get('planned_downtime_hours', 0),
            actual_downtime_hours=data.get('actual_downtime_hours', 0),
            production_loss_units=data.get('production_loss_units', 0),
            revenue_impact=data.get('revenue_impact', 0),
            oee_before_maintenance=data.get('oee_before_maintenance'),
            oee_after_maintenance=data.get('oee_after_maintenance'),
            notes=data.get('notes')
        )
        
        # Calculate improvement percentage
        if impact.oee_before_maintenance and impact.oee_after_maintenance:
            impact.improvement_percentage = float(impact.oee_after_maintenance) - float(impact.oee_before_maintenance)
        
        db.session.add(impact)
        db.session.commit()
        
        return jsonify({
            'message': 'Maintenance impact recorded successfully',
            'impact_id': impact.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@oee_bp.route('/machines/<int:machine_id>/analytics', methods=['GET'])
@jwt_required()
def get_machine_analytics(machine_id):
    """Get detailed analytics for a specific machine"""
    try:
        machine = Machine.query.get_or_404(machine_id)
        
        # Get query parameters
        period = request.args.get('period', 'monthly')  # daily, weekly, monthly
        months = request.args.get('months', 6, type=int)
        
        # Get analytics data
        analytics = OEEAnalytics.query.filter(
            OEEAnalytics.machine_id == machine_id,
            OEEAnalytics.period_type == period
        ).order_by(desc(OEEAnalytics.analysis_date)).limit(months).all()
        
        # Get maintenance impact data
        maintenance_impacts = MaintenanceImpact.query.filter(
            MaintenanceImpact.machine_id == machine_id
        ).order_by(desc(MaintenanceImpact.impact_date)).limit(10).all()
        
        # Get recent OEE records for detailed view
        recent_records = OEERecord.query.filter(
            OEERecord.machine_id == machine_id
        ).order_by(desc(OEERecord.record_date)).limit(30).all()
        
        # Calculate trends
        if len(analytics) >= 2:
            latest = analytics[0]
            previous = analytics[1]
            oee_trend = float(latest.avg_oee) - float(previous.avg_oee)
            availability_trend = float(latest.avg_availability) - float(previous.avg_availability)
            performance_trend = float(latest.avg_performance) - float(previous.avg_performance)
            quality_trend = float(latest.avg_quality) - float(previous.avg_quality)
        else:
            oee_trend = availability_trend = performance_trend = quality_trend = 0
        
        return jsonify({
            'machine': {
                'id': machine.id,
                'name': machine.name,
                'code': machine.code,
                'type': machine.machine_type,
                'status': machine.status,
                'capacity_per_hour': float(machine.capacity_per_hour) if machine.capacity_per_hour else None,
                'last_maintenance': machine.last_maintenance.isoformat() if machine.last_maintenance else None,
                'next_maintenance': machine.next_maintenance.isoformat() if machine.next_maintenance else None
            },
            'trends': {
                'oee_trend': round(oee_trend, 2),
                'availability_trend': round(availability_trend, 2),
                'performance_trend': round(performance_trend, 2),
                'quality_trend': round(quality_trend, 2)
            },
            'analytics': [{
                'date': a.analysis_date.isoformat(),
                'period_type': a.period_type,
                'avg_oee': float(a.avg_oee),
                'avg_availability': float(a.avg_availability),
                'avg_performance': float(a.avg_performance),
                'avg_quality': float(a.avg_quality),
                'total_downtime_hours': float(a.total_downtime_hours),
                'total_production_hours': float(a.total_production_hours),
                'total_units_produced': float(a.total_units_produced),
                'defect_rate': float(a.defect_rate),
                'maintenance_hours': float(a.maintenance_hours),
                'breakdown_count': a.breakdown_count
            } for a in analytics],
            'maintenance_impacts': [{
                'date': mi.impact_date.isoformat(),
                'planned_downtime': float(mi.planned_downtime_hours),
                'actual_downtime': float(mi.actual_downtime_hours),
                'production_loss': float(mi.production_loss_units),
                'revenue_impact': float(mi.revenue_impact),
                'oee_before': float(mi.oee_before_maintenance) if mi.oee_before_maintenance else None,
                'oee_after': float(mi.oee_after_maintenance) if mi.oee_after_maintenance else None,
                'improvement': float(mi.improvement_percentage) if mi.improvement_percentage else None
            } for mi in maintenance_impacts],
            'recent_records': [{
                'date': r.record_date.isoformat(),
                'shift': r.shift,
                'oee': float(r.oee),
                'availability': float(r.availability),
                'performance': float(r.performance),
                'quality': float(r.quality),
                'downtime': r.downtime,
                'total_pieces': r.total_pieces_produced,
                'good_pieces': r.good_pieces
            } for r in recent_records]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
