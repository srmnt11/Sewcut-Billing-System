/**
 * Validation utilities for form fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  return { isValid: true };
}

/**
 * Validate company name
 */
export function validateCompanyName(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Company name is required'
    };
  }
  if (value.trim().length < 2) {
    return {
      isValid: false,
      error: 'Company name must be at least 2 characters'
    };
  }
  return { isValid: true };
}

/**
 * Validate address
 */
export function validateAddress(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Address is required'
    };
  }
  if (value.trim().length < 10) {
    return {
      isValid: false,
      error: 'Please provide a complete address'
    };
  }
  return { isValid: true };
}

/**
 * Validate contact number (optional but must be valid if provided)
 */
export function validateContactNumber(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true }; // Optional field
  }
  
  // Remove common formatting characters
  const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it contains only digits and + (for country code)
  if (!/^[\+]?[\d]+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number'
    };
  }
  
  if (cleaned.length < 10) {
    return {
      isValid: false,
      error: 'Phone number must be at least 10 digits'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate attention person
 */
export function validateAttentionPerson(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Attention/Contact person is required'
    };
  }
  if (value.trim().length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters'
    };
  }
  return { isValid: true };
}

/**
 * Validate billing date
 */
export function validateBillingDate(value: string): ValidationResult {
  if (!value) {
    return {
      isValid: false,
      error: 'Billing date is required'
    };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate billing items array
 */
export function validateBillingItems(items: any[]): ValidationResult {
  const validItems = items.filter(item => 
    item.description && 
    item.description.trim() !== '' &&
    item.quantity > 0 &&
    item.unitPrice >= 0
  );
  
  if (validItems.length === 0) {
    return {
      isValid: false,
      error: 'At least one valid item is required (with description, quantity > 0, and unit price ≥ 0)'
    };
  }
  
  return { isValid: true };
}

/**
 * Validate item description
 */
export function validateItemDescription(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: 'Description is required'
    };
  }
  return { isValid: true };
}

/**
 * Validate item quantity
 */
export function validateItemQuantity(value: number): ValidationResult {
  if (value <= 0) {
    return {
      isValid: false,
      error: 'Quantity must be greater than 0'
    };
  }
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Quantity must be a whole number'
    };
  }
  return { isValid: true };
}

/**
 * Validate item unit price
 */
export function validateItemUnitPrice(value: number): ValidationResult {
  if (value < 0) {
    return {
      isValid: false,
      error: 'Unit price cannot be negative'
    };
  }
  return { isValid: true };
}

/**
 * Validate discount
 */
export function validateDiscount(discount: number, subtotal: number): ValidationResult {
  if (discount < 0) {
    return {
      isValid: false,
      error: 'Discount cannot be negative'
    };
  }
  if (discount > subtotal) {
    return {
      isValid: false,
      error: 'Discount cannot exceed subtotal'
    };
  }
  return { isValid: true };
}
