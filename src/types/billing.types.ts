/**
 * Billing Data Models for MongoDB and TypeScript
 */

/**
 * Billing Status Types
 */
export type BillingStatus = 'Draft' | 'Generated' | 'Emailed';

/**
 * Email Status Types
 */
export type EmailStatus = 'Not Sent' | 'Sent' | 'Failed' | 'Pending';

/**
 * Billing Item Interface
 * Represents a single line item in the billing
 */
export interface BillingItem {
  /** Unique identifier for the item within the billing */
  id: string;
  
  /** Quantity of the item */
  quantity: number;
  
  /** Description of the item/service */
  description: string;
  
  /** Price per unit */
  unitPrice: number;
  
  /** Calculated line total (quantity × unitPrice) */
  lineTotal: number;
}

/**
 * Billing Document Interface
 * Main billing schema for MongoDB
 */
export interface Billing {
  /** MongoDB document ID */
  _id?: string;
  
  /** Unique billing number (e.g., SEW-202601-001) */
  billingNumber: string;
  
  /** Date when the billing was created/issued */
  billingDate: Date;
  
  /** Optional delivery receipt number */
  deliveryReceiptNumber?: string;
  
  /** Client company name */
  companyName: string;
  
  /** Client billing address */
  address: string;
  
  /** Client contact phone number */
  contactNumber: string;
  
  /** Name of the person to be contacted */
  attentionPerson: string;
  
  /** Optional client email address */
  clientEmail?: string;
  
  /** Array of itemized billing items */
  items: BillingItem[];
  
  /** Subtotal amount (sum of all line totals) */
  subtotal: number;
  
  /** Discount amount applied */
  discount: number;
  
  /** Final amount after discount (subtotal - discount) */
  grandTotal: number;
  
  /** Current status of the billing */
  status: BillingStatus;
  
  /** File path to the generated PDF (if generated) */
  generatedFilePath?: string;
  
  /** Email delivery status */
  emailStatus: EmailStatus;
  
  /** Email address where billing was sent */
  emailSentTo?: string;
  
  /** Timestamp when email was sent */
  emailSentAt?: Date;
  
  /** Timestamp when the document was created */
  createdAt: Date;
  
  /** Timestamp when the document was last updated */
  updatedAt: Date;
  
  /** User who created the billing (if user system exists) */
  createdBy?: string;
  
  /** User who last updated the billing */
  updatedBy?: string;
}

/**
 * Billing Creation DTO (Data Transfer Object)
 * Used when creating a new billing
 */
export interface CreateBillingDTO {
  billingDate: string;
  deliveryReceiptNumber?: string;
  companyName: string;
  address: string;
  contactNumber: string;
  attentionPerson: string;
  clientEmail?: string;
  items: BillingItem[];
  discount: number;
}

/**
 * Billing Update DTO
 * Used when updating an existing billing
 */
export interface UpdateBillingDTO {
  billingDate?: string;
  deliveryReceiptNumber?: string;
  companyName?: string;
  address?: string;
  contactNumber?: string;
  attentionPerson?: string;
  clientEmail?: string;
  items?: BillingItem[];
  discount?: number;
  status?: BillingStatus;
  emailStatus?: EmailStatus;
  generatedFilePath?: string;
}

/**
 * Billing Query Filters
 * Used for searching and filtering billings
 */
export interface BillingQueryFilters {
  /** Filter by billing status */
  status?: BillingStatus;
  
  /** Filter by email status */
  emailStatus?: EmailStatus;
  
  /** Filter by company name (partial match) */
  companyName?: string;
  
  /** Filter by billing number (partial match) */
  billingNumber?: string;
  
  /** Filter by date range - start date */
  dateFrom?: Date;
  
  /** Filter by date range - end date */
  dateTo?: Date;
  
  /** Filter by minimum amount */
  minAmount?: number;
  
  /** Filter by maximum amount */
  maxAmount?: number;
}

/**
 * Billing Summary Statistics
 * Used for dashboard analytics
 */
export interface BillingStatistics {
  /** Total number of billings */
  totalBillings: number;
  
  /** Number of billings this month */
  billingsThisMonth: number;
  
  /** Number of billings with 'Emailed' status */
  emailedBillings: number;
  
  /** Total revenue from all billings */
  totalRevenue: number;
  
  /** Revenue this month */
  revenueThisMonth: number;
  
  /** Number of draft billings */
  draftBillings: number;
  
  /** Number of generated but not emailed billings */
  generatedBillings: number;
}

/**
 * MongoDB Schema Definition (for reference)
 * This would be used with Mongoose or similar ODM
 */
export const BillingSchema = {
  billingNumber: { type: String, required: true, unique: true, index: true },
  billingDate: { type: Date, required: true, index: true },
  deliveryReceiptNumber: { type: String, default: null },
  companyName: { type: String, required: true, index: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  attentionPerson: { type: String, required: true },
  items: [{
    id: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    description: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Draft', 'Generated', 'Emailed'], 
    default: 'Draft',
    index: true
  },
  generatedFilePath: { type: String, default: null },
  emailStatus: { 
    type: String, 
    enum: ['Not Sent', 'Sent', 'Failed', 'Pending'], 
    default: 'Not Sent',
    index: true
  },
  emailSentTo: { type: String, default: null },
  emailSentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: null },
  updatedBy: { type: String, default: null }
};

/**
 * Helper function to calculate line total
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Helper function to calculate subtotal from items
 */
export function calculateSubtotal(items: BillingItem[]): number {
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return Number(total.toFixed(2));
}

/**
 * Helper function to calculate grand total
 */
export function calculateGrandTotal(subtotal: number, discount: number): number {
  const total = Math.max(0, subtotal - discount);
  return Number(total.toFixed(2));
}

/**
 * Helper function to create a billing item
 */
export function createBillingItem(
  id: string,
  quantity: number,
  description: string,
  unitPrice: number
): BillingItem {
  return {
    id,
    quantity,
    description,
    unitPrice,
    lineTotal: calculateLineTotal(quantity, unitPrice)
  };
}
