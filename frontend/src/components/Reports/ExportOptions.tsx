import React, { useState } from 'react';
import {
  ChartBarIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
interface ExportOptionsProps {
  reportType: string;
  reportData?: any;
  reportConfig?: any;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
}

interface ExportSettings {
  format: string;
  includeCharts: boolean;
  includeRawData: boolean;
  pageOrientation: string;
  paperSize: string;
  emailRecipients: string;
  fileName: string;
  compression: boolean;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  reportType,
  reportData,
  reportConfig,
  onExportStart,
  onExportComplete
}) => {
  const { t } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: true,
    pageOrientation: 'portrait',
    paperSize: 'a4',
    emailRecipients: '',
    fileName: `${reportType}_report_${new Date().toISOString().split('T')[0]}`,
    compression: false
  });

  const exportFormats = [
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: DocumentTextIcon,
      description: 'Portable Document Format - Best for sharing and printing'
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      icon: TableCellsIcon,
      description: 'Microsoft Excel format - Best for data analysis'
    },
    {
      value: 'csv',
      label: 'CSV File',
      icon: TableCellsIcon,
      description: 'Comma-separated values - Best for data import/export'
    },
    {
      value: 'html',
      label: 'HTML Report',
      icon: ChartBarIcon,
      description: 'Web format - Best for online viewing'
    },
    {
      value: 'json',
      label: 'JSON Data',
      icon: Cog6ToothIcon,
      description: 'JavaScript Object Notation - Best for API integration'
    }
  ];

  const paperSizes = [
    { value: 'a4', label: 'A4 (210 × 297 mm)' },
    { value: 'letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'legal', label: 'Legal (8.5 × 14 in)' },
    { value: 'a3', label: 'A3 (297 × 420 mm)' }
  ];

  // Quick export without modal
  const quickExport = async (format: string) => {
    try {
      setExporting(true);
      onExportStart?.();

      const exportData = {
        report_type: reportType,
        format: format,
        data: reportData,
        config: reportConfig,
        settings: {
          ...exportSettings,
          format: format
        }
      };

      const response = await axiosInstance.post('/api/reports/export', exportData, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const extension = format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : format === 'html' ? 'html' : format === 'json' ? 'json' : 'pdf';
      link.setAttribute('download', `${exportSettings.fileName}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onExportComplete?.(true);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
      onExportComplete?.(false);
    } finally {
      setExporting(false);
    }
  };

  // Advanced export with modal
  const advancedExport = async () => {
    try {
      setExporting(true);
      onExportStart?.();

      const exportData = {
        report_type: reportType,
        data: reportData,
        config: reportConfig,
        settings: exportSettings
      };

      // If email recipients are provided, send via email
      if (exportSettings.emailRecipients.trim()) {
        await axiosInstance.post('/api/reports/export/email', {
          ...exportData,
          recipients: exportSettings.emailRecipients.split(',').map(email => email.trim())
        });
        
        alert('Report has been sent to the specified email addresses.');
      } else {
        // Direct download
        const response = await axiosInstance.post('/api/reports/export', exportData, {
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        const extension = exportSettings.format === 'excel' ? 'xlsx' : 
                         exportSettings.format === 'csv' ? 'csv' : 
                         exportSettings.format === 'html' ? 'html' : 
                         exportSettings.format === 'json' ? 'json' : 'pdf';
        
        link.setAttribute('download', `${exportSettings.fileName}.${extension}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      setShowModal(false);
      onExportComplete?.(true);
    } catch (error) {
      console.error('Advanced export failed:', error);
      alert('Export failed. Please try again.');
      onExportComplete?.(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Quick Export Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => quickExport('pdf')}
          disabled={exporting}
          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          title="Export as PDF"
        >
          <DocumentTextIcon className="h-4 w-4 mr-1" />
        </button>
        
        <button
          onClick={() => quickExport('excel')}
          disabled={exporting}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          title="Export as Excel"
        >
          <TableCellsIcon className="h-4 w-4 mr-1" />
        </button>
        
        <button
          onClick={() => quickExport('csv')}
          disabled={exporting}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          title="Export as CSV"
        >
          <TableCellsIcon className="h-4 w-4 mr-1" />
        </button>
        
        <button
          onClick={() => setShowModal(true)}
          disabled={exporting}
          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          title="Advanced Export Options"
        >
          <Cog6ToothIcon className="h-4 w-4 mr-1" />
          More Options
        </button>
      </div>

      {/* Advanced Export Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Advanced Export Options</h3>
              
              <div className="space-y-6">
                
                {/* Export Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportFormats.map((format) => (
                      <label key={format.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={exportSettings.format === format.value}
                          onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <format.icon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{format.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{format.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* File Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                    <input
                      type="text"
                      value={exportSettings.fileName}
                      onChange={(e) => setExportSettings({...exportSettings, fileName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  {exportSettings.format === 'pdf' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Page Orientation</label>
                        <select
                          value={exportSettings.pageOrientation}
                          onChange={(e) => setExportSettings({...exportSettings, pageOrientation: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                        <select
                          value={exportSettings.paperSize}
                          onChange={(e) => setExportSettings({...exportSettings, paperSize: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          {paperSizes.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Content Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Content Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportSettings.includeCharts}
                        onChange={(e) => setExportSettings({...exportSettings, includeCharts: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Include charts and visualizations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportSettings.includeRawData}
                        onChange={(e) => setExportSettings({...exportSettings, includeRawData: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Include raw data tables</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportSettings.compression}
                        onChange={(e) => setExportSettings({...exportSettings, compression: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enable compression (smaller file size)</span>
                    </label>
                  </div>
                </div>

                {/* Email Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Recipients (optional)
                  </label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={exportSettings.emailRecipients}
                      onChange={(e) => setExportSettings({...exportSettings, emailRecipients: e.target.value})}
                      placeholder="email1@company.com, email2@company.com"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to download directly. Separate multiple emails with commas.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >{t('common.cancel')}</button>
                <button
                  onClick={advancedExport}
                  disabled={exporting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : (exportSettings.emailRecipients ? 'Send via Email' : t('common.export'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportOptions;
