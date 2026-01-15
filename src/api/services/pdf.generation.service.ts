/**
 * PDF Generation Service
 * Generates professional billing invoices as PDF documents
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Billing } from '../../types/billing.types';
import { storageConfig } from '../../config';

/**
 * PDF Generation Service Class
 */
export class PdfGenerationService {
  // Directory where PDFs will be saved (from config)
  private static readonly PDF_DIR = storageConfig.pdfOutputDir;

  /**
   * Initialize PDF directory
   * Creates the directory if it doesn't exist
   */
  private static ensurePdfDirectory(): void {
    if (!fs.existsSync(this.PDF_DIR)) {
      fs.mkdirSync(this.PDF_DIR, { recursive: true });
    }
  }

  /**
   * Format currency value
   */
  private static formatCurrency(amount: number): string {
    // PDFKit's default Helvetica font doesn't support ₱ symbol properly
    // So we format manually with PHP prefix
    const formatted = amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `PHP ${formatted}`;
  }

  /**
   * Format date
   */
  private static formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate PDF invoice from billing data
   * @param billing - Billing data
   * @returns Promise<string> - File path of generated PDF
   */
  static async generateInvoice(billing: Billing): Promise<string> {
    this.ensurePdfDirectory();

    // Generate filename
    const filename = `${billing.billingNumber}.pdf`;
    const filePath = path.join(this.PDF_DIR, filename);

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${billing.billingNumber}`,
            Author: 'Sewcut Billing System',
            Subject: `Invoice for ${billing.companyName}`,
            CreationDate: new Date()
          }
        });

        // Pipe to file
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header Section
        this.addHeader(doc, billing);

        // Company Details Section
        this.addCompanyDetails(doc, billing);

        // Billing Information
        this.addBillingInfo(doc, billing);

        // Itemized Table
        this.addItemizedTable(doc, billing);

        // Totals Section
        this.addTotals(doc, billing);

        // Footer
        this.addFooter(doc);

        // Finalize PDF
        doc.end();

        // Handle stream events
        writeStream.on('finish', () => {
          resolve(filePath);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header section to PDF
   */
  private static addHeader(doc: PDFKit.PDFDocument, billing: Billing): void {
    // Company Logo/Name
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('BILLING STATEMENT', 50, 40, { align: 'left' })
      .fontSize(9)
      .font('Helvetica')
      .text('Sewcut Billing System', 50, 65);

    // Billing Number Box (top right)
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Billing No.', 400, 40, { width: 145, align: 'right' })
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(billing.billingNumber, 400, 53, { width: 145, align: 'right' })
      .fillColor('#000000');

    // Horizontal line
    doc
      .moveTo(50, 85)
      .lineTo(545, 85)
      .strokeColor('#2563eb')
      .lineWidth(1.5)
      .stroke();
  }

  /**
   * Add company details section
   */
  private static addCompanyDetails(doc: PDFKit.PDFDocument, billing: Billing): void {
    let yPosition = 100;

    // From Section (left)
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text('FROM', 50, yPosition);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Sew Cut Wearing Apparel Manufacturing', 50, yPosition + 12)
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text('13 Delaware St. Barangay Banaba', 50, yPosition + 24)
      .text('San Mateo, Rizal 1850', 50, yPosition + 35)
      .text('sewcut.garmentsmanufacturing@gmail.com', 50, yPosition + 46);

    // Billing Details (right)
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text('BILLING DETAILS', 350, yPosition);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text('Date:', 350, yPosition + 12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(this.formatDate(billing.billingDate), 420, yPosition + 12);

    if (billing.deliveryReceiptNumber) {
      doc
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('DR No:', 350, yPosition + 24)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(billing.deliveryReceiptNumber, 420, yPosition + 24);
    }

    // Billed To Section (full width)
    yPosition = 165;
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text('BILLED TO', 50, yPosition);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(billing.companyName, 50, yPosition + 12)
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(billing.address, 50, yPosition + 24, { width: 300 });

    let billedToYOffset = yPosition + 24;
    const addressHeight = doc.heightOfString(billing.address, { width: 300 });
    billedToYOffset += addressHeight;

    if (billing.contactNumber) {
      doc.text(`Tel: ${billing.contactNumber}`, 50, billedToYOffset + 3);
      billedToYOffset += 10;
    }

    if (billing.attentionPerson) {
      doc.text(`Attention: ${billing.attentionPerson}`, 50, billedToYOffset + 3);
    }
  }

  /**
   * Add billing info section
   */
  private static addBillingInfo(doc: PDFKit.PDFDocument, _billing: Billing): void {
    // Calculate dynamic Y position based on previous content
    const yPosition = 245;

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6b7280')
      .text('ITEMS', 50, yPosition);
  }

  /**
   * Add itemized table
   */
  private static addItemizedTable(doc: PDFKit.PDFDocument, billing: Billing): void {
    let yPosition = 260;

    // Table Header
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('QTY', 50, yPosition, { width: 40, align: 'center' })
      .text('DESCRIPTION', 95, yPosition, { width: 250, align: 'left' })
      .text('UNIT PRICE', 360, yPosition, { width: 90, align: 'right' })
      .text('LINE TOTAL', 455, yPosition, { width: 90, align: 'right' });

    // Header underline
    yPosition += 13;
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .stroke();

    // Table Rows
    yPosition += 8;

    billing.items
      .filter(item => item.description.trim() !== '')
      .forEach((item, _index) => {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#000000')
          .text(item.quantity.toString(), 50, yPosition, { width: 40, align: 'center' })
          .text(item.description, 95, yPosition, { width: 250, align: 'left' })
          .text(this.formatCurrency(item.unitPrice), 360, yPosition, { width: 90, align: 'right' })
          .font('Helvetica-Bold')
          .text(this.formatCurrency(item.lineTotal), 455, yPosition, { width: 90, align: 'right' });

        yPosition += 15;
      });

    // Bottom border
    doc
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .stroke();
  }

  /**
   * Add totals section
   */
  private static addTotals(doc: PDFKit.PDFDocument, billing: Billing): void {
    // Position totals at bottom of page or after items
    let yPosition = 490;

    // Totals box (right aligned)
    const boxX = 365;
    const boxWidth = 180;

    // Background
    doc
      .rect(boxX, yPosition, boxWidth, 75)
      .fillAndStroke('#f9fafb', '#e5e7eb');

    yPosition += 12;

    // Subtotal
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text('Subtotal:', boxX + 12, yPosition)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(this.formatCurrency(billing.subtotal), boxX + 12, yPosition, {
        width: boxWidth - 24,
        align: 'right'
      });

    // Discount (if applicable)
    if (billing.discount > 0) {
      yPosition += 16;
      doc
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('Discount:', boxX + 12, yPosition)
        .font('Helvetica-Bold')
        .fillColor('#dc2626')
        .text(`-${this.formatCurrency(billing.discount)}`, boxX + 12, yPosition, {
          width: boxWidth - 24,
          align: 'right'
        });
    }

    // Divider
    yPosition += 16;
    doc
      .moveTo(boxX + 12, yPosition)
      .lineTo(boxX + boxWidth - 12, yPosition)
      .strokeColor('#9ca3af')
      .lineWidth(1)
      .stroke();

    // Grand Total
    yPosition += 8;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Grand Total:', boxX + 12, yPosition)
      .fontSize(12)
      .fillColor('#2563eb')
      .text(this.formatCurrency(billing.grandTotal), boxX + 12, yPosition, {
        width: boxWidth - 24,
        align: 'right'
      });
  }

  /**
   * Add footer with payment terms and bank details
   */
  private static addFooter(doc: PDFKit.PDFDocument): void {
    const startY = 585;
    
    // Payment Terms Header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('Terms:', 50, startY, { align: 'left' });
    
    // Term 1
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#374151')
      .text(
        '1. 50% Down Payment upon confirmation of order (through bank deposit)',
        50,
        startY + 13,
        { align: 'left', width: 495 }
      );
    
    // Term 2
    doc
      .text(
        '2. 50% Full payment after 5 working days upon completion of orders (through bank deposit)',
        50,
        startY + 25,
        { align: 'left', width: 495 }
      );
    
    // Bank Details Header
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('*Deposit all payments to:', 50, startY + 43, { align: 'left' });
    
    // BDO Account Name
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#dc2626')
      .text('BDO Account Name: ', 50, startY + 56, { continued: true })
      .font('Helvetica-Bold')
      .text('SEW-CUT WEARING APPAREL MANUFACTURING');
    
    // Account Number
    doc
      .font('Helvetica')
      .fillColor('#dc2626')
      .text('Account Number: ', 50, startY + 68, { continued: true })
      .font('Helvetica-Bold')
      .text('012258002502');
    
    // Computer-generated notice
    doc
      .fontSize(7)
      .font('Helvetica-Oblique')
      .fillColor('#9ca3af')
      .text(
        'This is a computer-generated document. No signature is required.',
        50,
        startY + 85,
        { align: 'center', width: 495 }
      );
  }

  /**
   * Delete a PDF file
   * @param filePath - Path to the PDF file
   */
  static async deletePdf(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if PDF exists
   * @param filePath - Path to the PDF file
   * @returns boolean
   */
  static pdfExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
