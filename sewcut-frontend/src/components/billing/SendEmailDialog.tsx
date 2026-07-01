import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Mail, Send, X, Paperclip, Clock } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; message: string }) => void;
  onSchedule?: (emailData: { to: string; subject: string; message: string; scheduled_at: string }) => void;
  billing: any;
  isLoading?: boolean;
  documentType?: 'Invoice' | 'Quotation' | 'Delivery Receipt';
}

export default function SendEmailDialog({
  open,
  onClose,
  onSend,
  onSchedule,
  billing,
  isLoading = false,
  documentType = 'Invoice',
}: SendEmailDialogProps) {
  const documentNumber = billing?.billingNumber || billing?.quotationNumber || billing?.receiptNumber || '';
  const documentTypeLower = documentType.toLowerCase();
  const deliveryDate = billing?.deliveryDate || 'N/A';
  const referenceNumber = billing?.referenceNumber || 'N/A';

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getMinScheduledDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    now.setSeconds(0, 0);
    return now;
  };

  const buildDefaultMessage = () => {
    if (documentType === 'Delivery Receipt') {
      return `Dear ${billing?.companyName || 'Valued Client'},\n\nPlease find the attached delivery receipt ${documentNumber} for your reference.\n\nDelivery Date: ${deliveryDate}\nReference Number: ${referenceNumber}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nSew-cut Team`;
    }
    return `Dear ${billing?.companyName || 'Valued Client'},\n\nPlease find the attached ${documentTypeLower} ${documentNumber} for your review.\n\nTotal Amount: ₱${billing?.grandTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nSew-cut Team`;
  };

  const buildInitialEmailData = () => ({
    to: billing?.companyEmail || '',
    subject: `${documentType} ${documentNumber} from Sew-cut`,
    message: buildDefaultMessage(),
  });

  const [emailData, setEmailData] = useState(buildInitialEmailData);

  useEffect(() => {
    if (open) {
      setEmailData(buildInitialEmailData());
      setIsScheduled(false);
      const defaultScheduled = getMinScheduledDateTime();
      setScheduledDate(getLocalDateString(defaultScheduled));
      setScheduledTime(getLocalTimeString(defaultScheduled));
    }
  }, [open, billing, documentType]);

  const scheduledAtIso = scheduledDate && scheduledTime
    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    : '';

  const isScheduleValid =
    scheduledDate !== '' &&
    scheduledTime !== '' &&
    scheduledAtIso !== '' &&
    new Date(scheduledAtIso) > new Date();

  const handleSend = () => {
    if (isScheduled) {
      if (!isScheduleValid) {
        return;
      }
      const scheduledAt = scheduledAtIso;
      onSchedule?.({ ...emailData, scheduled_at: scheduledAt });
    } else {
      onSend(emailData);
    }
  };

  const canSubmit =
    !isLoading &&
    emailData.to &&
    emailData.subject &&
    emailData.message &&
    (!isScheduled || isScheduleValid);

  const minDate = getLocalDateString(new Date());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/*
        ─── KEY FIXES ───────────────────────────────────────────────────────────
        1. max-h-[90dvh] + flex flex-col  →  dialog never overflows the viewport
        2. overflow-y-auto on the body    →  content scrolls inside the dialog
        3. All amber/blue hardcoded colors replaced with dark:-aware variants
        ─────────────────────────────────────────────────────────────────────────
      */}
      <DialogContent className="max-w-2xl max-h-[90dvh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">

        {/* ── Fixed header (never scrolls away) ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Send {documentType} via Email
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1">
            Send {documentTypeLower} {documentNumber} to client with PDF attachment
          </DialogDescription>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Recipient */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              To Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="client@example.com"
              className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Subject */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder={`${documentType} subject`}
              className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Message */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Email message body"
              className="mt-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              rows={7}
            />
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center gap-3 py-1">
            <Switch
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
              id="schedule-toggle"
            />
            <label
              htmlFor="schedule-toggle"
              className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
            >
              Schedule for later
            </label>
          </div>

          {/* Schedule picker */}
          {isScheduled && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="col-span-2 flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  The PDF will be generated and sent automatically at the scheduled time. Pick a time at least 1 minute in the future.
                </p>
              </div>
            </div>
          )}

          {/* PDF attachment notice */}
          <div className="rounded-xl p-4 flex items-start gap-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                PDF will be automatically attached
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                The {documentTypeLower} PDF will be generated and attached to this email
              </p>
            </div>
          </div>
        </div>

        {/* ── Fixed footer (always visible, never scrolls off screen) ── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSubmit}
            className="rounded-xl"
          >
            {isScheduled
              ? <><Clock className="w-4 h-4 mr-2" />{isLoading ? 'Scheduling...' : 'Schedule Send'}</>
              : <><Send className="w-4 h-4 mr-2" />{isLoading ? 'Sending...' : 'Send Email'}</>
            }
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}