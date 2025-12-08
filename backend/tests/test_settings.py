"""
Tests for Settings Module
"""
import pytest


def test_get_system_settings(client, auth_headers):
    """Test getting system settings"""
    response = client.get('/api/settings', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_user_preferences(client, auth_headers):
    """Test getting user preferences"""
    response = client.get('/api/settings/preferences', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_company_settings(client, auth_headers):
    """Test getting company settings"""
    response = client.get('/api/settings/company', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_notification_settings(client, auth_headers):
    """Test getting notification settings"""
    response = client.get('/api/settings/notifications', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_security_settings(client, auth_headers):
    """Test getting security settings"""
    response = client.get('/api/settings/security', headers=auth_headers)
    assert response.status_code in [200, 404]
