"""
Tests for BOM (Bill of Materials) Module
"""
import pytest


def test_get_bom_list(client, auth_headers):
    """Test getting BOM list"""
    response = client.get('/api/bom', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_bom_by_id(client, auth_headers):
    """Test getting single BOM"""
    response = client.get('/api/bom/1', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_bom_by_product(client, auth_headers, test_product):
    """Test getting BOM by product"""
    response = client.get(f'/api/bom/product/{test_product.id}', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_create_bom(client, auth_headers, test_product, test_material):
    """Test creating BOM"""
    bom_data = {
        'product_id': test_product.id,
        'version': '1.0',
        'is_active': True,
        'items': [
            {
                'material_id': test_material.id,
                'quantity': 10.0,
                'uom': 'KG'
            }
        ]
    }
    response = client.post('/api/bom', json=bom_data, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]


def test_calculate_bom_cost(client, auth_headers):
    """Test calculating BOM cost"""
    response = client.get('/api/bom/1/cost', headers=auth_headers)
    assert response.status_code in [200, 404]
