import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Eye,
  ChevronRight, User, Calendar
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

interface Approval {
  id: number;
  project_id: number;
  stage: string;
  from_stage: string | null;
  to_stage: string | null;
  status: string;
  approver_name: string | null;
  approved_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  requested_by_name: string | null;
  requested_at: string;
}

const stageLabels: Record<string, string> = {
  'LAB_SCALE': 'Lab Scale',
  'PILOT_SCALE': 'Pilot Scale',
  'VALIDATION': 'Validation',
  'COMPLETION': 'Selesai'
};

const RNDApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/rnd/approvals/pending');
      setApprovals(response.data.approvals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui permintaan ini?')) return;

    try {
      setProcessingId(id);
      await axiosInstance.post(`/api/rnd/approvals/${id}/approve`, { notes: '' });
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menyetujui');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;

    try {
      setProcessingId(selectedApproval.id);
      await axiosInstance.post(`/api/rnd/approvals/${selectedApproval.id}/reject`, {
        rejection_reason: rejectReason
      });
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectReason('');
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menolak');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (approval: Approval) => {
    setSelectedApproval(approval);
    setRejectReason('');
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Pending</h1>
        <p className="text-gray-500">Permintaan persetujuan tahap proyek R&D</p>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada permintaan pending</h3>
          <p className="text-gray-500">Semua permintaan approval telah diproses</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Pending Approval
                    </span>
                    <Link
                      to={`/app/rnd/projects/${approval.project_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Lihat Proyek
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {stageLabels[approval.from_stage || ''] || approval.from_stage}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {stageLabels[approval.to_stage || ''] || approval.to_stage}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Diminta oleh: {approval.requested_by_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(approval.requested_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>

                  {approval.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Catatan:</span> {approval.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processingId === approval.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={() => openRejectModal(approval)}
                    disabled={processingId === approval.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tolak Permintaan</h3>
            <p className="text-gray-600 mb-4">
              Berikan alasan penolakan untuk permintaan ini.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApproval(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === selectedApproval.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RNDApprovals;
