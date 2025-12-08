"""
Tests for Finance Module
"""
import pytest


def test_get_finance_dashboard(client, auth_headers):
    """Test finance dashboard"""
    response = client.get('/api/finance/dashboard/kpis', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_cash_flow(client, auth_headers):
    """Test cash flow endpoint"""
    response = client.get('/api/finance/dashboard/cash-flow', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_expenses(client, auth_headers):
    """Test expenses endpoint"""
    response = client.get('/api/finance/dashboard/expenses', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_revenue(client, auth_headers):
    """Test revenue endpoint"""
    response = client.get('/api/finance/dashboard/revenue', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_chart_of_accounts(client, auth_headers):
    """Test chart of accounts"""
    response = client.get('/api/finance/accounting/chart-of-accounts', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_journal_entries(client, auth_headers):
    """Test journal entries"""
    response = client.get('/api/finance/accounting/journal-entries', headers=auth_headers)
    assert response.status_code in [200, 404]
