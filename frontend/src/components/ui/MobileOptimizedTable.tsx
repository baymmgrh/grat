import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobile?: boolean; // Show on mobile
  priority?: 'high' | 'medium' | 'low'; // Priority for responsive display
}

interface MobileOptimizedTableProps {
  columns: Column[];
  data: any[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const MobileOptimizedTable: React.FC<MobileOptimizedTableProps> = ({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const { t } = useLanguage();

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getPriorityColumns = (priority: 'high' | 'medium' | 'low') => {
    return columns.filter(col => col.priority === priority);
  };

  const highPriorityColumns = getPriorityColumns('high');
  const mediumPriorityColumns = getPriorityColumns('medium');
  const lowPriorityColumns = getPriorityColumns('low');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {data.map((row, index) => {
          const isExpanded = expandedRows.has(index);
          
          return (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              {/* Main Card Content */}
              <div className="p-4">
                {/* High Priority Fields - Always Visible */}
                <div className="space-y-2">
                  {highPriorityColumns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                      <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Medium Priority Fields - Tablet Visible */}
                {mediumPriorityColumns.length > 0 && (
                  <div className="hidden sm:block lg:hidden mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {mediumPriorityColumns.map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand Button & Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {(onView || onEdit || onDelete) && (
                      <>
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {lowPriorityColumns.length > 0 && (
                    <button
                      onClick={() => toggleRow(index)}
                      className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? 'Less' : 'More'}
                      {isExpanded ? (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Content - Low Priority Fields */}
                {isExpanded && lowPriorityColumns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {lowPriorityColumns.map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileOptimizedTable;
