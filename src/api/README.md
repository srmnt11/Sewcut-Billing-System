# Billing System API

REST API for managing billing records in the Sewcut Billing System.

## Setup

### Install Dependencies

```bash
npm install express cors
npm install -D @types/express @types/cors
```

### Database Setup (MongoDB)

To use with MongoDB, install Mongoose:

```bash
npm install mongoose
npm install -D @types/mongoose
```

Then create a Mongoose model based on the schema in `src/types/billing.types.ts`.

## API Endpoints

### Create Billing
**POST** `/api/billings`

Create a new billing record.

**Request Body:**
```json
{
  "billingDate": "2026-01-15",
  "deliveryReceiptNumber": "DR-12345",
  "companyName": "Acme Corp",
  "address": "123 Business Street, Suite 100, New York, NY 10001",
  "contactNumber": "+1 (555) 123-4567",
  "attentionPerson": "John Doe",
  "items": [
    {
      "id": "1",
      "quantity": 10,
      "description": "Premium Widget",
      "unitPrice": 50.00
    }
  ],
  "discount": 25.00
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Billing created successfully",
  "data": {
    "_id": "65abc123...",
    "billingNumber": "SEW-202601-001",
    "billingDate": "2026-01-15T00:00:00.000Z",
    "companyName": "Acme Corp",
    "items": [...],
    "subtotal": 500.00,
    "discount": 25.00,
    "grandTotal": 475.00,
    "status": "Draft",
    "emailStatus": "Not Sent",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Company name is required",
    "At least one valid item is required"
  ]
}
```

### Get All Billings
**GET** `/api/billings`

Retrieve all billings with optional filters.

**Query Parameters:**
- `status` - Filter by billing status (Draft, Generated, Emailed)
- `emailStatus` - Filter by email status
- `companyName` - Filter by company name (partial match)
- `dateFrom` - Filter by date range start
- `dateTo` - Filter by date range end
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `/api/billings?status=Emailed&page=1&limit=20`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Get Billing by ID
**GET** `/api/billings/:id`

Retrieve a single billing by ID.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Billing not found"
}
```

### Update Billing
**PUT** `/api/billings/:id`

Update an existing billing.

**Request Body:** (Partial update supported)
```json
{
  "status": "Generated",
  "emailStatus": "Sent",
  "generatedFilePath": "/pdfs/SEW-202601-001.pdf"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Billing updated successfully",
  "data": { ... }
}
```

### Delete Billing
**DELETE** `/api/billings/:id`

Delete a billing record.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Billing deleted successfully"
}
```

## Error Handling

The API uses standard HTTP status codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **404** - Not Found
- **409** - Conflict (duplicate billing number)
- **500** - Internal Server Error

## Validation Rules

### Required Fields
- `companyName` - Minimum 2 characters
- `address` - Minimum 10 characters
- `contactNumber` - Valid phone number format
- `attentionPerson` - Minimum 2 characters
- `billingDate` - Valid date format
- `items` - At least one valid item

### Item Validation
Each item must have:
- `description` - Non-empty string
- `quantity` - Greater than 0
- `unitPrice` - Non-negative number

### Business Rules
- Discount cannot exceed subtotal
- Billing number is auto-generated (unique)
- Line totals are automatically calculated
- Subtotal and grand total are automatically calculated

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will start on port 3001 by default. Set the `PORT` environment variable to use a different port.

## Integration with Frontend

To connect the React frontend to this API, update your API calls to use the endpoint:

```typescript
const API_BASE_URL = 'http://localhost:3001/api';

// Example: Create billing
const response = await fetch(`${API_BASE_URL}/billings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(billingData),
});
```
