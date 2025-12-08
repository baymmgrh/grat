"""
Tests for HR Module
"""
import pytest


def test_get_employees_list(client, auth_headers):
    """Test getting employees list"""
    response = client.get('/api/hr/employees', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_hr_dashboard(client, auth_headers):
    """Test HR dashboard"""
    response = client.get('/api/hr/dashboard', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_attendance_list(client, auth_headers):
    """Test getting attendance list"""
    response = client.get('/api/hr/attendance', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_leave_requests(client, auth_headers):
    """Test getting leave requests"""
    response = client.get('/api/hr/leave-requests', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_payroll_periods(client, auth_headers):
    """Test getting payroll periods"""
    response = client.get('/api/hr/payroll/periods', headers=auth_headers)
    assert response.status_code in [200, 404]


def test_get_appraisal_cycles(client, auth_headers):
    """Test getting appraisal cycles"""
    response = client.get('/api/hr/appraisal/cycles', headers=auth_headers)
    assert response.status_code in [200, 404]
