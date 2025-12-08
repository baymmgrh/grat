"""
Tests for Product Management
"""
import pytest


def test_get_products_list(client, auth_headers, test_product):
    """Test getting products list"""
    response = client.get('/api/products', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert 'products' in data
    assert len(data['products']) > 0


def test_get_product_by_id(client, auth_headers, test_product):
    """Test getting single product"""
    response = client.get(f'/api/products/{test_product.id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    # Response is not wrapped in 'product' key
    assert data['code'] == 'TEST-001'
    assert data['name'] == 'Test Product'


def test_create_product(client, auth_headers):
    """Test creating new product"""
    product_data = {
        'code': 'NEW-001',
        'name': 'New Product',
        'description': 'New product description',
        'category': 'Test',
        'primary_uom': 'PCS',
        'cost': 100.00,
        'price': 150.00,
        'is_producible': True
    }
    response = client.post('/api/products/', 
                          json=product_data, 
                          headers=auth_headers)
    assert response.status_code == 201
    data = response.json
    assert 'product_id' in data
    assert data['message'] == 'Product created successfully'


def test_update_product(client, auth_headers, test_product):
    """Test updating product"""
    update_data = {
        'name': 'Updated Product Name',
        'price': 200.00
    }
    response = client.put(f'/api/products/{test_product.id}',
                         json=update_data,
                         headers=auth_headers)
    assert response.status_code == 200
    
    # Verify update by getting the product
    get_response = client.get(f'/api/products/{test_product.id}', headers=auth_headers)
    data = get_response.json
    assert data['name'] == 'Updated Product Name'
    assert data['price'] == 200.00


def test_delete_product(client, auth_headers, test_product):
    """Test deleting product"""
    response = client.delete(f'/api/products/{test_product.id}',
                            headers=auth_headers)
    assert response.status_code == 200
    
    # Verify product is deleted
    response = client.get(f'/api/products/{test_product.id}',
                         headers=auth_headers)
    assert response.status_code == 404


def test_create_product_duplicate_code(client, auth_headers, test_product):
    """Test creating product with duplicate code"""
    product_data = {
        'code': 'TEST-001',  # Duplicate
        'name': 'Another Product',
        'primary_uom': 'PCS',
        'cost': 100.00
    }
    response = client.post('/api/products/',
                          json=product_data,
                          headers=auth_headers)
    assert response.status_code == 409  # Conflict - duplicate code
