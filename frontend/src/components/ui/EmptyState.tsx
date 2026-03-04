import React from 'react';
import {
  InboxIcon,
  DocumentIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

type EmptyStateType = 
  | 'default'
  | 'search'
  | 'filter'
  | 'error'
  | 'products'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'production'
  | 'delivery'
  | 'reports';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

const iconMap: Record<EmptyStateType, React.ComponentType<{ className?: string }>> = {
  default: InboxIcon,
  search: MagnifyingGlassIcon,
  filter: FolderIcon,
  error: ExclamationTriangleIcon,
  products: CubeIcon,
  orders: ShoppingCartIcon,
  customers: UsersIcon,
  inventory: ClipboardDocumentListIcon,
  production: WrenchScrewdriverIcon,
  delivery: TruckIcon,
  reports: ChartBarIcon,
};

const defaultMessages: Record<EmptyStateType, { title: string; description: string }> = {
  default: {
    title: 'Tidak ada data',
    description: 'Belum ada data yang tersedia saat ini.'
  },
  search: {
    title: 'Tidak ditemukan',
    description: 'Tidak ada hasil yang cocok dengan pencarian Anda. Coba kata kunci lain.'
  },
  filter: {
    title: 'Tidak ada hasil',
    description: 'Tidak ada data yang sesuai dengan filter yang dipilih.'
  },
  error: {
    title: 'Terjadi kesalahan',
    description: 'Gagal memuat data. Silakan coba lagi.'
  },
  products: {
    title: 'Belum ada produk',
    description: 'Mulai dengan menambahkan produk pertama Anda.'
  },
  orders: {
    title: 'Belum ada pesanan',
    description: 'Pesanan akan muncul di sini setelah dibuat.'
  },
  customers: {
    title: 'Belum ada pelanggan',
    description: 'Tambahkan pelanggan untuk memulai.'
  },
  inventory: {
    title: 'Inventori kosong',
    description: 'Belum ada item dalam inventori.'
  },
  production: {
    title: 'Tidak ada work order',
    description: 'Buat work order untuk memulai produksi.'
  },
  delivery: {
    title: 'Tidak ada pengiriman',
    description: 'Belum ada pengiriman yang dijadwalkan.'
  },
  reports: {
    title: 'Tidak ada laporan',
    description: 'Laporan akan tersedia setelah ada data.'
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  description,
  action,
  icon,
  className = ''
}) => {
  const IconComponent = iconMap[type];
  const defaultMessage = defaultMessages[type];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon || <IconComponent className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {title || defaultMessage.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
        {description || defaultMessage.description}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Compact version for tables
export const EmptyTableState: React.FC<EmptyStateProps> = (props) => (
  <tr>
    <td colSpan={100} className="py-8">
      <EmptyState {...props} className="py-6" />
    </td>
  </tr>
);

// Inline version for cards
export const EmptyCardState: React.FC<EmptyStateProps> = (props) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
    <EmptyState {...props} />
  </div>
);

export default EmptyState;
