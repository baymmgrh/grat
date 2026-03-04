"""
Script to update existing materials with correct categories based on their names.
Run this script once to categorize existing materials in the database.

Usage: python scripts/update_material_categories.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db, Material

# Category mapping based on material name keywords
CATEGORY_MAPPINGS = {
    # Kain group (fabric materials)
    'main_roll': ['mr ', 'main roll', 'mainroll'],
    'jumbo_roll': ['jr ', 'jumbo roll', 'jumboroll'],
    'spunbond': ['spunbond', 'spun bond', 'spun-bond'],
    'meltblown': ['meltblown', 'melt blown', 'melt-blown', 'mb '],
    'kain': ['kain ', 'fabric'],
    'nonwoven': ['nonwoven', 'non woven', 'non-woven'],
    
    # Packaging group
    'packaging': ['packaging', 'kemasan'],
    'carton_box': ['carton', 'karton', 'box', 'dus'],
    'inner_box': ['inner box', 'inner'],
    'jerigen': ['jerigen', 'jerry', 'gallon'],
    'botol': ['botol', 'bottle'],
    
    # Aksesoris group
    'stc': ['stc', 'sticker', 'label'],
    'fliptop': ['fliptop', 'flip top', 'flip-top', 'tutup'],
    'plastik': ['plastik', 'plastic', 'polybag', 'shrink', 'wrap'],
    
    # Chemical group
    'parfum': ['parfum', 'parfume', 'fragrance', 'pewangi'],
    'chemical': ['chemical', 'kimia', 'additive', 'surfactant', 'preservative'],
    
    # Raw material group
    'tissue': ['tissue', 'tisu'],
}

def get_category_for_material(material):
    """Determine category based on material name and type"""
    name_lower = (material.name or '').lower()
    code_lower = (material.code or '').lower()
    desc_lower = (material.description or '').lower()
    
    # Check each category's keywords
    for category, keywords in CATEGORY_MAPPINGS.items():
        for keyword in keywords:
            if keyword in name_lower or keyword in code_lower or keyword in desc_lower:
                return category
    
    # Default based on material_type if no keyword match
    if material.material_type == 'packaging_materials':
        return 'packaging'
    elif material.material_type == 'chemical_materials':
        return 'chemical'
    elif material.material_type == 'raw_materials':
        return 'other_raw'
    
    return 'other_raw'

def update_material_categories():
    """Update all materials with appropriate categories"""
    app = create_app()
    
    with app.app_context():
        materials = Material.query.all()
        updated_count = 0
        
        print(f"Found {len(materials)} materials to process...")
        print("-" * 60)
        
        for material in materials:
            old_category = material.category
            new_category = get_category_for_material(material)
            
            # Only update if category is empty or different
            if not old_category or old_category != new_category:
                material.category = new_category
                updated_count += 1
                print(f"[{material.code}] {material.name}")
                print(f"  Type: {material.material_type}")
                print(f"  Category: {old_category or '(empty)'} -> {new_category}")
                print()
        
        if updated_count > 0:
            db.session.commit()
            print("-" * 60)
            print(f"✅ Updated {updated_count} materials with new categories")
        else:
            print("No materials needed updating")

if __name__ == '__main__':
    update_material_categories()
