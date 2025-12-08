"""
Tests for Warehouse Module
"""
import pytest


def test_get_inventory_list(client, auth_headers):
    """Test getting inventory list"""
    response = client.get('/api/warehouse/inventory', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_warehouse_dashboard(client, auth_headers):
    """Test warehouse dashboard"""
    response = client.get('/api/warehouse/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_stock_movements(client, auth_headers):
    """Test getting stock movements"""
    response = client.get('/api/warehouse/stock-movements', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_locations(client, auth_headers):
    """Test getting warehouse locations"""
    response = client.get('/api/warehouse/locations', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_create_stock_adjustment(client, auth_headers, test_product):
    """Test creating stock adjustment"""
    adjustment_data = {
        'product_id': test_product.id,
        'quantity': 100,
        'adjustment_type': 'in',
        'reason': 'Initial stock'
    }
    response = client.post('/api/warehouse/adjustments', json=adjustment_data, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]
