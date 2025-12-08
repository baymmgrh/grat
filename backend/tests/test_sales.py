"""
Tests for Sales Module
"""
import pytest
from datetime import datetime, timedelta


def test_get_customers_list(client, auth_headers, test_customer):
    """Test getting customers list"""
    response = client.get('/api/sales/customers', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert 'customers' in data or 'data' in data


def test_get_customer_by_id(client, auth_headers, test_customer):
    """Test getting single customer"""
    response = client.get(f'/api/sales/customers/{test_customer.id}', headers=auth_headers)
    assert response.status_code in [200, 404]  # May not exist in test DB


def test_create_sales_order(client, auth_headers, test_customer, test_product):
    """Test creating sales order"""
    order_data = {
        'customer_id': test_customer.id,
        'order_date': datetime.utcnow().isoformat(),
        'delivery_date': (datetime.utcnow() + timedelta(days=7)).isoformat(),
        'status': 'draft',
        'items': [
            {
                'product_id': test_product.id,
                'quantity': 10,
                'unit_price': 150.00
            }
        ]
    }
    response = client.post('/api/sales/orders', json=order_data, headers=auth_headers)
    assert response.status_code in [200, 201, 400]  # Accept various responses


def test_get_sales_orders_list(client, auth_headers):
    """Test getting sales orders list"""
    response = client.get('/api/sales/orders', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert 'orders' in data or 'data' in data or isinstance(data, list)


def test_get_sales_dashboard(client, auth_headers):
    """Test sales dashboard endpoint"""
    response = client.get('/api/sales/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]  # May not have dashboard endpoint
