import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ExclamationTriangleIcon as AlertTriangle,
  CalendarIcon as Calendar,
  CheckIcon as Save,
  ClockIcon,
  BuildingOffice2Icon as Factory,
  WrenchIcon as Wrench
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';

// Simple UI Components (replacing shadcn/ui)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${props.className || ''}`} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button {...props} className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);

const Alert: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 rounded-md border ${className}`}>{children}</div>
);

const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm ${className}`}>{children}</p>
);


interface Machine {
  id: number;
  code: string;
  name: string;
  machine_type: string;
}

interface ShiftProduction {
  id: number;
  production_date: string;
  shift: string;
  machine: {
    id: number;
    code: string;
    name: string;
  };
  product: {
    id: number;
    code: string;
    name: string;
  };
}

interface DowntimeForm {
  shift_production_id: string;
  machine_id: string;
  start_time: string;
  end_time: string;
  downtime_type: string;
  downtime_category: string;
  downtime_reason: string;
  root_cause: string;
  production_loss: string;
  cost_impact: string;
  action_taken: string;
  prevention_action: string;
  priority: string;
}

const DowntimeInput: React.FC = () => {
  const { t } = useLanguage();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [shiftProductions, setShiftProductions] = useState<ShiftProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<DowntimeForm>({
    shift_production_id: '',
    machine_id: '',
    start_time: '',
    end_time: '',
    downtime_type: '',
    downtime_category: '',
    downtime_reason: '',
    root_cause: '',
    production_loss: '0',
    cost_impact: '0',
    action_taken: '',
    prevention_action: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchMasterData();
    fetchTodayShiftProductions();
  }, []);

  const fetchMasterData = async () => {
    try {
      const machinesRes = await axiosInstance.get('/production-input/machines/active');
      setMachines(machinesRes.data.machines || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchTodayShiftProductions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axiosInstance.get(`/production-input/shift-productions?date=${today}`);
      setShiftProductions(response.data.shift_productions || []);
    } catch (error) {
      console.error('Error fetching shift productions:', error);
    }
  };

  const handleInputChange = (field: keyof DowntimeForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-set machine_id when shift_production_id changes
    if (field === 'shift_production_id') {
      const selectedShift = shiftProductions.find(sp => sp.id === parseInt(value));
      if (selectedShift) {
        setFormData(prev => ({
          ...prev,
          machine_id: selectedShift.machine.id.toString()
        }));
      }
    }
  };

  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? diffMinutes : 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        shift_production_id: parseInt(formData.shift_production_id),
        machine_id: parseInt(formData.machine_id),
        production_loss: parseFloat(formData.production_loss),
        cost_impact: parseFloat(formData.cost_impact)
      };

      await axiosInstance.post('/production-input/downtime-records', payload);
      
      setMessage({ type: 'success', text: 'Data downtime berhasil disimpan!' });
      
      // Reset form
      setFormData({
        shift_production_id: '',
        machine_id: '',
        start_time: '',
        end_time: '',
        downtime_type: '',
        downtime_category: '',
        downtime_reason: '',
        root_cause: '',
        production_loss: '0',
        cost_impact: '0',
        action_taken: '',
        prevention_action: '',
        priority: 'medium'
      });
    } catch (error: any) {
      console.error('Error saving downtime data:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Gagal menyimpan data downtime' 
      });
    } finally {
      setLoading(false);
    }
  };

  const downtimeCategories = {
    planned: [
      { value: 'maintenance', label: t('navigation.maintenance') },
      { value: 'setup', label: 'Setup/Changeover' },
      { value: 'operator_break', label: 'Operator Break' }
    ],
    unplanned: [
      { value: 'breakdown', label: 'Breakdown' },
      { value: 'material_shortage', label: 'Material Shortage' },
      { value: 'quality_issue', label: 'Quality Issue' },
      { value: 'power_failure', label: 'Power Failure' },
      { value: 'tool_change', label: 'Tool Change' },
      { value: 'bak_packaging', label: 'Bak Packaging' },
      { value: 'stiker', label: 'Stiker' },
      { value: 'stiker_putus', label: 'Stiker Putus' },
      { value: 'cartridge', label: 'Cartridge' }
    ]
  };

  const selectedShiftProduction = shiftProductions.find(sp => sp.id === parseInt(formData.shift_production_id));
  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Downtime Mesin</h1>
          <p className="text-gray-600">Catat downtime mesin dengan kategorisasi dan analisis dampak</p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shift_production_id">Shift Produksi</Label>
                <select
                  id="shift_production_id"
                  value={formData.shift_production_id}
                  onChange={(e) => handleInputChange('shift_production_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Shift Produksi</option>
                  {shiftProductions.map((sp) => (
                    <option key={sp.id} value={sp.id.toString()}>
                      {sp.production_date} - {sp.shift} - {sp.machine.name} ({sp.product.name})
                    </option>
                  ))}
                </select>
              </div>

              {selectedShiftProduction && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Mesin:</strong> {selectedShiftProduction.machine.code} - {selectedShiftProduction.machine.name}</p>
                  <p className="text-sm"><strong>Produk:</strong> {selectedShiftProduction.product.code} - {selectedShiftProduction.product.name}</p>
                  <p className="text-sm"><strong>Shift:</strong> {selectedShiftProduction.shift}</p>
                </div>
              )}

              <div>
                <Label htmlFor="downtime_type">Tipe Downtime</Label>
                <select
                  id="downtime_type"
                  value={formData.downtime_type}
                  onChange={(e) => handleInputChange('downtime_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Tipe</option>
                  <option value="planned">Planned Downtime</option>
                  <option value="unplanned">Unplanned Downtime</option>
                </select>
              </div>

              <div>
                <Label htmlFor="downtime_category">Kategori Downtime</Label>
                <select
                  id="downtime_category"
                  value={formData.downtime_category}
                  onChange={(e) => handleInputChange('downtime_category', e.target.value)}
                  disabled={!formData.downtime_type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih Kategori</option>
                  {formData.downtime_type && downtimeCategories[formData.downtime_type as keyof typeof downtimeCategories]?.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Prioritas</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Time & Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Waktu & Dampak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="start_time">Waktu Mulai</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_time">Waktu Selesai</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>

              {duration > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Durasi Downtime: {duration} menit ({(duration / 60).toFixed(1)} jam)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="production_loss">Production Loss (qty)</Label>
                <Input
                  id="production_loss"
                  type="number"
                  step="0.01"
                  value={formData.production_loss}
                  onChange={(e) => handleInputChange('production_loss', e.target.value)}
                  placeholder="Kehilangan produksi"
                />
              </div>

              <div>
                <Label htmlFor="cost_impact">Cost Impact (IDR)</Label>
                <Input
                  id="cost_impact"
                  type="number"
                  step="0.01"
                  value={formData.cost_impact}
                  onChange={(e) => handleInputChange('cost_impact', e.target.value)}
                  placeholder="Dampak biaya"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Analisis Masalah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="downtime_reason">Alasan Downtime</Label>
              <Input
                id="downtime_reason"
                value={formData.downtime_reason}
                onChange={(e) => handleInputChange('downtime_reason', e.target.value)}
                placeholder="Jelaskan alasan downtime..."
                required
              />
            </div>

            <div>
              <Label htmlFor="root_cause">Root Cause Analysis</Label>
              <Textarea
                id="root_cause"
                value={formData.root_cause}
                onChange={(e) => handleInputChange('root_cause', e.target.value)}
                placeholder="Analisis akar penyebab masalah..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action & Resolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tindakan & Resolusi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="action_taken">Tindakan yang Diambil</Label>
              <Textarea
                id="action_taken"
                value={formData.action_taken}
                onChange={(e) => handleInputChange('action_taken', e.target.value)}
                placeholder="Jelaskan tindakan yang telah diambil..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="prevention_action">Tindakan Pencegahan</Label>
              <Textarea
                id="prevention_action"
                value={formData.prevention_action}
                onChange={(e) => handleInputChange('prevention_action', e.target.value)}
                placeholder="Tindakan pencegahan untuk masa depan..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? 'Menyimpan...' : 'Simpan Data Downtime'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DowntimeInput;
