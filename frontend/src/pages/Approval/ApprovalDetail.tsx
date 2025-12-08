import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface WorkflowDetail {
  id: number;
  transaction_type: string;
  transaction_number: string;
  status: string;
  current_step: string;
  submitted_by: string;
  submitted_at: string;
  reviewer: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  review_changes: any;
  approver: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  journal_entry_id: number | null;
}

interface HistoryItem {
  id: number;
  action: string;
  action_by: string;
  action_at: string;
  old_status: string;
  new_status: string;
  notes: string;
  changes: any;
}

interface JournalLine {
  account_id: number;
  account_name?: string;
  debit: number;
  credit: number;
  description: string;
}

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    loadWorkflowDetail();
    loadUserRole();
  }, [id]);

  const loadUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  };

  const loadWorkflowDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/approval/workflows/${id}`);
      setWorkflow(response.data.workflow);
      setHistory(response.data.history);
      
      if (response.data.pending_journal) {
        setJournalLines(response.data.pending_journal.lines || []);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast.error('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      const payload: any = {
        notes,
        changes: isEditing ? { edited: true } : null
      };

      if (isEditing) {
        payload.journal_changes = {
          lines: journalLines
        };
      }

      await axiosInstance.post(`/api/approval/workflows/${id}/review`, payload);
      toast.success('Workflow reviewed successfully');
      loadWorkflowDetail();
      setNotes('');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to review workflow');
    }
  };

  const handleApprove = async () => {
    try {
      await axiosInstance.post(`/api/approval/workflows/${id}/approve`, {
        notes
      });
      toast.success('Workflow approved and journal entry created');
      navigate('/app/approval');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve workflow');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      await axiosInstance.post(`/api/approval/workflows/${id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Workflow rejected');
      navigate('/app/approval');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject workflow');
    }
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    const updated = [...journalLines];
    updated[index] = { ...updated[index], [field]: value };
    setJournalLines(updated);
  };

  const canReview = () => {
    return workflow?.status === 'pending_review' && 
           ['production_manager', 'warehouse_manager', 'admin'].includes(userRole);
  };

  const canApprove = () => {
    return workflow?.status === 'pending_approval' && 
           ['finance', 'accounting', 'finance_manager', 'admin'].includes(userRole);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workflow) {
    return <div className="text-center py-12">Workflow not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Approval Workflow Detail
          </h1>
          <p className="text-gray-600">{workflow.transaction_number}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          workflow.status === 'approved' ? 'bg-green-100 text-green-800' :
          workflow.status === 'rejected' ? 'bg-red-100 text-red-800' :
          workflow.status === 'pending_approval' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {workflow.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Workflow Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Transaction Type</p>
                <p className="font-medium">{workflow.transaction_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction Number</p>
                <p className="font-medium">{workflow.transaction_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted By</p>
                <p className="font-medium">{workflow.submitted_by}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted At</p>
                <p className="font-medium">
                  {new Date(workflow.submitted_at).toLocaleString()}
                </p>
              </div>
              {workflow.reviewer && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Reviewed By</p>
                    <p className="font-medium">{workflow.reviewer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reviewed At</p>
                    <p className="font-medium">
                      {workflow.reviewed_at ? new Date(workflow.reviewed_at).toLocaleString() : '-'}
                    </p>
                  </div>
                </>
              )}
              {workflow.approver && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Approved By</p>
                    <p className="font-medium">{workflow.approver}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approved At</p>
                    <p className="font-medium">
                      {workflow.approved_at ? new Date(workflow.approved_at).toLocaleString() : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Journal Entry */}
          {journalLines.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Journal Entry</h2>
                {canReview() && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Account
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {journalLines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">
                          {line.account_name || `Account ${line.account_id}`}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {isEditing ? (
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            line.description
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={line.debit}
                              onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-right"
                            />
                          ) : (
                            line.debit.toLocaleString()
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={line.credit}
                              onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-right"
                            />
                          ) : (
                            line.credit.toLocaleString()
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-sm text-right">Total:</td>
                      <td className="px-4 py-2 text-sm text-right">
                        {journalLines.reduce((sum, line) => sum + line.debit, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {journalLines.reduce((sum, line) => sum + line.credit, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(canReview() || canApprove()) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                {canReview() ? 'Review Workflow' : 'Approve Workflow'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your notes here..."
                  />
                </div>

                <div className="flex space-x-4">
                  {canReview() && (
                    <button
                      onClick={handleReview}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Submit for Approval</span>
                    </button>
                  )}
                  
                  {canApprove() && (
                    <button
                      onClick={handleApprove}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approve & Create Journal Entry</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) {
                        setRejectionReason(reason);
                        handleReject();
                      }
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - History */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Workflow History</h2>
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.action.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">
                        by {item.action_by}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.action_at).toLocaleString()}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-700 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
