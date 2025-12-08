"""
Tests for Authentication
"""
import pytest


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    assert response.status_code == 200
    data = response.json
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['username'] == 'testuser'


def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401


def test_login_missing_fields(client):
    """Test login with missing fields"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser'
    })
    assert response.status_code == 400


def test_protected_endpoint_without_token(client):
    """Test accessing protected endpoint without token"""
    response = client.get('/api/products')
    assert response.status_code == 401


def test_protected_endpoint_with_token(client, auth_headers):
    """Test accessing protected endpoint with valid token"""
    response = client.get('/api/products', headers=auth_headers)
    assert response.status_code == 200
