"""
Tests for Health Check Endpoints
"""
import pytest


def test_health_check(client):
    """Test basic health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.json
    assert data['status'] == 'healthy'
    assert 'timestamp' in data
    assert data['service'] == 'ERP Backend'


def test_liveness_check(client):
    """Test liveness check endpoint"""
    response = client.get('/api/live')
    assert response.status_code == 200
    data = response.json
    assert data['status'] == 'alive'
    assert 'timestamp' in data


def test_readiness_check(client):
    """Test readiness check endpoint"""
    response = client.get('/api/ready')
    assert response.status_code in [200, 503]  # May fail if DB not ready
    data = response.json
    assert 'status' in data
    assert 'timestamp' in data
