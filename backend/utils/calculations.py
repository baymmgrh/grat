"""
Utility functions for nonwoven manufacturing calculations
"""
import math
from typing import Dict, Optional

# UOM Conversion factors (base unit is Kg for weight, Meter for length)
UOM_CONVERSIONS = {
    # Weight conversions (base: Kg)
    'kg': 1.0,
    'gram': 0.001,
    'ton': 1000.0,
    'mg': 0.000001,

    # Length conversions (base: Meter)
    'meter': 1.0,
    'cm': 0.01,
    'mm': 0.001,
    'km': 1000.0,
    'inch': 0.0254,
    'foot': 0.3048,
    'yard': 0.9144,

    # Area conversions (base: Square Meter)
    'm2': 1.0,
    'cm2': 0.0001,
    'mm2': 0.000001,
    'inch2': 0.00064516,
    'foot2': 0.092903,
    'yard2': 0.836127,

    # Volume conversions (base: Liter)
    'liter': 1.0,
    'ml': 0.001,
    'm3': 1000.0,
    'cm3': 0.001,
    'inch3': 0.016387,
    'foot3': 28.3168,
    'gallon': 3.78541,

    # Count/Piece conversions
    'pcs': 1.0,
    'pack': 1.0,
    'sheet': 1.0,
    'karton': 1.0,
    'roll': 1.0,
}

# Nonwoven categories with specifications
NONWOVEN_CATEGORIES = {
    'wet_tissue': {
        'name': 'Wet Tissue',
        'typical_gsm_range': (40, 80),
        'typical_width_range': (10, 30),  # cm
        'typical_length_range': (15, 25),  # cm per sheet
        'weight_per_sheet_range': (1, 3)  # grams
    },
    'dry_tissue': {
        'name': 'Dry Tissue',
        'typical_gsm_range': (12, 25),
        'typical_width_range': (10, 30),
        'typical_length_range': (15, 25),
        'weight_per_sheet_range': (0.3, 1.0)
    },
    'antiseptic': {
        'name': 'Antiseptic Tissue',
        'typical_gsm_range': (35, 70),
        'typical_width_range': (10, 30),
        'typical_length_range': (15, 25),
        'weight_per_sheet_range': (1, 2.5)
    },
    'sanitizer': {
        'name': 'Sanitizer Tissue',
        'typical_gsm_range': (35, 70),
        'typical_width_range': (10, 30),
        'typical_length_range': (15, 25),
        'weight_per_sheet_range': (1, 2.5)
    },
    'paper_towel': {
        'name': 'Paper Towel',
        'typical_gsm_range': (20, 45),
        'typical_width_range': (20, 35),
        'typical_length_range': (20, 35),
        'weight_per_sheet_range': (1.5, 4.0)
    },
    'facial_tissue': {
        'name': 'Facial Tissue',
        'typical_gsm_range': (12, 20),
        'typical_width_range': (15, 25),
        'typical_length_range': (18, 22),
        'weight_per_sheet_range': (0.4, 1.2)
    },
    'baby_wipes': {
        'name': 'Baby Wipes',
        'typical_gsm_range': (45, 80),
        'typical_width_range': (15, 25),
        'typical_length_range': (18, 25),
        'weight_per_sheet_range': (2, 4)
    },
    'other': {
        'name': 'Other Nonwoven Products',
        'typical_gsm_range': (10, 100),
        'typical_width_range': (5, 50),
        'typical_length_range': (5, 50),
        'weight_per_sheet_range': (0.1, 10)
    }
}

def convert_uom(value: float, from_uom: str, to_uom: str) -> float:
    """
    Convert value from one UOM to another
    """
    from_uom = from_uom.lower().strip()
    to_uom = to_uom.lower().strip()

    if from_uom not in UOM_CONVERSIONS or to_uom not in UOM_CONVERSIONS:
        raise ValueError(f"Unsupported UOM conversion: {from_uom} to {to_uom}")

    # Convert to base unit first, then to target unit
    base_value = value * UOM_CONVERSIONS[from_uom]
    converted_value = base_value / UOM_CONVERSIONS[to_uom]

    return round(converted_value, 6)

def calculate_gsm(width_cm: float, length_m: float, weight_g: float) -> float:
    """
    Calculate GSM (Grams per Square Meter) for nonwoven fabric
    GSM = (Weight in grams) / (Width in meters * Length in meters)
    """
    if width_cm <= 0 or length_m <= 0 or weight_g <= 0:
        raise ValueError("Width, length, and weight must be positive values")

    # Convert width from cm to meters
    width_m = width_cm / 100

    # Calculate area in square meters
    area_m2 = width_m * length_m

    # Calculate GSM
    gsm = weight_g / area_m2

    return round(gsm, 2)

def calculate_packaging_structure(sheets_per_pack: int, packs_per_karton: int) -> Dict:
    """
    Calculate packaging structure metrics
    """
    if sheets_per_pack <= 0 or packs_per_karton <= 0:
        raise ValueError("Sheets per pack and packs per karton must be positive")

    sheets_per_karton = sheets_per_pack * packs_per_karton

    return {
        'sheets_per_pack': sheets_per_pack,
        'packs_per_karton': packs_per_karton,
        'sheets_per_karton': sheets_per_karton,
        'packaging_ratio': f"{sheets_per_pack}:{packs_per_karton}:{sheets_per_karton}"
    }

def calculate_sheet_weight(gsm: float, width_cm: float, length_cm: float) -> float:
    """
    Calculate weight per sheet based on GSM, width, and length
    Weight = GSM * (Width in meters * Length in meters)
    """
    if gsm <= 0 or width_cm <= 0 or length_cm <= 0:
        raise ValueError("GSM, width, and length must be positive values")

    # Convert dimensions to meters
    width_m = width_cm / 100
    length_m = length_cm / 100

    # Calculate area in square meters
    area_m2 = width_m * length_m

    # Calculate weight in grams
    weight_g = gsm * area_m2

    return round(weight_g, 3)

def validate_nonwoven_specs(category: str, gsm: float, width_cm: float, length_cm: float) -> Dict:
    """
    Validate nonwoven specifications against category standards
    """
    category = category.lower().replace(' ', '_')

    if category not in NONWOVEN_CATEGORIES:
        return {
            'valid': False,
            'message': f'Unknown category: {category}'
        }

    specs = NONWOVEN_CATEGORIES[category]

    issues = []

    # Check GSM range
    if not (specs['typical_gsm_range'][0] <= gsm <= specs['typical_gsm_range'][1]):
        issues.append(f"GSM {gsm} is outside typical range {specs['typical_gsm_range']} for {specs['name']}")

    # Check width range
    if not (specs['typical_width_range'][0] <= width_cm <= specs['typical_width_range'][1]):
        issues.append(f"Width {width_cm}cm is outside typical range {specs['typical_width_range']}cm for {specs['name']}")

    # Check length range
    if not (specs['typical_length_range'][0] <= length_cm <= specs['typical_length_range'][1]):
        issues.append(f"Length {length_cm}cm is outside typical range {specs['typical_length_range']}cm for {specs['name']}")

    # Calculate expected weight per sheet
    expected_weight = calculate_sheet_weight(gsm, width_cm, length_cm)

    if not (specs['weight_per_sheet_range'][0] <= expected_weight <= specs['weight_per_sheet_range'][1]):
        issues.append(f"Expected weight per sheet {expected_weight}g is outside typical range {specs['weight_per_sheet_range']}g for {specs['name']}")

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'specifications': specs,
        'calculated_weight_per_sheet': expected_weight
    }

def calculate_production_cost(material_costs: Dict, labor_cost: float, overhead_cost: float, quantity: int) -> Dict:
    """
    Calculate total production cost including materials, labor, and overhead
    """
    total_material_cost = sum(material_costs.values())

    total_cost = total_material_cost + labor_cost + overhead_cost
    cost_per_unit = total_cost / quantity if quantity > 0 else 0

    return {
        'total_material_cost': round(total_material_cost, 2),
        'labor_cost': round(labor_cost, 2),
        'overhead_cost': round(overhead_cost, 2),
        'total_cost': round(total_cost, 2),
        'cost_per_unit': round(cost_per_unit, 2),
        'quantity': quantity
    }

def calculate_efficiency_metrics(actual_output: float, standard_output: float, actual_time: float, standard_time: float) -> Dict:
    """
    Calculate efficiency metrics for production
    """
    if standard_output <= 0 or standard_time <= 0:
        raise ValueError("Standard output and time must be positive")

    efficiency = (actual_output / standard_output) * 100 if standard_output > 0 else 0
    productivity = actual_output / actual_time if actual_time > 0 else 0

    return {
        'efficiency_percent': round(efficiency, 2),
        'productivity_per_hour': round(productivity, 2),
        'actual_output': actual_output,
        'standard_output': standard_output,
        'actual_time_hours': actual_time,
        'standard_time_hours': standard_time
    }
