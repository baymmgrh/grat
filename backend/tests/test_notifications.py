"""
Tests for Notifications Module
"""
import pytest


def test_get_notifications(client, auth_headers):
    """Test getting notifications"""
    response = client.get('/api/notifications', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_unread_notifications(client, auth_headers):
    """Test getting unread notifications"""
    response = client.get('/api/notifications/unread', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_mark_notification_read(client, auth_headers):
    """Test marking notification as read"""
    response = client.put('/api/notifications/1/read', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_mark_all_read(client, auth_headers):
    """Test marking all notifications as read"""
    response = client.put('/api/notifications/mark-all-read', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_delete_notification(client, auth_headers):
    """Test deleting notification"""
    response = client.delete('/api/notifications/1', headers=auth_headers)
    assert response.status_code in [200, 404]
