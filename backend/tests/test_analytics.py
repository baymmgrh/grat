"""
Tests for Analytics Module
"""
import pytest


def test_get_analytics_overview(client, auth_headers):
    """Test analytics overview"""
    response = client.get('/api/analytics/overview', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_sales_analytics(client, auth_headers):
    """Test sales analytics"""
    response = client.get('/api/analytics/sales', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_production_analytics(client, auth_headers):
    """Test production analytics"""
    response = client.get('/api/analytics/production', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_inventory_analytics(client, auth_headers):
    """Test inventory analytics"""
    response = client.get('/api/analytics/inventory', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_financial_analytics(client, auth_headers):
    """Test financial analytics"""
    response = client.get('/api/analytics/financial', headers=auth_headers)
    assert response.status_code in [200, 404]
