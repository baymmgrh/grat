#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Testing 'infeeding macet' categorization logic...")
    
    try:
        # Test keywords directly
        machine_keywords = [
            'mesin', 'machine', 'rusak', 'error', 'breakdown', 'maintenance',
            'perbaikan', 'repair', 'overhaul', 'service', 'ganti sparepart',
            'spare part', 'komponen', 'sensor', 'motor', 'pneumatic',
            'hydraulic', 'electrical', 'mekanik', 'tooling', 'mould', 'die',
            # Common machine issues
            'conveyor', 'vanbelt', 'belt', 'inkjet', 'printer', 'nozzle',
            'infeeding', 'putus', 'patah', 'bocor', 'macet', 'mampet', 'stuck',
            'tidak keluar', 'tidak jalan', 'tidak nyala', 'mati',
            'kain keluar', 'kain putus', 'kain sobek', 'roll', 'roller', 'bearing', 'gear', 'rantai', 'chain',
            'pompa', 'pump', 'valve', 'seal', 'packing', 'gasket',
            'cutter', 'blade', 'pisau', 'heater', 'pemanas', 'cooler',
            'menggulung', 'slip', 'geser', 'longgar', 'kendor', 'aus'
        ]
        
        test_reasons = [
            'infeeding macet',
            'infeeding macet total', 
            'infeeding',
            'macet',
            'conveyor macet',
            'mesin macet'
        ]
        
        print("🔍 Testing Machine Keywords Detection:")
        for reason in test_reasons:
            reason_lower = reason.lower()
            is_machine = any(kw in reason_lower for kw in machine_keywords)
            print(f"  '{reason}' -> {'MESIN ✅' if is_machine else 'NOT MESIN ❌'}")
        
        print(f"\n✅ Expected Results:")
        print(f"  'infeeding macet' -> MESIN (contains 'infeeding' and 'macet')")
        print(f"  'infeeding macet total' -> MESIN (contains 'infeeding' and 'macet')")
        print(f"  'infeeding' -> MESIN (contains 'infeeding')")
        print(f"  'macet' -> MESIN (contains 'macet')")
        print(f"  'conveyor macet' -> MESIN (contains 'conveyor' and 'macet')")
        print(f"  'mesin macet' -> MESIN (contains 'mesin' and 'macet')")
        
        print(f"\n🎯 Frontend Keywords Test:")
        frontend_mesin_keywords = [
            'keluar jalur (bak mesin)', 'kain keluar jalur (bak mesin)', 'bak mesin',
            'seal', 'sealer', 'seal bocor', 'seal samping bocor', 'seal bawah bocor',
            'seal tidak ngeseal', 'seal bawah tdk ngeseal', 'sealer rusak',
            'pisau', 'pisau tumpul', 'pisau folding tumpul', 'pisau folding kotor',
            'cutter', 'cutter tumpul', 'blade', 'blade aus',
            'belt', 'belt putus', 'round belt putus', 'vanbelt', 'vanbelt putus',
            'conveyor', 'conveyor macet', 'conveyor slip',
            'infeeding', 'infeeding macet', 'infeeding macet total',
            'folding', 'lipatan', 'lipat', 'kain keluar lajur folding',
            'tumpukan kain tdk rapih', 'tumpukan kain tidak rapi',
            'selang', 'selang bocor', 'selang angin bocor',
            'pneumatic', 'pneumatic error', 'hidrolik', 'hidrolik bocor',
            'metal detector', 'metal detektor', 'detector putus',
            'inkjet', 'inkjet error', 'inkjet macet', 'printer inkjet',
            'temperature', 'temperatur', 'suhu', 'overheat', 'panas berlebih',
            'low temperature', 'suhu rendah', 'tekanan angin', 'tekanan angin drop',
            'motor', 'motor rusak', 'motor mati', 'bearing', 'bearing aus',
            'gear', 'gear rusak',
            'sensor', 'sensor error', 'sensor rusak',
            'pompa', 'pompa rusak', 'kompresor', 'kompresor mati',
            'heater', 'heater rusak', 'cooling', 'cooling error',
            'nozzle', 'nozzle mampet', 'valve', 'valve bocor',
            'cylinder', 'cylinder bocor',
            'mesin rusak', 'mesin error', 'mesin mati', 'mesin macet', 'mesin trouble',
            'breakdown', 'break down', 'kerusakan mesin', 'gangguan mesin',
            'press error', 'sparepart', 'maintenance', 'perbaikan mesin',
            'kalibrasi', 'service mesin'
        ]
        
        for reason in test_reasons:
            reason_lower = reason.lower()
            is_frontend_mesin = any(kw in reason_lower for kw in frontend_mesin_keywords)
            print(f"  Frontend '{reason}' -> {'MESIN ✅' if is_frontend_mesin else 'NOT MESIN ❌'}')
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
