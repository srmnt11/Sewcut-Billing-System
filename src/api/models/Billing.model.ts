/**
 * Mongoose Model for Billing Documents
 * 
 * Defines the schema and model for storing billing documents in MongoDB.
 */

import mongoose, { Schema, Model } from 'mongoose';
import { Billing, BillingItem, BillingStatus, EmailStatus } from '../../types/billing.types.js';

/**
 * Billing Item Schema
 */
const billingItemSchema = new Schema<BillingItem>({
  id: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

/**
 * Billing Document Schema
 */
const billingSchema = new Schema<Billing>({
  billingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  billingDate: {
    type: Date,
    required: true,
    index: true
  },
  deliveryReceiptNumber: {
    type: String,
    trim: true,
    default: undefined
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  attentionPerson: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: undefined
  },
  items: {
    type: [billingItemSchema],
    required: true,
    validate: {
      validator: function(items: BillingItem[]) {
        return items && items.length > 0;
      },
      message: 'At least one billing item is required'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Emailed'] as BillingStatus[],
    default: 'Generated',
    index: true
  },
  generatedFilePath: {
    type: String,
    default: undefined
  },
  emailStatus: {
    type: String,
    enum: ['Not Sent', 'Sent', 'Failed', 'Pending'] as EmailStatus[],
    default: 'Not Sent',
    index: true
  },
  emailSentTo: {
    type: String,
    trim: true,
    lowercase: true,
    default: undefined
  },
  emailSentAt: {
    type: Date,
    default: undefined
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'billings'
});

/**
 * Indexes for better query performance
 */
billingSchema.index({ billingDate: -1 }); // Sort by date descending
billingSchema.index({ companyName: 1, billingDate: -1 }); // Search by company and date
billingSchema.index({ status: 1, billingDate: -1 }); // Filter by status and date

/**
 * Pre-save middleware to calculate totals
 */
billingSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.lineTotal, 0);
  
  // Calculate grand total
  this.grandTotal = Math.max(0, this.subtotal - this.discount);
  
  next();
});

/**
 * Billing Model
 */
export const BillingModel: Model<Billing> = mongoose.model<Billing>('Billing', billingSchema);
