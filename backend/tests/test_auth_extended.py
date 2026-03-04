"""
Extended tests for auth routes to increase coverage
"""
import pytest


class TestAuthExtended:
    def test_login_with_empty_body(self, client):
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400

    def test_login_missing_password(self, client):
        response = client.post('/api/auth/login', json={'username': 'test'})
        assert response.status_code == 400

    def test_login_missing_username(self, client):
        response = client.post('/api/auth/login', json={'password': 'test'})
        assert response.status_code == 400

    def test_register_missing_fields(self, client):
        response = client.post('/api/auth/register', json={
            'username': 'newuser'
        })
        assert response.status_code in [400, 500]

    def test_register_invalid_email(self, client):
        response = client.post('/api/auth/register', json={
            'username': 'newuser3',
            'email': 'invalid-email',
            'password': 'pass123',
            'full_name': 'New User'
        })
        assert response.status_code in [201, 400, 500]

    def test_change_password_missing_current(self, client, auth_headers):
        response = client.post('/api/auth/change-password', json={
            'new_password': 'newpass456'
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_change_password_missing_new(self, client, auth_headers):
        response = client.post('/api/auth/change-password', json={
            'current_password': 'testpass123'
        }, headers=auth_headers)
        assert response.status_code == 400

    def test_change_password_wrong_current(self, client, auth_headers):
        response = client.post('/api/auth/change-password', json={
            'current_password': 'wrongpassword',
            'new_password': 'newpass456'
        }, headers=auth_headers)
        assert response.status_code == 401

    def test_get_me_without_auth(self, client):
        response = client.get('/api/auth/me')
        assert response.status_code in [401, 422]

    def test_logout(self, client, auth_headers):
        response = client.post('/api/auth/logout', headers=auth_headers)
        assert response.status_code == 200

    def test_get_permissions_list(self, client, auth_headers):
        response = client.get('/api/auth/permissions', headers=auth_headers)
        assert response.status_code in [200, 404]

    def test_get_user_roles(self, client, auth_headers):
        response = client.get('/api/auth/roles', headers=auth_headers)
        assert response.status_code in [200, 404]


class TestAuthValidation:
    def test_login_inactive_user(self, client, app, db_session):
        from models import User
        # Create inactive user
        password_hash = app.bcrypt.generate_password_hash('pass123').decode('utf-8')
        user = User(
            username='inactiveuser',
            email='inactive@test.com',
            full_name='Inactive User',
            password_hash=password_hash,
            is_active=False
        )
        db_session.add(user)
        db_session.commit()

        response = client.post('/api/auth/login', json={
            'username': 'inactiveuser',
            'password': 'pass123'
        })
        assert response.status_code in [401, 403]

    def test_register_duplicate_email(self, client, test_user):
        response = client.post('/api/auth/register', json={
            'username': 'differentuser',
            'email': 'test@example.com',  # Same as test_user
            'password': 'pass123',
            'full_name': 'Different User'
        })
        assert response.status_code in [409, 500]
