import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { FormSection } from '../components/FormSection';
import { ItemizedTable, BillingItem } from '../components/ItemizedTable';
import { BillingTotals } from '../components/BillingTotals';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Save, Send, AlertCircle, Loader2 } from 'lucide-react';
import { generateBillingNumber } from '../lib/utils';
import {
  validateCompanyName,
  validateAddress,
  validateContactNumber,
  validateAttentionPerson,
  validateBillingDate,
  validateBillingItems,
  validateDiscount
} from '../lib/validation';
import { BillingApiService } from '../services/billing.api.service';
import { DraftApiService } from '../services/draft.api.service';
export function CreateBilling() {
  const navigate = useNavigate();
  const location = useLocation();
  const draftData = (location.state as any)?.draft;
  
  // Generate unique billing number on mount
  const [billingNumber, setBillingNumber] = useState<string>('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [billingDate, setBillingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Form State - Billing Information
  const [deliveryReceiptNumber, setDeliveryReceiptNumber] = useState<string>('');
  
  // Form State - Billed To
  const [companyName, setCompanyName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [attentionPerson, setAttentionPerson] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  
  // Form State - Items and Discount
  const [items, setItems] = useState<BillingItem[]>([{
    id: '1',
    quantity: 1,
    description: '',
    unitPrice: 0
  }, {
    id: '2',
    quantity: 1,
    description: '',
    unitPrice: 0
  }]);
  const [discount, setDiscount] = useState<number>(0);
  
  // Validation Error States
  const [errors, setErrors] = useState<{
    companyName?: string;
    contactNumber?: string;
    address?: string;
    attentionPerson?: string;
    billingDate?: string;
    clientEmail?: string;
    items?: string;
    discount?: string;
  }>({});
  
  // Track which fields have been touched (for showing validation errors)
  const [touched, setTouched] = useState<{
    companyName?: boolean;
    contactNumber?: boolean;
    address?: boolean;
    attentionPerson?: boolean;
    billingDate?: boolean;
    clientEmail?: boolean;
    discount?: boolean;
  }>({});
  
  // API state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  
  // Generate unique billing number when component loads or load draft data
  useEffect(() => {
    if (draftData) {
      // Load draft data
      setDraftId(draftData._id || null);
      setBillingDate(draftData.billingDate);
      setDeliveryReceiptNumber(draftData.deliveryReceiptNumber || '');
      setCompanyName(draftData.companyName);
      setContactNumber(draftData.contactNumber);
      setAddress(draftData.address);
      setAttentionPerson(draftData.attentionPerson);
      setClientEmail(draftData.clientEmail || '');
      setItems(draftData.items);
      setDiscount(draftData.discount);
    }
    
    const generatedBillingNumber = generateBillingNumber();
    setBillingNumber(generatedBillingNumber);
  }, []);
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  
  // Real-time validation - runs whenever form values change
  useEffect(() => {
    const newErrors: typeof errors = {};
    
    // Validate company name
    if (touched.companyName) {
      const result = validateCompanyName(companyName);
      if (!result.isValid) newErrors.companyName = result.error;
    }
    
    // Validate contact number
    if (touched.contactNumber) {
      const result = validateContactNumber(contactNumber);
      if (!result.isValid) newErrors.contactNumber = result.error;
    }
    
    // Validate address
    if (touched.address) {
      const result = validateAddress(address);
      if (!result.isValid) newErrors.address = result.error;
    }
    
    // Validate attention person
    if (touched.attentionPerson) {
      const result = validateAttentionPerson(attentionPerson);
      if (!result.isValid) newErrors.attentionPerson = result.error;
    }
    
    // Validate billing date
    if (touched.billingDate) {
      const result = validateBillingDate(billingDate);
      if (!result.isValid) newErrors.billingDate = result.error;
    }
    
    // Validate discount
    if (touched.discount) {
      const result = validateDiscount(discount, subtotal);
      if (!result.isValid) newErrors.discount = result.error;
    }
    
    // Validate email
    if (touched.clientEmail) {
      if (!clientEmail || clientEmail.trim() === '') {
        newErrors.clientEmail = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        newErrors.clientEmail = 'Please enter a valid email address';
      }
    }
    
    // Validate items (always validate)
    const itemsResult = validateBillingItems(items);
    if (!itemsResult.isValid) newErrors.items = itemsResult.error;
    
    setErrors(newErrors);
  }, [companyName, contactNumber, address, attentionPerson, billingDate, items, discount, subtotal, touched]);
  
  // Form is valid if there are no errors and all required fields are filled
  const isFormValid = 
    validateCompanyName(companyName).isValid &&
    validateAddress(address).isValid &&
    validateAttentionPerson(attentionPerson).isValid &&
    validateBillingDate(billingDate).isValid &&
    validateContactNumber(contactNumber).isValid &&
    clientEmail.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) &&
    validateBillingItems(items).isValid &&
    validateDiscount(discount, subtotal).isValid;
  const handleUpdateItem = (id: string, field: keyof BillingItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? {
      ...item,
      [field]: value
    } : item));
  };
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };
  const handleAddItem = () => {
    setItems(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      description: '',
      unitPrice: 0
    }]);
  };
  const handleSubmit = async () => {
    // Clear previous API errors
    setApiError(null);
    setApiErrors([]);
    
    // Mark all fields as touched to show validation errors
    setTouched({
      companyName: true,
      contactNumber: true,
      address: true,
      attentionPerson: true,
      billingDate: true,
      clientEmail: true,
      discount: true
    });
    
    // Validate form before submission
    if (!isFormValid) {
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Prepare data for API
    // Filter out empty items (items without description)
    const validItems = items.filter(item => 
      item.description && item.description.trim() !== ''
    );
    
    const billingData = {
      billingDate,
      deliveryReceiptNumber: deliveryReceiptNumber || undefined,
      companyName,
      address,
      contactNumber,
      attentionPerson,
      clientEmail: clientEmail || undefined,
      items: validItems.map(item => ({
        ...item,
        lineTotal: item.quantity * item.unitPrice
      })),
      subtotal,
      discount,
      grandTotal
    };
    
    try {
      setIsSubmitting(true);
      
      // Call backend API to create billing
      const response = await BillingApiService.createBilling(billingData);
      
      if (response.success && response.data) {
        // Show pipeline status if available
        if (response.pipeline) {
          const { pdf, email } = response.pipeline;
          let pipelineMessage = 'Billing created successfully!';
          
          if (pdf === 'Generated') {
            pipelineMessage += ' PDF generated.';
          }
          if (email === 'Sent') {
            pipelineMessage += ' Email sent.';
          } else if (email === 'Failed') {
            pipelineMessage += ' (Email sending failed - you can resend later)';
          }
          
          // Show success message
          console.log('✅', pipelineMessage);
          if (response.warnings && Array.isArray(response.warnings) && response.warnings.length > 0) {
            console.warn('⚠️ Warnings:', response.warnings.join('; '));
          }
        }
        
        // Navigate to preview page with the returned billing data
        navigate(`/preview/${response.data.billingNumber}`, {
          state: {
            billingNumber: response.data.billingNumber,
            billingDate: response.data.billingDate,
            deliveryReceiptNumber: response.data.deliveryReceiptNumber,
            companyName: response.data.companyName,
            contactNumber: response.data.contactNumber,
            address: response.data.address,
            attentionPerson: response.data.attentionPerson,
            items: response.data.items,
            discount: response.data.discount,
            subtotal: response.data.subtotal,
            grandTotal: response.data.grandTotal,
            status: response.data.status,
            emailStatus: response.data.emailStatus,
            pipelineStatus: response.pipeline
          }
        });
      } else {
        setApiError('Failed to create billing. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (error: any) {
      console.error('Error submitting billing:', error);
      
        // Handle validation errors from API
        if (error.errors && Array.isArray(error.errors)) {
          setApiErrors(error.errors);
          setApiError(error.message);
        } else {
          setApiError('An unexpected error occurred. Please try again.');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsSubmitting(false);
      }
    };
    
  const handleSaveDraft = async () => {
    // Prepare draft data
    const validItems = items.filter(item => 
      item.description && item.description.trim() !== ''
    );
    
    const draftData = {
      _id: draftId || undefined,
      billingDate,
      deliveryReceiptNumber,
      companyName,
      contactNumber,
      address,
      attentionPerson,
      clientEmail,
      items: validItems.length > 0 ? validItems : items, // Save all items if none are filled
      discount,
      subtotal,
      grandTotal
    };
    
    try {
      await DraftApiService.saveDraft(draftData);
      
      // Navigate to drafts page
      navigate('/drafts');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };
  
  // Helper to mark field as touched
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Billing
            </h1>
            <p className="text-gray-600 mt-2">Fill in the details to generate a new billing document</p>
          </div>
        </div>
        
        {/* API Error Banner */}
        {(apiError || apiErrors.length > 0) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5 flex items-start gap-3 shadow-lg">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">
                {apiError || 'Failed to create billing. Please fix the following errors:'}
              </p>
              {apiErrors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  {apiErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {/* Validation Error Banner */}
        {!isFormValid && Object.keys(touched).length > 0 && !apiError && apiErrors.length === 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-5 flex items-start gap-3 shadow-lg">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">Please fix the following errors:</p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.companyName && <li>{errors.companyName}</li>}
                {errors.address && <li>{errors.address}</li>}
                {errors.attentionPerson && <li>{errors.attentionPerson}</li>}
                {errors.contactNumber && <li>{errors.contactNumber}</li>}
                {errors.clientEmail && <li>{errors.clientEmail}</li>}
                {errors.billingDate && <li>{errors.billingDate}</li>}
                {errors.items && <li>{errors.items}</li>}
                {errors.discount && <li>{errors.discount}</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Section 1: Billing Information */}
          <FormSection title="Billing Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Billing Number" 
                value={billingNumber} 
                disabled 
                className="bg-gray-100 text-gray-500" 
              />
              <Input 
                type="date" 
                label="Billing Date *" 
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                onBlur={() => handleBlur('billingDate')}
                error={touched.billingDate ? errors.billingDate : undefined}
              />
              <Input 
                label="Delivery Receipt Number (Optional)" 
                placeholder="e.g. DR-12345"
                value={deliveryReceiptNumber}
                onChange={(e) => setDeliveryReceiptNumber(e.target.value)}
              />
            </div>
          </FormSection>

          {/* Section 2: Billed To */}
          <FormSection title="Billed To">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Company Name *" 
                placeholder="Enter company name" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)}
                onBlur={() => handleBlur('companyName')}
                error={touched.companyName ? errors.companyName : undefined}
              />
              <Input 
                label="Contact Number *" 
                placeholder="e.g. +1 (555) 000-0000"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                onBlur={() => handleBlur('contactNumber')}
                error={touched.contactNumber ? errors.contactNumber : undefined}
              />
              <div className="md:col-span-2">
                <Textarea 
                  label="Address *" 
                  placeholder="Enter complete billing address" 
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onBlur={() => handleBlur('address')}
                  error={touched.address ? errors.address : undefined}
                />
              </div>
              <Input 
                label="Attention / Contact Person *" 
                placeholder="e.g. John Doe"
                value={attentionPerson}
                onChange={e => setAttentionPerson(e.target.value)}
                onBlur={() => handleBlur('attentionPerson')}
                error={touched.attentionPerson ? errors.attentionPerson : undefined}
              />
              <Input 
                label="Email Address *" 
                type="email"
                placeholder="e.g. client@example.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                onBlur={() => handleBlur('clientEmail')}
                error={touched.clientEmail ? errors.clientEmail : undefined}
              />
            </div>
          </FormSection>

          {/* Section 3: Itemized Billing */}
          <FormSection title="Itemized Billing">
            <div className="space-y-2">
              <ItemizedTable items={items} onUpdateItem={handleUpdateItem} onRemoveItem={handleRemoveItem} onAddItem={handleAddItem} />
              {errors.items && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium">{errors.items}</span>
                </div>
              )}
            </div>
          </FormSection>

          {/* Section 4: Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Discount (Optional):</label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={discount} 
                  onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  onBlur={() => handleBlur('discount')}
                  className="text-right h-9" 
                  placeholder="0.00"
                  error={touched.discount ? errors.discount : undefined}
                />
              </div>
              <BillingTotals items={items} discount={discount} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t-2 border-gray-200 p-4 z-40 shadow-2xl">
          <div className="container mx-auto max-w-5xl flex justify-end gap-4">
            <Button 
              variant="secondary"
              onClick={handleSaveDraft}
              className="bg-gradient-to-r from-gray-100 to-slate-100 hover:from-gray-200 hover:to-slate-200 text-gray-700 border border-gray-300 shadow-md"
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <div className="relative group">
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg ${(!isFormValid || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Billing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Billing & Send Email
                  </>
                )}
              </Button>
              {!isFormValid && !isSubmitting && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                  Please fix validation errors first
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>;
}