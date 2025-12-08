import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Template {
  id: number;
  template_name: string;
  template_code: string;
  document_type: string;
}

export default function DocumentGenerator() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axiosInstance.get('/api/documents/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      setLoading(true);
      
      // For now, just show message
      toast.success('Manual document generation coming soon!');
      toast('Use auto-generate from Sales Order or Work Order', { icon: '💡' });
      
      setTimeout(() => {
        navigate('/app/documents');
      }, 2000);
      
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/documents')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Document</h1>
            <p className="text-gray-600">Create new document from template</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-1 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900">Quick Tip</h3>
            <p className="text-blue-700 text-sm mt-1">
              For faster document generation, use the auto-generate button directly from:
            </p>
            <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
              <li><strong>Sales Order</strong> → Generate Surat Jalan</li>
              <li><strong>Work Order</strong> → Generate SPK</li>
              <li><strong>Purchase Order</strong> → Generate PO Document</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Select Template</h2>
        
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No templates available</p>
            <p className="text-sm text-gray-400 mt-2">
              Templates will be created automatically when you use auto-generate
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                  {selectedTemplate === template.id && (
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.document_type}</p>
                <p className="text-xs text-gray-400 mt-2">Code: {template.template_code}</p>
              </div>
            ))}
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={!selectedTemplate || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
