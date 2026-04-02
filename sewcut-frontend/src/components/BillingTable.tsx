import React, { useState, useMemo } from 'react';
import { Eye, Download, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { StatusBadge, BillingStatus } from './StatusBadge';

interface BillingTableProps {
  billings: any[];
}

export function BillingTable({ billings }: BillingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Transform MongoDB data to table format
  const tableData = useMemo(() => {
    return billings.map(billing => ({
      id: billing._id,
      billingNumber: billing.billingNumber,
      companyName: billing.companyName,
      date: billing.billingDate,
      amount: billing.grandTotal,
      status: billing.status as BillingStatus
    }));
  }, [billings]);

  const handleDownloadPdf = async (billingNumber: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/billings/${billingNumber}/download-pdf`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to download PDF');
        return;
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${billingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const filteredData = tableData.filter(record => {
    const matchesSearch = record.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || record.billingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search billings..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Generated">Generated</option>
          <option value="Emailed">Emailed</option>
        </Select>
        </div>
      </div>

      <div className="neu-surface-soft rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="neu-inset text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-3">Billing Number</th>
                <th className="px-6 py-3">Company Name</th>
                <th className="px-6 py-3">Billing Date</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {filteredData.length > 0 ? filteredData.map(record => <tr key={record.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {record.billingNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/preview/${record.billingNumber}`}>
                          <Button variant="ghost" size="icon" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Download PDF"
                          onClick={() => handleDownloadPdf(record.billingNumber)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>) : <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {billings.length === 0 
                      ? 'No billings yet. Create your first billing to get started!'
                      : 'No billings found matching your criteria.'}
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
}
