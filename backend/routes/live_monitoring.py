from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from models import db, Machine, LiveMonitoringCheck, ShiftProduction, WorkOrder, Product

live_monitoring_bp = Blueprint('live_monitoring', __name__)

# Shift config: expected machine start time (30 min after shift start for setup)
# Check slots: every 2 hours from machine expected start
# Break times: machines expected to stop
SHIFT_CONFIG = {
    'shift_1': {
        'label': 'Shift 1 (07:00 - 15:00)',
        'start': '07:00',
        'end': '15:00',
        'machine_expected_start': '07:30',
        'break_start': '12:00',
        'break_end': '13:00',
        'slots': [
            {'slot': 1, 'label': '07:30', 'desc': 'Cek awal - mesin harus sudah jalan'},
            {'slot': 2, 'label': '09:30', 'desc': 'Cek 2 jam pertama'},
            {'slot': 3, 'label': '11:30', 'desc': 'Cek sebelum istirahat'},
            {'slot': 4, 'label': '14:00', 'desc': 'Cek setelah istirahat'},
        ],
    },
    'shift_2': {
        'label': 'Shift 2 (15:00 - 23:00)',
        'start': '15:00',
        'end': '23:00',
        'machine_expected_start': '15:30',
        'break_start': '18:00',
        'break_end': '18:30',
        'slots': [
            {'slot': 1, 'label': '15:30', 'desc': 'Cek awal - mesin harus sudah jalan'},
            {'slot': 2, 'label': '17:30', 'desc': 'Cek 2 jam pertama'},
            {'slot': 3, 'label': '19:30', 'desc': 'Cek setelah istirahat'},
            {'slot': 4, 'label': '21:30', 'desc': 'Cek 2 jam terakhir'},
        ],
    },
    'shift_3': {
        'label': 'Shift 3 (23:00 - 07:00)',
        'start': '23:00',
        'end': '07:00',
        'machine_expected_start': '23:30',
        'break_start': '03:00',
        'break_end': '03:30',
        'slots': [
            {'slot': 1, 'label': '23:30', 'desc': 'Cek awal - mesin harus sudah jalan'},
            {'slot': 2, 'label': '01:30', 'desc': 'Cek 2 jam pertama'},
            {'slot': 3, 'label': '03:30', 'desc': 'Cek setelah istirahat'},
            {'slot': 4, 'label': '05:30', 'desc': 'Cek 2 jam terakhir'},
        ],
    },
}


def calc_duration_minutes(time_from, time_to):
    """Calculate duration in minutes between two HH:MM strings"""
    if not time_from or not time_to:
        return 0
    try:
        t1 = datetime.strptime(time_from, '%H:%M')
        t2 = datetime.strptime(time_to, '%H:%M')
        diff = (t2 - t1).total_seconds() / 60
        if diff < 0:
            diff += 24 * 60  # overnight
        return int(diff)
    except:
        return 0


@live_monitoring_bp.route('/dashboard', methods=['GET'])
@jwt_required(optional=True)
def get_live_monitoring_dashboard():
    """Get live monitoring dashboard - only machines with assignments (from ShiftProduction)"""
    try:
        check_date_str = request.args.get('date', date.today().isoformat())
        shift = request.args.get('shift', 'shift_1')
        check_date = datetime.strptime(check_date_str, '%Y-%m-%d').date()
        
        config = SHIFT_CONFIG.get(shift, SHIFT_CONFIG['shift_1'])
        slots = config['slots']
        
        # Only get machines that have ShiftProduction for this date+shift
        shift_prods = ShiftProduction.query.filter_by(
            production_date=check_date,
            shift=shift
        ).all()
        
        # Group by machine
        sp_by_machine = {}
        machine_ids = set()
        for sp in shift_prods:
            machine_ids.add(sp.machine_id)
            if sp.machine_id not in sp_by_machine:
                sp_by_machine[sp.machine_id] = []
            sp_by_machine[sp.machine_id].append({
                'id': sp.id,
                'product_name': sp.product.name if sp.product else 'Unknown',
                'product_id': sp.product_id,
                'work_order_id': sp.work_order_id,
                'wo_number': sp.work_order.wo_number if sp.work_order else None,
                'target_quantity': float(sp.target_quantity or 0),
                'actual_quantity': float(sp.actual_quantity or 0),
                'good_quantity': float(sp.good_quantity or 0),
                'reject_quantity': float(sp.reject_quantity or 0),
                'planned_runtime': sp.planned_runtime or 0,
                'actual_runtime': sp.actual_runtime or 0,
                'downtime_minutes': (
                    (sp.downtime_mesin or 0) + (sp.downtime_operator or 0) +
                    (sp.downtime_material or 0) + (sp.downtime_design or 0) + (sp.downtime_others or 0)
                ),
                'idle_time': sp.idle_time or 0,
            })
        
        # Get assigned machines only
        machines = Machine.query.filter(Machine.id.in_(machine_ids)).order_by(Machine.code).all() if machine_ids else []
        
        # Get existing checks
        checks = LiveMonitoringCheck.query.filter_by(
            check_date=check_date, shift=shift
        ).all()
        
        check_map = {}
        for c in checks:
            key = f"{c.machine_id}_{c.time_slot}"
            check_map[key] = c.to_dict()
        
        # Build machine grid
        machine_grid = []
        total_stop_minutes = 0
        
        for m in machines:
            sp_info = sp_by_machine.get(m.id, [])
            first_sp = sp_info[0] if sp_info else {}
            
            machine_slots = []
            machine_stop_min = 0
            for s in slots:
                key = f"{m.id}_{s['slot']}"
                check_data = check_map.get(key, None)
                if check_data and check_data.get('stop_duration_minutes', 0) > 0:
                    machine_stop_min += check_data['stop_duration_minutes']
                machine_slots.append({
                    'slot': s['slot'],
                    'label': s['label'],
                    'desc': s['desc'],
                    'checked': check_data is not None,
                    'data': check_data
                })
            
            total_stop_minutes += machine_stop_min
            
            machine_grid.append({
                'machine_id': m.id,
                'machine_code': m.code,
                'machine_name': m.name,
                'machine_type': m.machine_type,
                'shift_productions': sp_info,
                'wo_number': first_sp.get('wo_number', '-'),
                'product_name': first_sp.get('product_name', '-'),
                'product_id': first_sp.get('product_id'),
                'work_order_id': first_sp.get('work_order_id'),
                'slots': machine_slots,
                'checks_completed': sum(1 for s in machine_slots if s['checked']),
                'total_slots': len(slots),
                'total_stop_minutes': machine_stop_min,
            })
        
        # Summary
        total_checks = sum(1 for c in checks if c.machine_id in machine_ids)
        total_possible = len(machines) * len(slots)
        running_count = sum(1 for c in checks if c.machine_id in machine_ids and c.machine_status == 'running')
        stopped_count = sum(1 for c in checks if c.machine_id in machine_ids and c.machine_status == 'stopped')
        delayed_count = sum(1 for c in checks if c.machine_id in machine_ids and c.start_delayed)
        
        return jsonify({
            'success': True,
            'data': {
                'date': check_date.isoformat(),
                'shift': shift,
                'shift_label': config['label'],
                'machine_expected_start': config['machine_expected_start'],
                'break_start': config['break_start'],
                'break_end': config['break_end'],
                'slots': slots,
                'machines': machine_grid,
                'summary': {
                    'total_machines': len(machines),
                    'total_checks': total_checks,
                    'total_possible': total_possible,
                    'completion_pct': round(total_checks / total_possible * 100, 1) if total_possible > 0 else 0,
                    'running_count': running_count,
                    'stopped_count': stopped_count,
                    'delayed_count': delayed_count,
                    'total_stop_minutes': total_stop_minutes,
                },
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@live_monitoring_bp.route('/check', methods=['POST'])
@jwt_required(optional=True)
def save_check():
    """Save or update a single machine check"""
    try:
        data = request.get_json()
        check_date = datetime.strptime(data['check_date'], '%Y-%m-%d').date()
        shift = data['shift']
        time_slot = int(data['time_slot'])
        machine_id = int(data['machine_id'])
        
        config = SHIFT_CONFIG.get(shift, SHIFT_CONFIG['shift_1'])
        slot_info = next((s for s in config['slots'] if s['slot'] == time_slot), config['slots'][0])
        
        # Find existing or create new
        check = LiveMonitoringCheck.query.filter_by(
            check_date=check_date, shift=shift,
            time_slot=time_slot, machine_id=machine_id
        ).first()
        
        if not check:
            check = LiveMonitoringCheck(
                check_date=check_date, shift=shift,
                time_slot=time_slot, machine_id=machine_id,
                slot_label=slot_info['label'],
            )
            db.session.add(check)
        
        status = data.get('machine_status', 'running')
        check.machine_status = status
        check.product_id = data.get('product_id')
        check.work_order_id = data.get('work_order_id')
        check.wo_number = data.get('wo_number', '')
        check.product_name = data.get('product_name', '')
        check.notes = data.get('notes', '')
        
        # Stop info
        if status == 'stopped':
            stop_from = data.get('stop_from', '')
            stop_to = data.get('stop_to', '')
            check.stop_from = stop_from
            check.stop_to = stop_to
            check.stop_duration_minutes = calc_duration_minutes(stop_from, stop_to)
            check.stop_reason = data.get('stop_reason', '')
            check.stop_category = data.get('stop_category', '')
        else:
            check.stop_from = None
            check.stop_to = None
            check.stop_duration_minutes = 0
            check.stop_reason = None
            check.stop_category = None
        
        # Machine start time (only for slot 1)
        if time_slot == 1:
            actual_start = data.get('actual_start_time', '')
            check.actual_start_time = actual_start
            expected = config['machine_expected_start']
            if actual_start and expected:
                check.start_delayed = actual_start > expected
            else:
                check.start_delayed = False
        
        check.checked_by = get_jwt_identity() if get_jwt_identity() else None
        check.checked_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Check saved',
            'data': check.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@live_monitoring_bp.route('/mismatches', methods=['GET'])
@jwt_required(optional=True)
def get_mismatches():
    """Compare live checks with shift production input → find mismatches"""
    try:
        check_date_str = request.args.get('date', date.today().isoformat())
        shift = request.args.get('shift', 'shift_1')
        check_date = datetime.strptime(check_date_str, '%Y-%m-%d').date()
        
        checks = LiveMonitoringCheck.query.filter_by(check_date=check_date, shift=shift).all()
        shift_prods = ShiftProduction.query.filter_by(production_date=check_date, shift=shift).all()
        
        sp_by_machine = {}
        for sp in shift_prods:
            sp_by_machine.setdefault(sp.machine_id, []).append(sp)
        
        checks_by_machine = {}
        for c in checks:
            checks_by_machine.setdefault(c.machine_id, []).append(c)
        
        mismatches = []
        
        for machine_id, machine_checks in checks_by_machine.items():
            sp_list = sp_by_machine.get(machine_id, [])
            mname = machine_checks[0].machine.name if machine_checks[0].machine else f'Machine {machine_id}'
            
            # 1. Delayed start
            slot1 = next((c for c in machine_checks if c.time_slot == 1), None)
            if slot1 and slot1.start_delayed:
                mismatches.append({
                    'type': 'start_delayed',
                    'severity': 'medium',
                    'machine_name': mname,
                    'description': f'{mname}: Mesin terlambat mulai. Start aktual: {slot1.actual_start_time}, seharusnya: {SHIFT_CONFIG.get(shift, {}).get("machine_expected_start", "07:30")}',
                })
            
            # 2. Stopped checks - compare total stop minutes with input downtime
            stopped_checks = [c for c in machine_checks if c.machine_status == 'stopped']
            live_stop_min = sum(c.stop_duration_minutes or 0 for c in stopped_checks)
            # Exclude istirahat stops
            live_stop_min_excl_break = sum(
                c.stop_duration_minutes or 0 for c in stopped_checks
                if c.stop_category != 'istirahat'
            )
            
            if sp_list and live_stop_min_excl_break > 0:
                # Sum downtime across ALL ShiftProduction records (multi-product per shift)
                sp_dt = sum(
                    (sp.downtime_mesin or 0) + (sp.downtime_operator or 0) +
                    (sp.downtime_material or 0) + (sp.downtime_design or 0) + (sp.downtime_others or 0)
                    for sp in sp_list
                )
                sp_idle = sum(sp.idle_time or 0 for sp in sp_list)
                sp_total = sp_dt + sp_idle
                diff = abs(live_stop_min_excl_break - sp_total)
                
                if diff > 30:
                    mismatches.append({
                        'type': 'downtime_mismatch',
                        'severity': 'high' if diff > 60 else 'medium',
                        'machine_name': mname,
                        'description': f'{mname}: Live stop total {live_stop_min_excl_break} menit (excl istirahat), Input produksi: DT {sp_dt}m + Idle {sp_idle}m = {sp_total}m. Selisih: {diff} menit.',
                        'live_stop_min': live_stop_min_excl_break,
                        'input_total_min': sp_total,
                        'difference_min': diff,
                        'stops': [
                            {'from': c.stop_from, 'to': c.stop_to, 'dur': c.stop_duration_minutes, 'reason': c.stop_reason}
                            for c in stopped_checks if c.stop_category != 'istirahat'
                        ],
                    })
            
            # 3. No input but machine was monitored as running
            running_checks = [c for c in machine_checks if c.machine_status == 'running']
            if running_checks and not sp_list:
                mismatches.append({
                    'type': 'running_no_input',
                    'severity': 'high',
                    'machine_name': mname,
                    'description': f'{mname}: Live monitoring RUNNING di {len(running_checks)} slot, tapi belum ada input produksi.',
                })
        
        # 4. Has shift production but no live check at all
        for mid, sp_list in sp_by_machine.items():
            if mid not in checks_by_machine:
                mname = sp_list[0].machine.name if sp_list[0].machine else f'Machine {mid}'
                mismatches.append({
                    'type': 'no_live_check',
                    'severity': 'low',
                    'machine_name': mname,
                    'description': f'{mname}: Ada input produksi tapi belum dicek sama sekali di live monitoring.',
                })
        
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        mismatches.sort(key=lambda x: severity_order.get(x['severity'], 3))
        
        return jsonify({
            'success': True,
            'data': {
                'date': check_date.isoformat(),
                'shift': shift,
                'total_mismatches': len(mismatches),
                'by_severity': {
                    'high': sum(1 for m in mismatches if m['severity'] == 'high'),
                    'medium': sum(1 for m in mismatches if m['severity'] == 'medium'),
                    'low': sum(1 for m in mismatches if m['severity'] == 'low'),
                },
                'mismatches': mismatches,
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@live_monitoring_bp.route('/mismatch-count', methods=['GET'])
@jwt_required(optional=True)
def get_mismatch_count():
    """Quick count for badge"""
    try:
        check_date_str = request.args.get('date', date.today().isoformat())
        shift = request.args.get('shift', 'shift_1')
        check_date = datetime.strptime(check_date_str, '%Y-%m-%d').date()
        
        checks = LiveMonitoringCheck.query.filter_by(check_date=check_date, shift=shift).all()
        shift_prods = ShiftProduction.query.filter_by(production_date=check_date, shift=shift).all()
        
        sp_by_machine = {sp.machine_id: sp for sp in shift_prods}
        checks_by_machine = {}
        for c in checks:
            checks_by_machine.setdefault(c.machine_id, []).append(c)
        
        count = 0
        for mid, mchecks in checks_by_machine.items():
            sp = sp_by_machine.get(mid)
            slot1 = next((c for c in mchecks if c.time_slot == 1), None)
            if slot1 and slot1.start_delayed:
                count += 1
            stopped = [c for c in mchecks if c.machine_status == 'stopped' and c.stop_category != 'istirahat']
            if sp and stopped:
                live_min = sum(c.stop_duration_minutes or 0 for c in stopped)
                sp_total = (sp.downtime_mesin or 0) + (sp.downtime_operator or 0) + (sp.downtime_material or 0) + \
                           (sp.downtime_design or 0) + (sp.downtime_others or 0) + (sp.idle_time or 0)
                if abs(live_min - sp_total) > 30:
                    count += 1
            running = [c for c in mchecks if c.machine_status == 'running']
            if running and not sp:
                count += 1
        
        for mid in sp_by_machine:
            if mid not in checks_by_machine:
                count += 1
        
        return jsonify({'success': True, 'count': count}), 200
    except:
        return jsonify({'success': True, 'count': 0}), 200
