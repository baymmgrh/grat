# Contributing to ERP Flask

Thank you for your interest in ERP Flask! Please note that this is a **proprietary software** project. Before contributing, please read this document carefully.

## ⚠️ Important Notice

This software is proprietary and owned by **PT. Gratia Makmur Sentosa**. By contributing to this project, you agree that:

1. All contributions become the property of PT. Gratia Makmur Sentosa
2. You grant us a perpetual, worldwide, non-exclusive, royalty-free license to use your contributions
3. You confirm that your contributions are your original work
4. You have the right to submit the contributions under this agreement

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/baymngrh/erpflask2.git
   cd erpflask2
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb erp_flask
   
   # Run migrations
   cd backend
   flask db upgrade
   
   # Seed initial data
   python scripts/seed_roles.py
   ```

5. **Environment Variables**
   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://user:pass@localhost:5432/erp_flask
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   FLASK_ENV=development
   
   # Frontend (.env)
   VITE_API_URL=http://localhost:5000/api
   ```

6. **Run Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   flask run
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where possible
- Maximum line length: 100 characters
- Use docstrings for functions and classes

```python
def calculate_total(items: list[dict], tax_rate: float = 0.11) -> float:
    """
    Calculate total amount with tax.
    
    Args:
        items: List of items with 'price' and 'quantity' keys
        tax_rate: Tax rate as decimal (default: 11%)
    
    Returns:
        Total amount including tax
    """
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    return subtotal * (1 + tax_rate)
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use functional components with hooks
- Follow React best practices

```typescript
interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>Code: {product.code}</p>
      <p>Price: {formatCurrency(product.price)}</p>
    </div>
  );
};
```

### File Naming

- Python: `snake_case.py`
- TypeScript/React: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- CSS/SCSS: `kebab-case.css`

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Other changes |

### Scopes

- `auth`, `products`, `sales`, `purchasing`, `production`
- `warehouse`, `quality`, `finance`, `hr`, `reports`
- `frontend`, `backend`, `api`, `db`, `ui`

### Examples

```bash
# Feature
git commit -m "feat(sales): add bulk order import functionality"

# Bug fix
git commit -m "fix(auth): resolve token refresh race condition"

# Documentation
git commit -m "docs(api): update authentication endpoints documentation"

# Tests
git commit -m "test(production): add work order validation tests"

# Breaking change
git commit -m "feat(api)!: change response format for pagination

BREAKING CHANGE: Pagination response now uses 'items' instead of 'data'"
```

## Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run tests locally**
   ```bash
   # Backend
   cd backend
   pytest --cov=. -q
   
   # Frontend
   cd frontend
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

### Submitting PR

1. Push your branch to GitHub
2. Create a Pull Request to `develop` branch
3. Fill in the PR template
4. Wait for CI checks to pass
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::TestAuth::test_login
```

### Frontend Tests

```bash
cd frontend

# Run linter
npm run lint

# Type check
npm run type-check

# Build test
npm run build
```

### Test Coverage Requirements

- Backend: Minimum 40% coverage
- All new features must include tests
- Bug fixes should include regression tests

## Questions?

For questions about contributing:
- Email: dev@gratiamakmursentosa.com
- Create an issue with `[Question]` prefix

---

Thank you for contributing to ERP Flask! 🙏
