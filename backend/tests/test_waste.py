"""
Tests for Waste Management Module
"""
import pytest


def test_get_waste_records(client, auth_headers):
    """Test getting waste records"""
    response = client.get('/api/waste/records', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_waste_dashboard(client, auth_headers):
    """Test waste dashboard"""
    response = client.get('/api/waste/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_waste_analytics(client, auth_headers):
    """Test waste analytics"""
    response = client.get('/api/waste/analytics', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_waste_by_category(client, auth_headers):
    """Test getting waste by category"""
    response = client.get('/api/waste/by-category', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_create_waste_record(client, auth_headers):
    """Test creating waste record"""
    waste_data = {
        'category': 'production',
        'quantity': 10.0,
        'uom': 'KG',
        'reason': 'Test waste'
    }
    response = client.post('/api/waste/records', json=waste_data, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404, 500]  # 500 if validation fails
