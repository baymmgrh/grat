"""
Product Calculation Utilities - Sesuai dengan Excel produk.xlsx
Perhitungan untuk produk nonwoven manufacturing
"""

def calculate_berat_kering(gramasi, cd_cm, md_cm, sheet_per_pack, pack_per_karton):
    """
    Calculate BERAT KERING (dry weight per karton)
    
    Formula:
    - Area per sheet = CD (m) × MD (m)
    - Weight per sheet (g) = GSM × Area (m²)
    - Total sheets = Sheet Per Pack × Pack per Karton
    - BERAT KERING (kg) = (Weight per sheet × Total sheets) / 1000
    
    Args:
        gramasi: GSM (grams per square meter)
        cd_cm: CD width in CM (input dari user dalam CM)
        md_cm: MD length in CM (input dari user dalam CM)
        sheet_per_pack: Number of sheets per pack
        pack_per_karton: Number of packs per karton
    
    Returns:
        float: BERAT KERING in kg
    """
    if not all([gramasi, cd_cm, md_cm, sheet_per_pack, pack_per_karton]):
        return 0.0
    
    # Convert CM to meters for calculation
    cd_m = cd_cm / 100
    md_m = md_cm / 100
    
    # Calculate area per sheet (m²)
    area_m2 = cd_m * md_m
    
    # Calculate weight per sheet (grams)
    weight_per_sheet_g = gramasi * area_m2
    
    # Calculate total sheets
    total_sheets = sheet_per_pack * pack_per_karton
    
    # Calculate total weight in kg
    berat_kering_kg = (weight_per_sheet_g * total_sheets) / 1000
    
    return round(berat_kering_kg, 4)


def calculate_meter_kain(cd_cm, md_cm, sheet_per_pack, pack_per_karton):
    """
    Calculate METER KAIN (fabric length needed)
    
    Formula dari Excel:
    METER KAIN = (Total Sheets × MAX(CD, MD)) / 10
    
    PENTING: Excel menggunakan dimensi yang LEBIH BESAR antara CD atau MD!
    
    Args:
        cd_cm: CD width in CM (input dari user dalam CM)
        md_cm: MD length in CM (input dari user dalam CM)
        sheet_per_pack: Number of sheets per pack
        pack_per_karton: Number of packs per karton
    
    Returns:
        float: METER KAIN in meters
    """
    if not all([cd_cm, md_cm, sheet_per_pack, pack_per_karton]):
        return 0.0
    
    # Convert CM to meters for calculation
    cd_m = cd_cm / 100
    md_m = md_cm / 100
    
    # Calculate total sheets
    total_sheets = sheet_per_pack * pack_per_karton
    
    # Use the LARGER dimension (CD or MD)
    larger_dimension = max(cd_m, md_m)
    
    # Formula Excel: METER KAIN = (Total Sheets × MAX(CD, MD)) / 10
    meter_kain = (total_sheets * larger_dimension) / 10
    
    return round(meter_kain, 6)


def calculate_kg_kain(gramasi, lebar_mr_gross_cm, meter_kain):
    """
    Calculate KG KAIN (fabric weight needed)
    
    Formula dari Excel:
    KG KAIN = METER KAIN × (LEBAR MR GROSS / 100) × GRAMASI / 1000
    
    PENTING: Menggunakan LEBAR MR GROSS, bukan CD!
    
    Args:
        gramasi: GSM (grams per square meter)
        lebar_mr_gross_cm: LEBAR MR GROSS in cm (dari Excel)
        meter_kain: METER KAIN in meters
    
    Returns:
        float: KG KAIN in kg
    """
    if not all([gramasi, lebar_mr_gross_cm, meter_kain]):
        return 0.0
    
    # Convert LEBAR MR GROSS from cm to meters
    lebar_mr_gross_m = lebar_mr_gross_cm / 100
    
    # Formula Excel: KG KAIN = METER KAIN × LEBAR MR GROSS (m) × GSM / 1000
    kg_kain = meter_kain * lebar_mr_gross_m * gramasi / 1000
    
    return round(kg_kain, 6)


def calculate_kebutuhan_material(kg_kain, rayon_ratio, polyester_ratio, es_ratio):
    """
    Calculate material requirements (RAYON, POLYESTER, ES)
    
    Formula:
    KEBUTUHAN RAYON = KG KAIN × RAYON (ratio)
    KEBUTUHAN POLYESTER = KG KAIN × POLYESTER (ratio)
    KEBUTUHAN ES = KG KAIN × ES (ratio)
    
    PENTING: Di Excel, RAYON/POLYESTER/ES adalah RASIO DESIMAL (0.5 = 50%), bukan persentase!
    
    Args:
        kg_kain: KG KAIN in kg
        rayon_ratio: RAYON ratio (0-1, e.g., 0.5 = 50%)
        polyester_ratio: POLYESTER ratio (0-1, e.g., 0.5 = 50%)
        es_ratio: ES ratio (0-1, e.g., 0.5 = 50%)
    
    Returns:
        dict: {
            'kebutuhan_rayon_kg': float,
            'kebutuhan_polyester_kg': float,
            'kebutuhan_es_kg': float
        }
    """
    if not kg_kain:
        return {
            'kebutuhan_rayon_kg': 0.0,
            'kebutuhan_polyester_kg': 0.0,
            'kebutuhan_es_kg': 0.0
        }
    
    # Use ratios directly (already in decimal form in Excel)
    rayon_decimal = rayon_ratio or 0
    polyester_decimal = polyester_ratio or 0
    es_decimal = es_ratio or 0
    
    return {
        'kebutuhan_rayon_kg': round(kg_kain * rayon_decimal, 6),
        'kebutuhan_polyester_kg': round(kg_kain * polyester_decimal, 6),
        'kebutuhan_es_kg': round(kg_kain * es_decimal, 6)
    }


def calculate_all_product_metrics(product_data):
    """
    Calculate all product metrics at once
    
    Args:
        product_data: dict with keys:
            - gramasi: float (GSM)
            - cd: float (in CM - user input)
            - md: float (in CM - user input)
            - sheet_per_pack: int
            - pack_per_karton: int
            - lebar_mr_gross_cm: float (in CM)
            - rayon: float (ratio 0-1, e.g., 0.5 = 50%)
            - polyester: float (ratio 0-1)
            - es: float (ratio 0-1)
    
    Returns:
        dict: All calculated metrics
    """
    # Extract data
    gramasi = product_data.get('gramasi', 0)
    cd_cm = product_data.get('cd', 0)  # Now in CM
    md_cm = product_data.get('md', 0)  # Now in CM
    sheet_per_pack = product_data.get('sheet_per_pack', 0)
    pack_per_karton = product_data.get('pack_per_karton', 0)
    lebar_mr_gross_cm = product_data.get('lebar_mr_gross_cm', 0)
    rayon_ratio = product_data.get('rayon', 0)
    polyester_ratio = product_data.get('polyester', 0)
    es_ratio = product_data.get('es', 0)
    
    # Calculate BERAT KERING
    berat_kering = calculate_berat_kering(
        gramasi, cd_cm, md_cm, sheet_per_pack, pack_per_karton
    )
    
    # Calculate METER KAIN
    meter_kain = calculate_meter_kain(
        cd_cm, md_cm, sheet_per_pack, pack_per_karton
    )
    
    # Calculate KG KAIN
    kg_kain = calculate_kg_kain(
        gramasi, lebar_mr_gross_cm, meter_kain
    )
    
    # Calculate material requirements
    material_requirements = calculate_kebutuhan_material(
        kg_kain, rayon_ratio, polyester_ratio, es_ratio
    )
    
    return {
        'berat_kering': berat_kering,
        'meter_kain': meter_kain,
        'kg_kain': kg_kain,
        **material_requirements,
        'total_sheets': sheet_per_pack * pack_per_karton if sheet_per_pack and pack_per_karton else 0
    }


def validate_product_calculations(product_data, calculated_data):
    """
    Validate calculated values against Excel data
    
    Args:
        product_data: Original product data from Excel
        calculated_data: Calculated values
    
    Returns:
        dict: Validation results with differences
    """
    validations = {}
    tolerance = 0.01  # 1% tolerance
    
    fields_to_check = [
        'berat_kering',
        'meter_kain',
        'kg_kain',
        'kebutuhan_rayon_kg',
        'kebutuhan_polyester_kg',
        'kebutuhan_es_kg'
    ]
    
    for field in fields_to_check:
        excel_value = product_data.get(field, 0) or 0
        calc_value = calculated_data.get(field, 0) or 0
        
        if excel_value > 0:
            diff_pct = abs((calc_value - excel_value) / excel_value) * 100
            matches = diff_pct <= tolerance
        else:
            matches = calc_value == 0
        
        validations[field] = {
            'excel_value': excel_value,
            'calculated_value': calc_value,
            'difference': calc_value - excel_value,
            'matches': matches
        }
    
    return validations
