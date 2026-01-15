import { Card, CardContent } from './ui/Card';
import { LucideIcon } from 'lucide-react';
interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}
export function SummaryCard({
  label,
  value,
  icon: Icon
}: SummaryCardProps) {
  return <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && <div className="rounded-full bg-blue-50 p-3">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>}
      </CardContent>
    </Card>;
}