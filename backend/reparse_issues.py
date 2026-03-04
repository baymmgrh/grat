"""
Reparse all ShiftProduction.issues to fix category tags using detect_downtime_category.
This fixes entries like 'Baut stacking lepas [others]' -> 'Baut stacking lepas [mesin]'
"""
import re
from app import create_app
from utils.helpers import detect_downtime_category

app = create_app()

with app.app_context():
    from models import db, ShiftProduction

    records = ShiftProduction.query.filter(ShiftProduction.issues.isnot(None)).all()
    print(f"Total records with issues: {len(records)}")

    total_fixed = 0
    changes = []

    for sp in records:
        original = sp.issues
        parts = [p.strip() for p in original.split(';') if p.strip()]
        new_parts = []
        record_changed = False

        for i, part in enumerate(parts):
            match = re.match(r'(\d+)\s*menit\s*-\s*(.+?)(?:\s*\[(\w+)\])?\s*$', part, re.IGNORECASE)
            if match:
                duration = match.group(1)
                reason = match.group(2).strip()
                old_cat = match.group(3) or 'others'

                # Detect correct category
                is_first = (i == 0)
                new_cat = detect_downtime_category(reason, is_first_entry=is_first)

                # idle -> keep as idle tag
                if new_cat == 'idle':
                    new_cat_tag = 'idle'
                else:
                    new_cat_tag = new_cat

                if old_cat.lower() != new_cat_tag.lower():
                    record_changed = True
                    changes.append({
                        'sp_id': sp.id,
                        'date': str(sp.production_date),
                        'reason': reason,
                        'old': old_cat,
                        'new': new_cat_tag
                    })

                new_parts.append(f"{duration} menit - {reason} [{new_cat_tag}]")
            else:
                new_parts.append(part)

        if record_changed:
            new_issues = '; '.join(new_parts)
            
            # Recalculate downtime by category
            dt_mesin = 0
            dt_operator = 0
            dt_material = 0
            dt_design = 0
            dt_others = 0
            dt_idle = 0

            for part in new_parts:
                m = re.match(r'(\d+)\s*menit\s*-\s*.+?\[(\w+)\]', part, re.IGNORECASE)
                if m:
                    dur = int(m.group(1))
                    cat = m.group(2).lower()
                    if cat == 'mesin':
                        dt_mesin += dur
                    elif cat == 'operator':
                        dt_operator += dur
                    elif cat == 'material':
                        dt_material += dur
                    elif cat == 'design':
                        dt_design += dur
                    elif cat == 'idle':
                        dt_idle += dur
                    else:
                        dt_others += dur

            sp.issues = new_issues
            sp.downtime_mesin = dt_mesin
            sp.downtime_operator = dt_operator
            sp.downtime_material = dt_material
            sp.downtime_design = dt_design
            sp.downtime_others = dt_others
            sp.idle_time = dt_idle
            sp.downtime_minutes = dt_mesin + dt_operator + dt_material + dt_design + dt_others

            # Recalculate loss percentages
            planned = sp.planned_runtime or 480
            if planned > 0:
                sp.loss_mesin = round(dt_mesin / planned * 100, 2)
                sp.loss_operator = round(dt_operator / planned * 100, 2)
                sp.loss_material = round(dt_material / planned * 100, 2)
                sp.loss_design = round(dt_design / planned * 100, 2)
                sp.loss_others = round(dt_others / planned * 100, 2)

            total_fixed += 1

    print(f"\n=== Changes to be made: {len(changes)} ===")
    for c in changes:
        print(f"  SP#{c['sp_id']} ({c['date']}): \"{c['reason']}\" [{c['old']}] -> [{c['new']}]")

    if total_fixed > 0:
        confirm = input(f"\nApply {total_fixed} record updates? (y/n): ")
        if confirm.lower() == 'y':
            db.session.commit()
            print(f"Done! {total_fixed} records updated.")
        else:
            db.session.rollback()
            print("Cancelled.")
    else:
        print("No changes needed.")
