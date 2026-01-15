import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
export interface BillingItem {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
}
interface ItemizedTableProps {
  items: BillingItem[];
  onUpdateItem: (id: string, field: keyof BillingItem, value: any) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
}
export function ItemizedTable({
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem
}: ItemizedTableProps) {
  // Handle quantity change with validation to prevent negative values
  const handleQuantityChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    // Ensure quantity is at least 1
    const validatedValue = Math.max(1, numValue);
    onUpdateItem(id, 'quantity', validatedValue);
  };

  // Handle unit price change with validation to prevent negative values
  const handleUnitPriceChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    // Ensure unit price is non-negative
    const validatedValue = Math.max(0, numValue);
    onUpdateItem(id, 'unitPrice', validatedValue);
  };

  // Calculate line total for an item
  const calculateLineTotal = (item: BillingItem): number => {
    return item.quantity * item.unitPrice;
  };

  // Format currency as Philippine Peso
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-24">Quantity</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 w-32">Unit Price</th>
              <th className="px-4 py-3 w-32">Line Total</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map(item => <tr key={item.id}>
                <td className="p-2">
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={e => handleQuantityChange(item.id, e.target.value)} 
                    className="text-center" 
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="text" 
                    placeholder="Item description" 
                    value={item.description} 
                    onChange={e => onUpdateItem(item.id, 'description', e.target.value)} 
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={item.unitPrice} 
                    onChange={e => handleUnitPriceChange(item.id, e.target.value)} 
                    className="text-right" 
                  />
                </td>
                <td className="p-2">
                  <div className="flex h-10 w-full items-center justify-end rounded-md bg-gray-50 px-3 text-gray-700 font-medium border border-gray-200">
                    {formatCurrency(calculateLineTotal(item))}
                  </div>
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={() => onRemoveItem(item.id)} 
                    className="text-gray-400 hover:text-red-500 transition-colors p-2" 
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <Button 
        type="button" 
        variant="ghost" 
        onClick={onAddItem} 
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Row
      </Button>
    </div>;
}