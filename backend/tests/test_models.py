"""
Tests for Database Models
"""
import pytest
from datetime import datetime
from models.user import User, Role, UserRole
from models.product import Product, Material, ProductCategory
from models.sales import Customer, SalesOrder


def test_user_model_creation(app, db_session):
    """Test User model creation"""
    password_hash = app.bcrypt.generate_password_hash('testpass').decode('utf-8')
    user = User(
        username='testuser2',
        email='test2@example.com',
        full_name='Test User 2',
        password_hash=password_hash,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.username == 'testuser2'
    assert user.is_active is True


def test_product_model_creation(db_session):
    """Test Product model creation"""
    product = Product(
        code='PROD-TEST-001',
        name='Test Product Model',
        material_type='finished_goods',
        primary_uom='PCS',
        cost=100.00,
        price=150.00,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    
    assert product.id is not None
    assert product.code == 'PROD-TEST-001'
    assert product.material_type == 'finished_goods'


def test_material_model_creation(db_session):
    """Test Material model creation"""
    material = Material(
        code='MAT-TEST-001',
        name='Test Material Model',
        material_type='raw_materials',
        category='Raw Material',
        primary_uom='KG',
        cost_per_unit=50.00,
        is_active=True
    )
    db_session.add(material)
    db_session.commit()
    
    assert material.id is not None
    assert material.code == 'MAT-TEST-001'
    assert material.material_type == 'raw_materials'


def test_customer_model_creation(db_session):
    """Test Customer model creation"""
    customer = Customer(
        code='CUST-TEST-001',
        company_name='Test Customer Model',
        contact_person='John Doe',
        email='customer@test.com',
        phone='08123456789',
        billing_address='Test Address',
        billing_city='Test City',
        is_active=True
    )
    db_session.add(customer)
    db_session.commit()
    
    assert customer.id is not None
    assert customer.code == 'CUST-TEST-001'
    assert customer.company_name == 'Test Customer Model'


def test_product_category_creation(db_session):
    """Test ProductCategory model creation"""
    category = ProductCategory(
        code='CAT-001',
        name='Test Category',
        description='Test category description',
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    
    assert category.id is not None
    assert category.code == 'CAT-001'
    assert category.name == 'Test Category'


def test_role_model_creation(db_session):
    """Test Role model creation"""
    role = Role(
        name='test_role',
        description='Test role description',
        is_active=True
    )
    db_session.add(role)
    db_session.commit()
    
    assert role.id is not None
    assert role.name == 'test_role'
    assert role.is_active is True
