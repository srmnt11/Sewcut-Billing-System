import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, X, Paperclip } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; message: string }) => void;
  billing: any;
  isLoading?: boolean;
}

export default function SendEmailDialog({
  open,
  onClose,
  onSend,
  billing,
  isLoading = false
}: SendEmailDialogProps) {
  const [emailData, setEmailData] = useState({
    to: billing?.companyEmail || '',
    subject: `Invoice ${billing?.billingNumber || ''} from Sewcut`,
    message: `Dear ${billing?.companyName || 'Valued Client'},

Please find attached the invoice ${billing?.billingNumber || ''} for your review.

Total Amount: ₱{billing?.grandTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}

If you have any questions, please don't hesitate to contact us.

Best regards,
Sewcut Team`
  });

  const handleSend = () => {
    onSend(emailData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Send invoice {billing?.billingNumber} to client with PDF attachment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Recipient Email */}
          <div>
            <Label className="text-sm font-medium">To Email *</Label>
            <Input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="client@example.com"
              className="mt-1"
            />
          </div>

          {/* Subject */}
          <div>
            <Label className="text-sm font-medium">Subject *</Label>
            <Input
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Invoice subject"
              className="mt-1"
            />
          </div>

          {/* Message */}
          <div>
            <Label className="text-sm font-medium">Message *</Label>
            <Textarea
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Email message body"
              className="mt-1"
              rows={8}
            />
          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Paperclip className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800 text-sm">PDF will be automatically attached</p>
              <p className="text-xs text-blue-600 mt-0.5">The invoice PDF will be generated and attached to this email</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || !emailData.to || !emailData.subject || !emailData.message}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
