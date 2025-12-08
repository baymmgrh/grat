"""
Pytest Configuration and Fixtures
"""
import pytest
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from models.user import User
from models.product import Product, Material
from models.sales import Customer
from config import Config


class TestConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    JWT_SECRET_KEY = 'test-secret-key'
    SQLALCHEMY_ECHO = False


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Create database session for testing"""
    with app.app_context():
        yield db.session
        db.session.rollback()


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers with JWT token"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def refresh_headers(client, test_user):
    """Get authentication headers with refresh token"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    token = response.json.get('refresh_token')
    if token:
        return {'Authorization': f'Bearer {token}'}
    return None


@pytest.fixture
def test_user(app, db_session):
    """Create test user"""
    # Use bcrypt from app instance
    password_hash = app.bcrypt.generate_password_hash('testpass123').decode('utf-8')
    user = User(
        username='testuser',
        email='test@example.com',
        full_name='Test User',
        password_hash=password_hash,
        is_admin=True,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_product(db_session):
    """Create test product"""
    product = Product(
        code='TEST-001',
        name='Test Product',
        description='Test product description',
        material_type='finished_goods',
        primary_uom='PCS',
        cost=100.00,
        price=150.00,
        is_producible=True,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    return product


@pytest.fixture
def test_material(db_session):
    """Create test material"""
    material = Material(
        code='MAT-001',
        name='Test Material',
        description='Test material description',
        material_type='raw_materials',
        category='Raw Material',
        primary_uom='KG',
        cost_per_unit=50.00,
        min_stock_level=10.0,
        is_active=True
    )
    db_session.add(material)
    db_session.commit()
    return material


@pytest.fixture
def test_customer(db_session):
    """Create test customer"""
    customer = Customer(
        code='CUST-001',
        company_name='Test Company',
        contact_person='John Doe',
        email='customer@example.com',
        phone='08123456789',
        billing_address='Test Address',
        billing_city='Test City',
        credit_limit=1000000.00,
        payment_terms_days=30,
        is_active=True
    )
    db_session.add(customer)
    db_session.commit()
    return customer


@pytest.fixture(autouse=True)
def reset_db(db_session):
    """Reset database after each test"""
    yield
    db_session.rollback()
    for table in reversed(db.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()
