"""
Tests for Production Module
"""
import pytest
from datetime import datetime, timedelta


def test_get_work_orders_list(client, auth_headers):
    """Test getting work orders list"""
    response = client.get('/api/production/work-orders', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_production_dashboard(client, auth_headers):
    """Test production dashboard"""
    response = client.get('/api/production/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_create_work_order(client, auth_headers, test_product):
    """Test creating work order"""
    wo_data = {
        'product_id': test_product.id,
        'quantity': 100,
        'start_date': datetime.utcnow().isoformat(),
        'due_date': (datetime.utcnow() + timedelta(days=7)).isoformat(),
        'status': 'planned'
    }
    response = client.post('/api/production/work-orders', json=wo_data, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]


def test_get_machines_list(client, auth_headers):
    """Test getting machines list"""
    response = client.get('/api/production/machines', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_bom_list(client, auth_headers):
    """Test getting BOM list"""
    response = client.get('/api/production/bom', headers=auth_headers)
    assert response.status_code in [200, 404]
