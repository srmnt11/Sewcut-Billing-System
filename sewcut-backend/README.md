# Sewcut Billing System - Backend

Django REST API backend for the Sewcut Billing System.

## Features

- **User Authentication**: JWT-based authentication with custom user model
- **Client Management**: CRUD operations for managing clients
- **Supplier Management**: CRUD operations for managing suppliers
- **Quotations**: Create and manage quotations with line items
- **Billing/Invoices**: Full invoice management with automatic calculations
- **Analytics**: Dashboard statistics and reporting endpoints

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/Mac
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create environment file (optional):
```bash
copy .env.example .env  # Edit as needed
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user details

### Clients
- `GET /api/clients/` - List all clients
- `POST /api/clients/` - Create new client
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client
- `GET /api/clients/stats/` - Get client statistics

### Suppliers
- `GET /api/suppliers/` - List all suppliers
- `POST /api/suppliers/` - Create new supplier
- `GET /api/suppliers/{id}/` - Get supplier details
- `PUT /api/suppliers/{id}/` - Update supplier
- `DELETE /api/suppliers/{id}/` - Delete supplier
- `GET /api/suppliers/stats/` - Get supplier statistics

### Quotations
- `GET /api/quotations/` - List all quotations
- `POST /api/quotations/` - Create new quotation
- `GET /api/quotations/{id}/` - Get quotation details
- `PUT /api/quotations/{id}/` - Update quotation
- `DELETE /api/quotations/{id}/` - Delete quotation
- `GET /api/quotations/stats/` - Get quotation statistics

### Billings/Invoices
- `GET /api/billings/` - List all invoices
- `POST /api/billings/` - Create new invoice
- `GET /api/billings/{id}/` - Get invoice details
- `PUT /api/billings/{id}/` - Update invoice
- `DELETE /api/billings/{id}/` - Delete invoice
- `GET /api/billings/stats/` - Get billing statistics

### Analytics
- `GET /api/analytics/dashboard/` - Get dashboard statistics
- `GET /api/analytics/revenue-chart/` - Get revenue chart data
- `GET /api/analytics/top-clients/` - Get top clients by revenue
- `GET /api/analytics/invoice-status/` - Get invoice status distribution

## Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/` with your superuser credentials.

## Project Structure

```
sewcut-backend/
├── users/          # User authentication and management
├── clients/        # Client management
├── suppliers/      # Supplier management
├── quotations/     # Quotation management
├── billings/       # Invoice/billing management
├── analytics/      # Analytics and reporting
└── sewcut/         # Main project settings
```

## Technologies

- Django 5.0.1
- Django REST Framework 3.14.0
- Simple JWT 5.3.1
- Django CORS Headers 4.3.1
- SQLite (can be changed to PostgreSQL/MySQL)
