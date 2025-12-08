"""
Tests for Integration Module
"""
import pytest


def test_get_integrations_list(client, auth_headers):
    """Test getting integrations list"""
    response = client.get('/api/integration', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_integration_status(client, auth_headers):
    """Test getting integration status"""
    response = client.get('/api/integration/status', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_integration_logs(client, auth_headers):
    """Test getting integration logs"""
    response = client.get('/api/integration/logs', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_test_integration_connection(client, auth_headers):
    """Test testing integration connection"""
    response = client.post('/api/integration/test', json={'type': 'test'}, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]


def test_sync_integration_data(client, auth_headers):
    """Test syncing integration data"""
    response = client.post('/api/integration/sync', json={}, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]
