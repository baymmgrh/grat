import sys, re
sys.path.insert(0, '.')
from app import create_app, db
from models.production import ShiftProduction
from utils.helpers import detect_downtime_category

app = create_app()
with app.app_context():
    records = ShiftProduction.query.filter(
        ShiftProduction.issues.isnot(None), 
        ShiftProduction.issues != ''
    ).all()
    
    updated = 0
    for sp in records:
        original = sp.issues
        parts = original.split(';')
        new_parts = []
        changed = False
        dt_mesin = 0
        dt_operator = 0
        dt_material = 0
        dt_design = 0
        dt_others = 0
        idle = 0
        
        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            m = re.match(r'(\d+)\s*menit\s*-\s*(.+?)(?:\s*\[(\w+)\])?\s*$', part)
            if m:
                mins = int(m.group(1))
                reason = m.group(2).strip()
                old_cat = m.group(3)
                new_cat = detect_downtime_category(reason, is_first_entry=(i == 0))
                new_part = f'{mins} menit - {reason} [{new_cat}]'
                new_parts.append(new_part)
                
                if new_cat == 'mesin': dt_mesin += mins
                elif new_cat == 'operator': dt_operator += mins
                elif new_cat == 'material': dt_material += mins
                elif new_cat == 'design': dt_design += mins
                elif new_cat == 'idle': idle += mins
                else: dt_others += mins
                
                if old_cat != new_cat:
                    changed = True
                    print(f'  SP#{sp.id} [{old_cat}] -> [{new_cat}]: {reason}')
            else:
                new_parts.append(part)
        
        if changed:
            sp.issues = '; '.join(new_parts)
            sp.downtime_mesin = dt_mesin
            sp.downtime_operator = dt_operator
            sp.downtime_material = dt_material
            sp.downtime_design = dt_design
            sp.downtime_others = dt_others
            sp.idle_time = idle
            updated += 1
    
    db.session.commit()
    print(f'\nTotal records fixed: {updated}')
