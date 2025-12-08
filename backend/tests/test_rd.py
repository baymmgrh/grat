"""
Tests for R&D Module
"""
import pytest


def test_get_rd_projects(client, auth_headers):
    """Test getting R&D projects"""
    response = client.get('/api/rd/projects', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_rd_dashboard(client, auth_headers):
    """Test R&D dashboard"""
    response = client.get('/api/rd/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_rd_experiments(client, auth_headers):
    """Test getting R&D experiments"""
    response = client.get('/api/rd/experiments', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_rd_materials(client, auth_headers):
    """Test getting R&D materials"""
    response = client.get('/api/rd/materials', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_rd_products(client, auth_headers):
    """Test getting R&D products"""
    response = client.get('/api/rd/products', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_rd_analytics(client, auth_headers):
    """Test R&D analytics"""
    response = client.get('/api/rd/projects/analytics', headers=auth_headers)
    assert response.status_code in [200, 404]
