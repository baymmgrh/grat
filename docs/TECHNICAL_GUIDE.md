# 🔧 PANDUAN TEKNIS SISTEM ERP
## PT. GRATIA MAKMUR SENTOSA

---

## 📋 DAFTAR ISI

1. [Setup Development](#1-setup-development)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Backend Development](#3-backend-development)
4. [Frontend Development](#4-frontend-development)
5. [Database Management](#5-database-management)
6. [API Development](#6-api-development)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Maintenance](#9-maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. SETUP DEVELOPMENT

### 1.1 Prerequisites

```bash
# Required Software
- Python 3.10+
- Node.js 18+
- npm atau yarn
- Git
- VS Code (recommended)
```

### 1.2 Clone Repository

```bash
git clone https://github.com/baymngrh/grat.git
cd grat
```

### 1.3 Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# Initialize database
flask db upgrade

# Run server
python app.py
```

Backend berjalan di: `http://localhost:5000`

### 1.4 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

### 1.5 Environment Variables

**Backend (.env):**
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///erp_database.db
CORS_ORIGINS=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

---

## 2. ARSITEKTUR APLIKASI

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  Browser (React + TypeScript + Redux)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS (REST API)
                            │ JWT Authentication
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                              │
│  Flask + Flask-CORS + Flask-JWT-Extended                    │
│  Rate Limiting + Request Validation                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC                             │
│  Routes (Controllers) + Services + Utils                    │
│  Event Listeners + Background Jobs                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS                               │
│  SQLAlchemy ORM + Models                                    │
│  Query Optimization + Caching                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  SQLite (Dev) / PostgreSQL (Production)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Folder Structure

```
ERP FLASK/
├── backend/
│   ├── app.py                 # Main application entry
│   ├── config.py              # Configuration
│   ├── models/                # SQLAlchemy models
│   │   ├── __init__.py        # Model exports
│   │   ├── production.py      # Production models
│   │   ├── sales.py           # Sales models
│   │   └── ...
│   ├── routes/                # API endpoints
│   │   ├── __init__.py        # Blueprint registration
│   │   ├── production.py      # /api/production/*
│   │   ├── oee.py             # /api/oee/*
│   │   └── ...
│   ├── utils/                 # Helper functions
│   ├── middleware/            # Custom middleware
│   ├── migrations/            # Alembic migrations
│   └── tests/                 # Unit tests
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Root component
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── store/             # Redux store
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   └── index.html             # HTML template
│
└── docs/                      # Documentation
```

---

## 3. BACKEND DEVELOPMENT

### 3.1 Creating a New Model

```python
# backend/models/example.py

from models import db
from datetime import datetime

class Example(db.Model):
    __tablename__ = 'examples'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    creator = db.relationship('User', backref='examples')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
```

### 3.2 Creating a New Route

```python
# backend/routes/example.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.example import Example

example_bp = Blueprint('example', __name__)

@example_bp.route('/examples', methods=['GET'])
@jwt_required()
def get_examples():
    """Get all examples"""
    try:
        examples = Example.query.all()
        return jsonify([e.to_dict() for e in examples])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@example_bp.route('/examples', methods=['POST'])
@jwt_required()
def create_example():
    """Create new example"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        example = Example(
            name=data['name'],
            description=data.get('description'),
            created_by=user_id
        )
        
        db.session.add(example)
        db.session.commit()
        
        return jsonify(example.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@example_bp.route('/examples/<int:id>', methods=['GET'])
@jwt_required()
def get_example(id):
    """Get example by ID"""
    example = Example.query.get_or_404(id)
    return jsonify(example.to_dict())

@example_bp.route('/examples/<int:id>', methods=['PUT'])
@jwt_required()
def update_example(id):
    """Update example"""
    try:
        example = Example.query.get_or_404(id)
        data = request.get_json()
        
        if 'name' in data:
            example.name = data['name']
        if 'description' in data:
            example.description = data['description']
        if 'status' in data:
            example.status = data['status']
        
        db.session.commit()
        return jsonify(example.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@example_bp.route('/examples/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_example(id):
    """Delete example"""
    try:
        example = Example.query.get_or_404(id)
        db.session.delete(example)
        db.session.commit()
        return jsonify({'message': 'Deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
```

### 3.3 Registering Blueprint

```python
# backend/routes/__init__.py

from routes.example import example_bp

def register_blueprints(app):
    # ... existing blueprints ...
    app.register_blueprint(example_bp, url_prefix='/api')
```

### 3.4 Database Migration

```bash
# Create migration
flask db migrate -m "Add examples table"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

---

## 4. FRONTEND DEVELOPMENT

### 4.1 Creating a New Page

```tsx
// frontend/src/pages/Example/ExampleList.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface Example {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ExampleList() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      const response = await axiosInstance.get('/api/examples');
      setExamples(response.data);
    } catch (error) {
      toast.error('Failed to fetch examples');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-spin">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Examples</h1>
        <Link 
          to="/app/examples/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + New Example
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {examples.map((example) => (
              <tr key={example.id} className="border-t">
                <td className="px-6 py-4">{example.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    example.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {example.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/app/examples/${example.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4.2 Adding Route

```tsx
// frontend/src/App.tsx

import ExampleList from './pages/Example/ExampleList';
import ExampleForm from './pages/Example/ExampleForm';

// In routes array:
{
  path: '/app/examples',
  element: <ExampleList />
},
{
  path: '/app/examples/new',
  element: <ExampleForm />
},
{
  path: '/app/examples/:id',
  element: <ExampleForm />
}
```

### 4.3 Redux Store (Optional)

```tsx
// frontend/src/store/exampleSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axiosConfig';

interface ExampleState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  items: [],
  loading: false,
  error: null
};

export const fetchExamples = createAsyncThunk(
  'examples/fetchAll',
  async () => {
    const response = await axiosInstance.get('/api/examples');
    return response.data;
  }
);

const exampleSlice = createSlice({
  name: 'examples',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamples.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error';
      });
  }
});

export default exampleSlice.reducer;
```

---

## 5. DATABASE MANAGEMENT

### 5.1 Direct Database Access

```python
# Script untuk akses database langsung
from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Query
    result = db.session.execute(db.text("SELECT * FROM users LIMIT 10"))
    for row in result:
        print(row)
    
    # Update
    db.session.execute(db.text("UPDATE users SET is_active = 1 WHERE id = 1"))
    db.session.commit()
```

### 5.2 Common Queries

```python
# Get all with filter
items = Model.query.filter_by(status='active').all()

# Get with multiple conditions
items = Model.query.filter(
    Model.status == 'active',
    Model.created_at >= start_date
).all()

# Order by
items = Model.query.order_by(Model.created_at.desc()).all()

# Pagination
items = Model.query.paginate(page=1, per_page=20)

# Join
items = db.session.query(Model1, Model2).join(
    Model2, Model1.foreign_id == Model2.id
).all()

# Aggregate
from sqlalchemy import func
total = db.session.query(func.sum(Model.quantity)).scalar()
```

### 5.3 Backup & Restore

```bash
# Backup SQLite
cp backend/erp_database.db backend/backups/erp_database_$(date +%Y%m%d).db

# Restore
cp backend/backups/erp_database_20260203.db backend/erp_database.db
```

---

## 6. API DEVELOPMENT

### 6.1 API Response Format

```python
# Success response
{
    "data": {...},
    "message": "Success"
}

# Error response
{
    "error": "Error message",
    "details": {...}  # Optional
}

# List response with pagination
{
    "data": [...],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 100,
        "pages": 5
    }
}
```

### 6.2 Authentication

```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@route.route('/protected')
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    # ... logic
```

### 6.3 Request Validation

```python
def validate_request(data, required_fields):
    missing = [f for f in required_fields if f not in data]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    return True, None

# Usage
@route.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    valid, error = validate_request(data, ['name', 'quantity'])
    if not valid:
        return jsonify({'error': error}), 400
    # ... continue
```

---

## 7. TESTING

### 7.1 Backend Testing

```python
# backend/tests/test_example.py

import pytest
from app import create_app
from models import db

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_get_examples(client):
    response = client.get('/api/examples')
    assert response.status_code == 200

def test_create_example(client):
    response = client.post('/api/examples', json={
        'name': 'Test Example'
    })
    assert response.status_code == 201
```

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=routes --cov-report=html
```

### 7.2 Frontend Testing

```tsx
// frontend/src/pages/Example/__tests__/ExampleList.test.tsx

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExampleList from '../ExampleList';

test('renders example list', async () => {
  render(
    <BrowserRouter>
      <ExampleList />
    </BrowserRouter>
  );
  
  expect(screen.getByText('Examples')).toBeInTheDocument();
});
```

```bash
# Run frontend tests
npm test
```

---

## 8. DEPLOYMENT

### 8.1 Production Build

```bash
# Frontend build
cd frontend
npm run build

# Output di frontend/dist/
```

### 8.2 Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://...
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 8.3 Environment Configuration

```bash
# Production .env
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGINS=https://yourdomain.com
```

---

## 9. MAINTENANCE

### 9.1 Log Monitoring

```bash
# View logs
tail -f backend/logs/app.log

# Search errors
grep "ERROR" backend/logs/app.log
```

### 9.2 Database Maintenance

```python
# Cleanup old records
from datetime import datetime, timedelta

cutoff = datetime.utcnow() - timedelta(days=365)
OldModel.query.filter(OldModel.created_at < cutoff).delete()
db.session.commit()
```

### 9.3 Performance Monitoring

```python
# Add to app.py for request timing
import time

@app.before_request
def before_request():
    g.start_time = time.time()

@app.after_request
def after_request(response):
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        if elapsed > 1:  # Log slow requests
            app.logger.warning(f"Slow request: {request.path} took {elapsed:.2f}s")
    return response
```

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS Error | Origin not allowed | Add origin to CORS_ORIGINS |
| 401 Unauthorized | Token expired | Refresh token or re-login |
| 500 Server Error | Backend exception | Check logs for traceback |
| Database locked | Concurrent writes | Use proper transaction handling |

### 10.2 Debug Mode

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Add debug prints
print(f"[DEBUG] Variable: {variable}")
```

### 10.3 Database Issues

```python
# Reset database (DEVELOPMENT ONLY!)
from app import create_app
from models import db

app = create_app()
with app.app_context():
    db.drop_all()
    db.create_all()
```

### 10.4 Fix Data Inconsistency

```python
# Example: Fix ShiftProduction data
from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Check data
    result = db.session.execute(db.text("""
        SELECT id, good_quantity, downtime_minutes 
        FROM shift_productions 
        WHERE production_date = '2026-02-02'
    """)).fetchall()
    
    for row in result:
        print(row)
    
    # Fix data
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET good_quantity = 1620, downtime_minutes = 85 
        WHERE id = 49
    """))
    db.session.commit()
```

---

*Panduan Teknis - Versi 2.0 - 3 Februari 2026*
