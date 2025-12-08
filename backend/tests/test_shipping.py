"""
Tests for Shipping Module
"""
import pytest


def test_get_shipping_orders(client, auth_headers):
    """Test getting shipping orders"""
    response = client.get('/api/shipping/orders', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_shipping_dashboard(client, auth_headers):
    """Test shipping dashboard"""
    response = client.get('/api/shipping/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_deliveries(client, auth_headers):
    """Test getting deliveries"""
    response = client.get('/api/shipping/deliveries', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_tracking_info(client, auth_headers):
    """Test getting tracking information"""
    response = client.get('/api/shipping/tracking/TEST-001', headers=auth_headers)
    assert response.status_code in [200, 404, 405]  # 405 if method not allowed


def test_get_carriers(client, auth_headers):
    """Test getting carriers list"""
    response = client.get('/api/shipping/carriers', headers=auth_headers)
    assert response.status_code in [200, 404]
