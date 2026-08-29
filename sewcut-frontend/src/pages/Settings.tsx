import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Bell, 
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export function Settings() {
  const [companySettings, setCompanySettings] = useState({
    company_name: 'Sew-cut Wearing Apparel Manufacturing',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    tax_number: '',
    invoice_prefix: 'INV-',
    quotation_prefix: 'QT-',
    invoice_notes: '',
    quotation_notes: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: ''
  });

  const [notifications, setNotifications] = useState({
    email_on_payment: true,
    email_on_overdue: true,
    email_on_quotation_approved: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sewcut_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companySettings) setCompanySettings(prev => ({ ...prev, ...parsed.companySettings }));
        if (parsed.notifications) setNotifications(prev => ({ ...prev, ...parsed.notifications }));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('sewcut_settings', JSON.stringify({ companySettings, notifications }));
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  const filledCompanyFields = Object.values(companySettings).filter(value => String(value ?? '').trim().length > 0).length;
  const enabledNotifications = Object.values(notifications).filter(Boolean).length;
  const settingsSections = 3;

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative neu-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl animate-orb1" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/50 rounded-full blur-3xl animate-orb2" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-2xl animate-orb3" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative z-10 hero-content px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SettingsIcon className="w-5 h-5 text-slate-500" />
              <span className="text-slate-500 text-sm font-medium">Settings</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Application Settings</h1>
            <div className="hero-stat-row flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{filledCompanyFields}</p>
                  <p className="text-slate-500 text-xs truncate">Fields Set</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{enabledNotifications}</p>
                  <p className="text-slate-500 text-xs truncate">Alerts On</p>
                </div>
              </div>
              <div className="hero-divider w-px h-8 bg-white/60 hidden sm:block" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 neu-press flex items-center justify-center shrink-0">
                  <SettingsIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-semibold truncate">{settingsSections}</p>
                  <p className="text-slate-500 text-xs truncate">Sections</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="text-slate-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="neu-inset p-1 rounded-xl w-fit min-w-max justify-start gap-1">
          <TabsTrigger value="company" className="gap-2 rounded-lg data-[state=active]:neu-press data-[state=active]:text-slate-800">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2 rounded-lg data-[state=active]:neu-press data-[state=active]:text-slate-800">
            <SettingsIcon className="w-4 h-4" />
            Invoicing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-lg data-[state=active]:neu-press data-[state=active]:text-slate-800">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          </TabsList>
        </div>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card className="neu-surface-soft rounded-2xl">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                This information will appear on your invoices and quotations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                    placeholder="company@example.com"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Phone
                  </Label>
                  <Input
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Address
                  </Label>
                  <Input
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={companySettings.country}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, country: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Website
                  </Label>
                  <Input
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1"
                    placeholder="https://www.example.com"
                  />
                </div>
                <div>
                  <Label>Tax / VAT Number</Label>
                  <Input
                    value={companySettings.tax_number}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, tax_number: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoicing Settings */}
        <TabsContent value="invoicing">
          <Card className="neu-surface-soft rounded-2xl">
            <CardHeader>
              <CardTitle>Invoicing Preferences</CardTitle>
              <CardDescription>
                Customize your invoice and quotation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Invoice Number Prefix</Label>
                  <Input
                    value={companySettings.invoice_prefix}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                    className="mt-1"
                    placeholder="INV-"
                  />
                  <p className="text-xs text-slate-500 mt-1">Example: {companySettings.invoice_prefix}001</p>
                </div>
                <div>
                  <Label>Quotation Number Prefix</Label>
                  <Input
                    value={companySettings.quotation_prefix}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, quotation_prefix: e.target.value }))}
                    className="mt-1"
                    placeholder="QT-"
                  />
                  <p className="text-xs text-slate-500 mt-1">Example: {companySettings.quotation_prefix}001</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Default Invoice Notes</Label>
                  <Textarea
                    value={companySettings.invoice_notes}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, invoice_notes: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    placeholder="Payment terms, bank details, etc."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Default Quotation Notes</Label>
                  <Textarea
                    value={companySettings.quotation_notes}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, quotation_notes: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    placeholder="Terms and conditions, validity period, etc."
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t border-white/70">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Bank Details (shown on invoices)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      value={companySettings.bank_name}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g. BDO, BPI, Metrobank"
                    />
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input
                      value={companySettings.bank_account_name}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_account_name: e.target.value }))}
                      className="mt-1"
                      placeholder="Account holder name"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={companySettings.bank_account_number}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, bank_account_number: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g. 1234-5678-9012"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="neu-surface-soft rounded-2xl">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 neu-inset rounded-xl transition-all">
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-slate-500">Get notified when a client pays an invoice</p>
                  </div>
                  <Switch
                    checked={notifications.email_on_payment}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_on_payment: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 neu-inset rounded-xl transition-all">
                  <div>
                    <p className="font-medium">Overdue Invoice Alert</p>
                    <p className="text-sm text-slate-500">Get notified when an invoice becomes overdue</p>
                  </div>
                  <Switch
                    checked={notifications.email_on_overdue}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_on_overdue: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 neu-inset rounded-xl transition-all">
                  <div>
                    <p className="font-medium">Quotation Approved</p>
                    <p className="text-sm text-slate-500">Get notified when a client approves a quotation</p>
                  </div>
                  <Switch
                    checked={notifications.email_on_quotation_approved}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_on_quotation_approved: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}