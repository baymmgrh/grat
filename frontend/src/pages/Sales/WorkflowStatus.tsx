import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowRightIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
interface WorkflowStep {
  step_name: string;
  step_order: number;
  status: string;
  completed_at?: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  status: string;
  product_name: string;
  quantity_to_produce: number;
  actual_quantity?: number;
}

interface QualityInspection {
  id: number;
  inspection_number: string;
  status: string;
  inspection_date?: string;
}

interface ShippingOrder {
  id: number;
  shipping_number: string;
  status: string;
  tracking_number?: string;
  shipping_date?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  total_amount: number;
  invoice_date?: string;
}

interface WorkflowData {
  sales_order: {
    id: number;
    order_number: string;
    status: string;
    customer_name: string;
  };
  workflow_steps: WorkflowStep[];
  work_orders: WorkOrder[];
  quality_inspections: QualityInspection[];
  shipping_orders: ShippingOrder[];
  invoices: Invoice[];
}

const WorkflowStatus: React.FC = () => {
  const { t } = useLanguage();

  const { id } = useParams<{ id: string }>();
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflowStatus();
  }, [id]);

  const fetchWorkflowStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/workflow-complete/status/${id}`);
      setWorkflowData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch workflow status');
    } finally {
      setLoading(false);
    }
  };

  const confirmSalesOrder = async () => {
    try {
      await axiosInstance.post(`/api/workflow-complete/sales-order/${id}/confirm`);
      alert('Sales order confirmed successfully!');
      fetchWorkflowStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to confirm sales order');
    }
  };

  const triggerCompleteWorkflow = async () => {
    try {
      await axiosInstance.post(`/api/workflow-complete/sales-order/${id}/trigger-complete`);
      alert('Workflow triggered successfully!');
      fetchWorkflowStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to trigger workflow');
    }
  };

  const completeProduction = async (workOrderId: number) => {
    try {
      const actualQuantity = prompt('Enter actual quantity produced:');
      if (actualQuantity) {
        await axiosInstance.post(`/api/workflow-complete/production/${workOrderId}/complete`, {
          actual_quantity: parseFloat(actualQuantity)
        });
        alert('Production completed successfully!');
        fetchWorkflowStatus();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to complete production');
    }
  };

  const approveQuality = async (inspectionId: number) => {
    try {
      const approved = confirm('Approve this quality inspection?');
      const notes = prompt('Enter inspection notes (optional):') || '';
      
      await axiosInstance.post(`/api/workflow-complete/quality/${inspectionId}/approve`, {
        approved,
        notes
      });
      alert('Quality inspection updated successfully!');
      fetchWorkflowStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update quality inspection');
    }
  };

  const shipOrder = async (shippingId: number) => {
    try {
      const trackingNumber = prompt('Enter tracking number:') || '';
      const carrier = prompt('Enter carrier name:') || '';
      
      await axiosInstance.post(`/api/workflow-complete/shipping/${shippingId}/ship`, {
        tracking_number: trackingNumber,
        carrier
      });
      alert('Order shipped successfully!');
      fetchWorkflowStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to ship order');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName.toLowerCase()) {
      case 'production planning':
        return <CogIcon className="h-8 w-8" />;
      case 'quality control':
        return <BeakerIcon className="h-8 w-8" />;
      case 'shipping preparation':
        return <TruckIcon className="h-8 w-8" />;
      case 'invoice generated':
        return <DocumentTextIcon className="h-8 w-8" />;
      default:
        return <ClockIcon className="h-8 w-8" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading workflow status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Workflow</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!workflowData) {
    return <div>No workflow data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Workflow Status: {workflowData.sales_order.order_number}
            </h1>
            <p className="text-gray-600">Customer: {workflowData.sales_order.customer_name}</p>
            <p className="text-sm text-gray-500">Status: 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                workflowData.sales_order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                workflowData.sales_order.status === 'in_production' ? 'bg-yellow-100 text-yellow-800' :
                workflowData.sales_order.status === 'ready' ? 'bg-green-100 text-green-800' :
                workflowData.sales_order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workflowData.sales_order.status}
              </span>
            </p>
          </div>
          {workflowData.sales_order.status === 'draft' && (
            <button
              onClick={confirmSalesOrder}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Confirm Sales Order
            </button>
          )}
          {workflowData.sales_order.status === 'confirmed' && (
            <button
              onClick={triggerCompleteWorkflow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Trigger Complete Workflow
            </button>
          )}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Workflow Progress</h2>
        <div className="flex items-center space-x-4 overflow-x-auto pb-4">
          {workflowData.workflow_steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex flex-col items-center p-4 rounded-lg min-w-[200px] ${
                step.status === 'completed' ? 'bg-green-50 border-2 border-green-200' :
                step.status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-200' :
                'bg-gray-50 border-2 border-gray-200'
              }`}>
                <div className={`p-2 rounded-full ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getStepIcon(step.step_name)}
                </div>
                <h3 className="font-medium text-sm text-center mt-2">{step.step_name}</h3>
                <p className="text-xs text-gray-500 text-center">
                  {step.status === 'completed' && step.completed_at ? 
                    new Date(step.completed_at).toLocaleDateString() : 
                    step.status
                  }
                </p>
                {getStatusIcon(step.status)}
              </div>
              {index < workflowData.workflow_steps.length - 1 && (
                <ArrowRightIcon className="h-6 w-6 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Orders */}
      {workflowData.work_orders.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Production Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowData.work_orders.map((wo) => (
              <div key={wo.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{wo.wo_number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                    wo.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                    wo.status === 'quality_approved' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {wo.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{wo.product_name}</p>
                <p className="text-sm text-gray-500">
                  Quantity: {wo.quantity_to_produce}
                  {wo.actual_quantity && ` / Actual: ${wo.actual_quantity}`}
                </p>
                {wo.status === 'planned' && (
                  <button
                    onClick={() => completeProduction(wo.id)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Complete Production
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Inspections */}
      {workflowData.quality_inspections.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quality Inspections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowData.quality_inspections.map((qi) => (
              <div key={qi.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{qi.inspection_number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    qi.status === 'passed' ? 'bg-green-100 text-green-800' :
                    qi.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {qi.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {qi.inspection_date ? 
                    `Inspected: ${new Date(qi.inspection_date).toLocaleDateString()}` :
                    'Pending inspection'
                  }
                </p>
                {qi.status === 'pending' && (
                  <button
                    onClick={() => approveQuality(qi.id)}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Inspect Quality
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Orders */}
      {workflowData.shipping_orders.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowData.shipping_orders.map((so) => (
              <div key={so.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{so.shipping_number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    so.status === 'shipped' ? 'bg-green-100 text-green-800' :
                    so.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {so.status}
                  </span>
                </div>
                {so.tracking_number && (
                  <p className="text-sm text-gray-600 mb-1">Tracking: {so.tracking_number}</p>
                )}
                <p className="text-sm text-gray-500">
                  {so.shipping_date ? 
                    `Shipped: ${new Date(so.shipping_date).toLocaleDateString()}` :
                    'Not shipped yet'
                  }
                </p>
                {so.status === 'preparing' && (
                  <button
                    onClick={() => shipOrder(so.id)}
                    className="mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    Ship Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {workflowData.invoices.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invoices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowData.invoices.map((inv) => (
              <div key={inv.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{inv.invoice_number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Amount: Rp {inv.total_amount.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-500">
                  {inv.invoice_date ? 
                    `Date: ${new Date(inv.invoice_date).toLocaleDateString()}` :
                    'No date'
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatus;
