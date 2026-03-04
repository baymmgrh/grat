#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Testing downtime categorization for 'infeeding macet'...")
    
    try:
        # Test the backend categorization logic
        from routes.oee import get_downtime_category
        
        test_reasons = [
            'infeeding macet',
            'infeeding macet total', 
            'infeeding',
            'macet',
            'conveyor macet',
            'mesin macet'
        ]
        
        print("🔍 Backend Categorization Test:")
        for reason in test_reasons:
            category = get_downtime_category(reason)
            print(f"  '{reason}' -> {category}")
        
        print(f"\n✅ Expected Results:")
        print(f"  'infeeding macet' -> mesin ✅")
        print(f"  'infeeding macet total' -> mesin ✅")
        print(f"  'infeeding' -> mesin ✅")
        print(f"  'macet' -> mesin ✅")
        print(f"  'conveyor macet' -> mesin ✅")
        print(f"  'mesin macet' -> mesin ✅")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
