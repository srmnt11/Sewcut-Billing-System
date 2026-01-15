/**
 * Migration Script: Assign old billings to a user
 * This script updates all billings without a createdBy field
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

import mongoose from 'mongoose';
import { BillingModel } from '../models/Billing.model.js';
import { UserModel } from '../models/User.model.js';

async function migrateBillings() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the first admin user to assign billings to
    const adminUser = await UserModel.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`👤 Found admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`   User ID: ${adminUser._id}\n`);

    // Find all billings without createdBy field
    const billingsWithoutOwner = await BillingModel.find({ 
      createdBy: { $exists: false } 
    });

    console.log(`📊 Found ${billingsWithoutOwner.length} billings without owner\n`);

    if (billingsWithoutOwner.length === 0) {
      console.log('✅ All billings already have an owner. Migration complete!');
      process.exit(0);
    }

    // Update all billings without createdBy
    const result = await BillingModel.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: adminUser._id } }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   Updated ${result.modifiedCount} billings`);
    console.log(`   All old billings now owned by: ${adminUser.name}\n`);

    // Also migrate drafts
    const { DraftBillingModel } = await import('../models/Draft.model.js');
    
    const draftsWithoutOwner = await DraftBillingModel.find({ 
      createdBy: { $exists: false } 
    });

    console.log(`📝 Found ${draftsWithoutOwner.length} drafts without owner`);

    if (draftsWithoutOwner.length > 0) {
      const draftResult = await DraftBillingModel.updateMany(
        { createdBy: { $exists: false } },
        { $set: { createdBy: adminUser._id } }
      );

      console.log(`✅ Updated ${draftResult.modifiedCount} drafts\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateBillings();
