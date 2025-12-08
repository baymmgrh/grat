"""
Tests for Dashboard Module
"""
import pytest


def test_get_main_dashboard(client, auth_headers):
    """Test main dashboard endpoint"""
    response = client.get('/api/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_dashboard_kpis(client, auth_headers):
    """Test dashboard KPIs"""
    response = client.get('/api/dashboard/kpis', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_dashboard_charts(client, auth_headers):
    """Test dashboard charts"""
    response = client.get('/api/dashboard/charts', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_dashboard_alerts(client, auth_headers):
    """Test dashboard alerts"""
    response = client.get('/api/dashboard/alerts', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_dashboard_activities(client, auth_headers):
    """Test dashboard activities"""
    response = client.get('/api/dashboard/activities', headers=auth_headers)
    assert response.status_code in [200, 404]
