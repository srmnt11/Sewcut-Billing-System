/**
 * Mongoose Model for Draft Billing Documents
 * 
 * Defines the schema and model for storing draft billings in MongoDB.
 */

import mongoose, { Schema, Model } from 'mongoose';
import { BillingItem } from '../../types/billing.types.js';

/**
 * Draft Billing Interface
 */
export interface DraftBilling {
  _id?: string;
  savedAt: Date;
  billingDate: Date;
  deliveryReceiptNumber?: string;
  companyName: string;
  contactNumber: string;
  address: string;
  attentionPerson: string;
  clientEmail?: string;
  items: BillingItem[];
  discount: number;
  subtotal: number;
  grandTotal: number;
  createdBy: mongoose.Types.ObjectId;
}

/**
 * Draft Billing Item Schema
 */
const draftBillingItemSchema = new Schema<BillingItem>({
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
    trim: true,
    default: ''
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

/**
 * Draft Billing Schema
 */
const draftBillingSchema = new Schema<DraftBilling>({
  savedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  billingDate: {
    type: Date,
    required: true
  },
  deliveryReceiptNumber: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactNumber: {
    type: String,
    trim: true,
    default: ''
  },
  attentionPerson: {
    type: String,
    trim: true,
    default: ''
  },
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  items: {
    type: [draftBillingItemSchema],
    required: true,
    default: []
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

/**
 * Draft Billing Model
 */
export const DraftBillingModel: Model<DraftBilling> = mongoose.model<DraftBilling>('Draft', draftBillingSchema);
