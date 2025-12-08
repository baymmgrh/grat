import { useState } from 'react';
import { DocumentTextIcon, PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface DocumentGenerateButtonProps {
  transactionType: 'sales_order' | 'work_order' | 'purchase_order';
  transactionId: number;
  transactionNumber: string;
  label?: string;
}

export default function DocumentGenerateButton({
  transactionType,
  transactionId,
  transactionNumber,
  label
}: DocumentGenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<number | null>(null);

  const getDocumentType = () => {
    switch (transactionType) {
      case 'sales_order':
        return { type: 'Surat Jalan', endpoint: 'generate-from-sales-order' };
      case 'work_order':
        return { type: 'SPK', endpoint: 'generate-from-work-order' };
      case 'purchase_order':
        return { type: 'Purchase Order', endpoint: 'generate-from-purchase-order' };
      default:
        return { type: 'Document', endpoint: 'generate' };
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const { type, endpoint } = getDocumentType();
      
      const response = await axiosInstance.post(
        `/api/documents/${endpoint}/${transactionId}`
      );
      
      setGeneratedDocId(response.data.document_id);
      toast.success(`${type} berhasil dibuat: ${response.data.document_number}`);
      
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.response?.data?.error || 'Gagal membuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!generatedDocId) return;
    
    try {
      const res = await axiosInstance.get(`/api/documents/${generatedDocId}/preview`);
      const htmlContent = res.data.document.html_content;
      
      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Gagal preview dokumen');
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedDocId) return;
    
    try {
      const response = await axiosInstance.get(
        `/api/documents/${generatedDocId}/pdf`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${transactionNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF berhasil didownload');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal download PDF');
    }
  };

  const handleDownloadExcel = async () => {
    if (!generatedDocId) return;
    
    try {
      const response = await axiosInstance.get(
        `/api/documents/${generatedDocId}/excel`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${transactionNumber}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel berhasil didownload');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Gagal download Excel');
    }
  };

  const { type } = getDocumentType();

  return (
    <div className="flex items-center space-x-2">
      {!generatedDocId ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          {loading ? 'Generating...' : label || `Generate ${type}`}
        </button>
      ) : (
        <>
          <button
            onClick={handlePreview}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title="Preview"
          >
            <EyeIcon className="h-5 w-5 mr-1" />
            Preview
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            title="Download PDF"
          >
            <PrinterIcon className="h-5 w-5 mr-1" />
            PDF
          </button>
          
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            title="Download Excel"
          >
            <DocumentTextIcon className="h-5 w-5 mr-1" />
            Excel
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Generate New"
          >
            <DocumentTextIcon className="h-5 w-5 mr-1" />
            New
          </button>
        </>
      )}
    </div>
  );
}
