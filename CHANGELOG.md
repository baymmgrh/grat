# Changelog

All notable changes to ERP Flask will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions
- Comprehensive test suite with 50%+ coverage
- Proprietary license for commercial use

---

## [1.0.0] - 2024-XX-XX

### 🎉 Initial Release

#### Core Modules
- **Authentication & Authorization**
  - JWT-based authentication
  - Role-Based Access Control (RBAC)
  - Multi-level permissions system
  - 25+ predefined role templates (from CEO to Operator)

- **Product Management**
  - Product catalog with specifications
  - Material management
  - Bill of Materials (BOM)
  - Product categories

- **Sales Management**
  - Customer management
  - Sales quotations
  - Sales orders
  - Lead management
  - Invoice generation

- **Purchasing**
  - Supplier management
  - Purchase requisitions
  - Purchase orders
  - Goods receipt

- **Production**
  - Work order management
  - Machine management
  - Production lines
  - Downtime tracking
  - OEE (Overall Equipment Effectiveness)

- **Warehouse & Inventory**
  - Multi-warehouse support
  - Location management
  - Stock movements
  - Stock transfers
  - Inventory valuation

- **Quality Control**
  - Inspection management
  - Defect tracking
  - Quality parameters
  - Quality standards

- **Finance**
  - Chart of accounts
  - Journal entries
  - Invoicing
  - Payments
  - Financial reports

- **Human Resources**
  - Employee management
  - Department management
  - Attendance tracking
  - Leave management
  - Payroll

- **Reports & Analytics**
  - Dashboard analytics
  - Sales reports
  - Production reports
  - Financial reports
  - Custom reports

#### Technical Features
- RESTful API architecture
- React + TypeScript frontend
- Flask + SQLAlchemy backend
- PostgreSQL database
- Real-time notifications
- Multi-language support (ID/EN)
- Dark/Light theme
- Responsive design

---

## Commit Convention

We use conventional commits for clear history:

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system changes |
| `ci` | CI/CD changes |
| `chore` | Other changes |

### Scopes
| Scope | Description |
|-------|-------------|
| `auth` | Authentication & authorization |
| `products` | Product management |
| `sales` | Sales module |
| `purchasing` | Purchasing module |
| `production` | Production module |
| `warehouse` | Warehouse & inventory |
| `quality` | Quality control |
| `finance` | Finance module |
| `hr` | Human resources |
| `reports` | Reports & analytics |
| `frontend` | Frontend changes |
| `backend` | Backend changes |
| `api` | API changes |
| `db` | Database changes |
| `ui` | UI/UX changes |

### Examples
```
feat(auth): add multi-factor authentication
fix(sales): correct invoice calculation
docs(api): update API documentation
test(production): add work order tests
ci: add GitHub Actions workflow
```

### Release Commits
To trigger a release, include `[release]` and version in commit message:
```
chore: [release] v1.0.0 - Initial release
```

---

## Roadmap

### v1.1.0 (Planned)
- [ ] Mobile responsive improvements
- [ ] Email notifications
- [ ] PDF export for all reports
- [ ] Batch operations

### v1.2.0 (Planned)
- [ ] API rate limiting
- [ ] Audit log improvements
- [ ] Data import/export
- [ ] Backup automation

### v2.0.0 (Future)
- [ ] Multi-tenant support
- [ ] Advanced analytics with ML
- [ ] Integration with external systems
- [ ] Mobile app (React Native)

---

## Support

For commercial licensing and support inquiries:
- Email: support@gratiamakmursentosa.com
- Website: https://gratiamakmursentosa.com

---

[Unreleased]: https://github.com/baymngrh/erpflask2/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/baymngrh/erpflask2/releases/tag/v1.0.0
