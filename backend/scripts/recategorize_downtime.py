"""
Script to recategorize existing downtime entries to add 'idle' category
for entries with 'tunggu' keywords.

Also updates 'inkjet' and 'setting mesin' categorization.

Run this script from the backend folder:
    python scripts/recategorize_downtime.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db
from models.production import ShiftProduction
import re

# IDLE TIME keywords - waiting for materials/resources
IDLE_KEYWORDS = [
    'tunggu kain', 'tunggu stiker', 'tunggu packaging', 'tunggu mixing',
    'tunggu bahan', 'tunggu material', 'tunggu label', 'tunggu box',
    'tunggu karton', 'tunggu lem', 'tunggu tinta', 'tunggu order',
    'menunggu kain', 'menunggu stiker', 'menunggu packaging', 'menunggu mixing',
    'nunggu kain', 'nunggu stiker', 'nunggu packaging', 'nunggu mixing',
    'waiting for', 'standby'
]

# INKJET keywords - should be categorized as mesin
INKJET_KEYWORDS = [
    'inkjet', 'ink jet', 'ink-jet', 'inkjet error', 'inkjet macet',
    'printer inkjet', 'head inkjet', 'tinta inkjet', 'cartridge inkjet'
]


def detect_category(reason_text, is_first_entry=False):
    """Detect the correct category for a downtime reason."""
    if not reason_text:
        return None
    
    text_lower = reason_text.lower()
    
    # Check for IDLE keywords first (highest priority)
    for kw in IDLE_KEYWORDS:
        if kw in text_lower:
            return 'idle'
    
    # Check for INKJET keywords -> mesin
    for kw in INKJET_KEYWORDS:
        if kw in text_lower:
            return 'mesin'
    
    # SETTING MC/MESIN special case
    if 'setting mc' in text_lower or 'setting mesin' in text_lower:
        return 'design' if is_first_entry else 'mesin'
    
    return None  # No change needed


def recategorize_issues(issues_string):
    """
    Recategorize downtime entries in issues string.
    Format: "60 menit - Tunggu kain [material]; 30 menit - Inkjet error [others]"
    Returns: Updated issues string with corrected categories
    """
    if not issues_string:
        return issues_string, 0
    
    parts = issues_string.split(';')
    updated_parts = []
    changes_made = 0
    
    for idx, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        
        # Parse: "60 menit - Reason text [category]"
        match = re.match(r'(\d+\s*menit\s*-\s*)(.+?)(\s*\[(\w+)\])$', part, re.IGNORECASE)
        if match:
            prefix = match.group(1)  # "60 menit - "
            reason = match.group(2).strip()  # "Tunggu kain"
            old_category = match.group(4)  # "material"
            
            # Check if needs recategorization
            is_first_entry = (idx == 0)
            new_category = detect_category(reason, is_first_entry)
            
            if new_category and new_category != old_category:
                updated_parts.append(f"{prefix}{reason} [{new_category}]")
                changes_made += 1
                print(f"  Changed: '{reason}' from [{old_category}] to [{new_category}]")
            else:
                updated_parts.append(part)
        else:
            # No match, keep as is
            updated_parts.append(part)
    
    return '; '.join(updated_parts), changes_made


def main():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("RECATEGORIZING DOWNTIME ENTRIES")
        print("=" * 60)
        print()
        
        # Get all ShiftProduction records with issues
        records = ShiftProduction.query.filter(
            ShiftProduction.issues.isnot(None),
            ShiftProduction.issues != ''
        ).all()
        
        print(f"Found {len(records)} records with downtime issues")
        print()
        
        total_changes = 0
        records_updated = 0
        
        for record in records:
            updated_issues, changes = recategorize_issues(record.issues)
            
            if changes > 0:
                print(f"Record ID {record.id} (Date: {record.production_date}):")
                record.issues = updated_issues
                total_changes += changes
                records_updated += 1
        
        if total_changes > 0:
            print()
            print(f"Total changes: {total_changes} in {records_updated} records")
            
            # Confirm before committing
            confirm = input("\nCommit changes to database? (y/n): ")
            if confirm.lower() == 'y':
                db.session.commit()
                print("Changes committed successfully!")
            else:
                db.session.rollback()
                print("Changes rolled back.")
        else:
            print("No changes needed - all entries are correctly categorized.")
        
        print()
        print("=" * 60)
        print("DONE")
        print("=" * 60)


if __name__ == '__main__':
    main()
