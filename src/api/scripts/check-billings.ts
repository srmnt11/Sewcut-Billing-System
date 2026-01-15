import mongoose from 'mongoose';
import { BillingModel } from '../models/Billing.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function checkBillings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const billings = await BillingModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log('\n=== Recent Billings ===');
    console.log(`Total billings found: ${billings.length}`);
    
    billings.forEach((billing, index) => {
      console.log(`\nBilling ${index + 1}:`);
      console.log(`  Number: ${billing.billingNumber}`);
      console.log(`  Company: ${billing.companyName}`);
      console.log(`  Subtotal: ₱${billing.subtotal}`);
      console.log(`  Discount: ₱${billing.discount}`);
      console.log(`  Grand Total: ₱${billing.grandTotal}`);
      console.log(`  Status: ${billing.status}`);
      console.log(`  Email Status: ${billing.emailStatus}`);
      console.log(`  Date: ${billing.billingDate}`);
      console.log(`  Created By: ${billing.createdBy}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBillings();
