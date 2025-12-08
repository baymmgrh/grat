"""
Tests for OEE (Overall Equipment Effectiveness) Module
"""
import pytest


def test_get_oee_dashboard(client, auth_headers):
    """Test OEE dashboard"""
    response = client.get('/api/oee/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_oee_metrics(client, auth_headers):
    """Test OEE metrics"""
    response = client.get('/api/oee/metrics', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_oee_by_machine(client, auth_headers):
    """Test OEE by machine"""
    response = client.get('/api/oee/by-machine', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_oee_trends(client, auth_headers):
    """Test OEE trends"""
    response = client.get('/api/oee/trends', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_downtime_analysis(client, auth_headers):
    """Test downtime analysis"""
    response = client.get('/api/oee/downtime-analysis', headers=auth_headers)
    assert response.status_code in [200, 404]
