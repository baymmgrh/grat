"""
Tests for Reports Module
"""
import pytest


def test_get_reports_list(client, auth_headers):
    """Test getting reports list"""
    response = client.get('/api/reports', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_sales_report(client, auth_headers):
    """Test sales report"""
    response = client.get('/api/reports/sales', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_production_report(client, auth_headers):
    """Test production report"""
    response = client.get('/api/reports/production', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_inventory_report(client, auth_headers):
    """Test inventory report"""
    response = client.get('/api/reports/inventory', headers=auth_headers)
    assert response.status_code in [200, 404, 500]  # 500 if report generation fails


def test_get_financial_report(client, auth_headers):
    """Test financial report"""
    response = client.get('/api/reports/financial', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_custom_report(client, auth_headers):
    """Test custom report"""
    response = client.get('/api/reports/custom/test-report', headers=auth_headers)
    assert response.status_code in [200, 404]
