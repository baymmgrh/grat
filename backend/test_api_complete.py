"""
Test the API endpoint directly
"""
from app import create_app
from flask import json

app = create_app()

with app.test_client() as client:
    print("=" * 60)
    print("TEST API COMPLETE WORK ORDER")
    print("=" * 60)
    
    # First login to get JWT token
    login_response = client.post('/api/auth/login', 
        json={'username': 'admin', 'password': 'admin123'},
        content_type='application/json'
    )
    
    if login_response.status_code != 200:
        print(f"[ERROR] Login failed: {login_response.status_code}")
        print(login_response.get_json())
        exit(1)
    
    token = login_response.get_json().get('access_token')
    print(f"[OK] Login successful, got token")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get a WO to complete
    wo_id = 2  # Try WO ID 2 which has production data
    
    # Check current status
    get_response = client.get(f'/api/production/work-orders/{wo_id}', headers=headers)
    if get_response.status_code == 200:
        wo_data = get_response.get_json()
        print(f"\nCurrent WO Status: {wo_data.get('status')}")
        print(f"WO Number: {wo_data.get('wo_number')}")
    
    # Try to complete
    print("\n" + "=" * 60)
    print("CALLING PUT /api/production/work-orders/{}/status".format(wo_id))
    print("=" * 60)
    
    response = client.put(
        f'/api/production/work-orders/{wo_id}/status',
        json={'status': 'completed'},
        headers=headers,
        content_type='application/json'
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.get_json()}")
    
    # Verify
    if response.status_code == 200:
        get_response2 = client.get(f'/api/production/work-orders/{wo_id}', headers=headers)
        if get_response2.status_code == 200:
            wo_data2 = get_response2.get_json()
            print(f"\nVerified Status After: {wo_data2.get('status')}")
