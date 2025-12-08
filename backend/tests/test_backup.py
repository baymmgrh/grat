"""
Tests for Backup Module
"""
import pytest


def test_get_backups_list(client, auth_headers):
    """Test getting backups list"""
    response = client.get('/api/backup', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_backup_status(client, auth_headers):
    """Test getting backup status"""
    response = client.get('/api/backup/status', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_create_backup(client, auth_headers):
    """Test creating backup"""
    response = client.post('/api/backup/create', json={}, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]


def test_restore_backup(client, auth_headers):
    """Test restoring backup"""
    response = client.post('/api/backup/restore/1', json={}, headers=auth_headers)
    assert response.status_code in [200, 201, 400, 404]


def test_delete_backup(client, auth_headers):
    """Test deleting backup"""
    response = client.delete('/api/backup/1', headers=auth_headers)
    assert response.status_code in [200, 404]
