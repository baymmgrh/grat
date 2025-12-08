/**
 * Approval Workflow Helper
 * Utility functions to create approval workflows from transactions
 */

import axiosInstance from './axiosConfig';

export interface JournalLine {
  account_id: number;
  debit: number;
  credit: number;
  description: string;
}

export interface CreateWorkflowParams {
  transaction_type: string;
  transaction_id: number;
  transaction_number: string;
  journal_entry?: {
    entry_date: string;
    description: string;
    reference: string;
    lines: JournalLine[];
  };
}

/**
 * Create approval workflow for a transaction
 */
export const createApprovalWorkflow = async (params: CreateWorkflowParams) => {
  try {
    const response = await axiosInstance.post('/api/approval/workflows', params);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create approval workflow');
  }
};

/**
 * Submit workflow for review
 */
export const submitForReview = async (workflowId: number) => {
  try {
    const response = await axiosInstance.post(`/api/approval/workflows/${workflowId}/submit`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to submit for review');
  }
};

/**
 * Create workflow from Sales Order
 */
export const createSalesOrderWorkflow = async (
  salesOrderId: number,
  salesOrderNumber: string,
  totalAmount: number,
  customerName: string
) => {
  const journalLines: JournalLine[] = [
    {
      account_id: 1, // Accounts Receivable
      debit: totalAmount,
      credit: 0,
      description: `Sales to ${customerName}`
    },
    {
      account_id: 2, // Sales Revenue
      debit: 0,
      credit: totalAmount,
      description: `Sales to ${customerName}`
    }
  ];

  return createApprovalWorkflow({
    transaction_type: 'sales_order',
    transaction_id: salesOrderId,
    transaction_number: salesOrderNumber,
    journal_entry: {
      entry_date: new Date().toISOString().split('T')[0],
      description: `Sales Order ${salesOrderNumber}`,
      reference: salesOrderNumber,
      lines: journalLines
    }
  });
};

/**
 * Create workflow from Purchase Order
 */
export const createPurchaseOrderWorkflow = async (
  purchaseOrderId: number,
  purchaseOrderNumber: string,
  totalAmount: number,
  vendorName: string
) => {
  const journalLines: JournalLine[] = [
    {
      account_id: 3, // Inventory or Expense
      debit: totalAmount,
      credit: 0,
      description: `Purchase from ${vendorName}`
    },
    {
      account_id: 4, // Accounts Payable
      debit: 0,
      credit: totalAmount,
      description: `Purchase from ${vendorName}`
    }
  ];

  return createApprovalWorkflow({
    transaction_type: 'purchase_order',
    transaction_id: purchaseOrderId,
    transaction_number: purchaseOrderNumber,
    journal_entry: {
      entry_date: new Date().toISOString().split('T')[0],
      description: `Purchase Order ${purchaseOrderNumber}`,
      reference: purchaseOrderNumber,
      lines: journalLines
    }
  });
};

/**
 * Create workflow from Production
 */
export const createProductionWorkflow = async (
  productionId: number,
  productionNumber: string,
  productionCost: number,
  productName: string
) => {
  const journalLines: JournalLine[] = [
    {
      account_id: 5, // Work in Progress
      debit: productionCost,
      credit: 0,
      description: `Production of ${productName}`
    },
    {
      account_id: 6, // Raw Materials
      debit: 0,
      credit: productionCost,
      description: `Materials for ${productName}`
    }
  ];

  return createApprovalWorkflow({
    transaction_type: 'production',
    transaction_id: productionId,
    transaction_number: productionNumber,
    journal_entry: {
      entry_date: new Date().toISOString().split('T')[0],
      description: `Production ${productionNumber}`,
      reference: productionNumber,
      lines: journalLines
    }
  });
};

/**
 * Create workflow from Expense
 */
export const createExpenseWorkflow = async (
  expenseId: number,
  expenseNumber: string,
  amount: number,
  expenseCategory: string
) => {
  const journalLines: JournalLine[] = [
    {
      account_id: 7, // Expense Account
      debit: amount,
      credit: 0,
      description: `${expenseCategory} expense`
    },
    {
      account_id: 8, // Cash or Accounts Payable
      debit: 0,
      credit: amount,
      description: `Payment for ${expenseCategory}`
    }
  ];

  return createApprovalWorkflow({
    transaction_type: 'expense',
    transaction_id: expenseId,
    transaction_number: expenseNumber,
    journal_entry: {
      entry_date: new Date().toISOString().split('T')[0],
      description: `Expense ${expenseNumber}`,
      reference: expenseNumber,
      lines: journalLines
    }
  });
};

/**
 * Create workflow from Payment
 */
export const createPaymentWorkflow = async (
  paymentId: number,
  paymentNumber: string,
  amount: number,
  paymentFor: string
) => {
  const journalLines: JournalLine[] = [
    {
      account_id: 9, // Accounts Payable or Expense
      debit: amount,
      credit: 0,
      description: `Payment for ${paymentFor}`
    },
    {
      account_id: 10, // Cash/Bank
      debit: 0,
      credit: amount,
      description: `Payment ${paymentNumber}`
    }
  ];

  return createApprovalWorkflow({
    transaction_type: 'payment',
    transaction_id: paymentId,
    transaction_number: paymentNumber,
    journal_entry: {
      entry_date: new Date().toISOString().split('T')[0],
      description: `Payment ${paymentNumber}`,
      reference: paymentNumber,
      lines: journalLines
    }
  });
};

/**
 * Get workflow status badge color
 */
export const getWorkflowStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Check if user can review workflow
 */
export const canReviewWorkflow = (userRole: string): boolean => {
  return ['production_manager', 'warehouse_manager', 'admin'].includes(userRole);
};

/**
 * Check if user can approve workflow
 */
export const canApproveWorkflow = (userRole: string): boolean => {
  return ['finance', 'accounting', 'finance_manager', 'admin'].includes(userRole);
};
