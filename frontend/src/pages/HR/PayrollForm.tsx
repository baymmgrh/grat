import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  ChartBarIcon as Calculator,
  CheckIcon as Save,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  MinusIcon as Minus,
  BanknotesIcon,
  PlusIcon as Plus,
  UserIcon as User,
  XMarkIcon as X,
  CreditCardIcon as CreditCard
} from '@heroicons/react/24/outline';
interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  department: {
    name: string;
  };
  salary: number;
}

interface PayrollPeriod {
  id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface PayrollFormData {
  payroll_period_id: number;
  employee_id: number;
  basic_salary: number;
  allowances: number;
  overtime_amount: number;
  bonus: number;
  commission: number;
  total_working_days: number;
  days_worked: number;
  days_absent: number;
  overtime_hours: number;
  late_hours: number;
  tax_deduction: number;
  insurance_deduction: number;
  pension_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  status: string;
  payment_date: string;
  payment_method: string;
  notes: string;
}

const PayrollForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PayrollFormData>({
    payroll_period_id: 0,
    employee_id: 0,
    basic_salary: 0,
    allowances: 0,
    overtime_amount: 0,
    bonus: 0,
    commission: 0,
    total_working_days: 22,
    days_worked: 22,
    days_absent: 0,
    overtime_hours: 0,
    late_hours: 0,
    tax_deduction: 0,
    insurance_deduction: 0,
    pension_deduction: 0,
    loan_deduction: 0,
    other_deductions: 0,
    status: 'calculated',
    payment_date: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'calculated', label: 'Calculated', color: 'text-blue-600' },
    { value: 'approved', label: 'Approved', color: 'text-green-600' },
    { value: 'paid', label: 'Paid', color: 'text-purple-600' }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: CurrencyDollarIcon },
    { value: 'cheque', label: 'Cheque', icon: DocumentTextIcon }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchPayrollPeriods();
    if (isEdit) {
      fetchPayrollRecord();
    }
  }, [id]);

  useEffect(() => {
    // Auto-calculate deductions when basic salary changes
    if (formData.basic_salary > 0) {
      calculateDeductions();
    }
  }, [formData.basic_salary]);

  useEffect(() => {
    // Auto-fill basic salary when employee is selected
    if (formData.employee_id > 0) {
      const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
      if (selectedEmployee) {
        setFormData(prev => ({
          ...prev,
          basic_salary: selectedEmployee.salary || 0
        }));
      }
    }
  }, [formData.employee_id, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchPayrollPeriods = async () => {
    try {
      const response = await fetch('/api/hr/payroll/periods?status=draft,processing', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollPeriods(data.periods || []);
      }
    } catch (error) {
      console.error('Failed to fetch payroll periods:', error);
    }
  };

  const fetchPayrollRecord = async () => {
    try {
      const response = await fetch(`/api/hr/payroll/records/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          payroll_period_id: data.payroll_period_id,
          employee_id: data.employee_id,
          basic_salary: data.basic_salary,
          allowances: data.allowances,
          overtime_amount: data.overtime_amount,
          bonus: data.bonus,
          commission: data.commission,
          total_working_days: data.total_working_days,
          days_worked: data.days_worked,
          days_absent: data.days_absent,
          overtime_hours: data.overtime_hours,
          late_hours: data.late_hours,
          tax_deduction: data.tax_deduction,
          insurance_deduction: data.insurance_deduction,
          pension_deduction: data.pension_deduction,
          loan_deduction: data.loan_deduction,
          other_deductions: data.other_deductions,
          status: data.status,
          payment_date: data.payment_date || '',
          payment_method: data.payment_method || 'bank_transfer',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch payroll record:', error);
    }
  };

  const calculatePPh21Monthly = (annualTaxable: number): number => {
    // PPh 21 progressive brackets (UU HPP 2022)
    let income = annualTaxable;
    let tax = 0;
    const brackets = [
      { size: 60000000, rate: 0.05 },
      { size: 190000000, rate: 0.15 },
      { size: 250000000, rate: 0.25 },
      { size: 4500000000, rate: 0.30 },
    ];
    for (const b of brackets) {
      if (income <= 0) break;
      const taxable = Math.min(income, b.size);
      tax += taxable * b.rate;
      income -= taxable;
    }
    if (income > 0) tax += income * 0.35;
    return Math.round(tax / 12);
  };

  const calculateDeductions = () => {
    const grossSalary = getGrossSalary();
    
    // PPh 21 progressive tax (annualized)
    const taxDeduction = calculatePPh21Monthly(grossSalary * 12);
    
    // BPJS Kesehatan: 1% employee share (max base 12jt)
    const bpjsBase = Math.min(formData.basic_salary, 12000000);
    const insuranceDeduction = Math.round(bpjsBase * 0.01);
    
    // BPJS Ketenagakerjaan (JHT): 2% employee share
    const pensionDeduction = Math.round(formData.basic_salary * 0.02);

    setFormData(prev => ({
      ...prev,
      tax_deduction: taxDeduction,
      insurance_deduction: insuranceDeduction,
      pension_deduction: pensionDeduction
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.payroll_period_id === 0) {
      setError('Please select a payroll period');
      setLoading(false);
      return;
    }

    if (formData.employee_id === 0) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    if (formData.basic_salary <= 0) {
      setError('Basic salary must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/hr/payroll/records/${id}` 
        : '/api/hr/payroll/records';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/app/hr/payroll');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save payroll record');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: [
        'payroll_period_id', 'employee_id', 'basic_salary', 'allowances', 'overtime_amount', 
        'bonus', 'commission', 'total_working_days', 'days_worked', 'days_absent', 
        'overtime_hours', 'late_hours', 'tax_deduction', 'insurance_deduction', 
        'pension_deduction', 'loan_deduction', 'other_deductions'
      ].includes(name) 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const getGrossSalary = () => {
    return formData.basic_salary + formData.allowances + formData.overtime_amount + 
           formData.bonus + formData.commission;
  };

  const getTotalDeductions = () => {
    return formData.tax_deduction + formData.insurance_deduction + formData.pension_deduction + 
           formData.loan_deduction + formData.other_deductions;
  };

  const getNetSalary = () => {
    return getGrossSalary() - getTotalDeductions();
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
  const selectedPeriod = payrollPeriods.find(period => period.id === formData.payroll_period_id);
  const selectedStatus = statusOptions.find(status => status.value === formData.status);
  const selectedPaymentMethod = paymentMethods.find(method => method.value === formData.payment_method);
  const PaymentIcon = selectedPaymentMethod?.icon || CreditCard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Payroll Record' : 'New Payroll Record'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update employee payroll calculation' : 'Create new payroll record for employee'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Payroll Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Payroll Period *
                </label>
                <select
                  name="payroll_period_id"
                  value={formData.payroll_period_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Payroll Period</option>
                  {payrollPeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.period_name} ({period.start_date} - {period.end_date})
                    </option>
                  ))}
                </select>
                {selectedPeriod && (
                  <p className="mt-1 text-sm text-gray-500">
                    Status: {selectedPeriod.status}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Employee *
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_number} - {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
                {selectedEmployee && (
                  <p className="mt-1 text-sm text-gray-500">
                    Department: {selectedEmployee.department?.name || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Salary Components */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Plus className="inline h-4 w-4 mr-1" />
              Salary Components
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                  Basic Salary *
                </label>
                <input
                  type="number"
                  name="basic_salary"
                  value={formData.basic_salary}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transport, meal, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Amount
                </label>
                <input
                  type="number"
                  name="overtime_amount"
                  value={formData.overtime_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="number"
                  name="bonus"
                  value={formData.bonus}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Attendance Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <ClockIcon className="inline h-4 w-4 mr-1" />
              Attendance Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Working Days
                </label>
                <input
                  type="number"
                  name="total_working_days"
                  value={formData.total_working_days}
                  onChange={handleInputChange}
                  min="1"
                  max="31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Worked
                </label>
                <input
                  type="number"
                  name="days_worked"
                  value={formData.days_worked}
                  onChange={handleInputChange}
                  min="0"
                  max="31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Absent
                </label>
                <input
                  type="number"
                  name="days_absent"
                  value={formData.days_absent}
                  onChange={handleInputChange}
                  min="0"
                  max="31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  name="overtime_hours"
                  value={formData.overtime_hours}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Minus className="inline h-4 w-4 mr-1" />
              Potongan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PPh 21 (Progresif)
                </label>
                <input
                  type="number"
                  name="tax_deduction"
                  value={formData.tax_deduction}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BPJS Kesehatan (1%)
                </label>
                <input
                  type="number"
                  name="insurance_deduction"
                  value={formData.insurance_deduction}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BPJS Ketenagakerjaan (2%)
                </label>
                <input
                  type="number"
                  name="pension_deduction"
                  value={formData.pension_deduction}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Deduction
                </label>
                <input
                  type="number"
                  name="loan_deduction"
                  value={formData.loan_deduction}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Deductions
                </label>
                <input
                  type="number"
                  name="other_deductions"
                  value={formData.other_deductions}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Salary Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              <Calculator className="inline h-4 w-4 mr-1" />
              Salary Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  IDR {getGrossSalary().toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600">Gross Salary</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  IDR {getTotalDeductions().toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600">Total Deductions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  IDR {getNetSalary().toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-600">Net Salary</div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Payment Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {selectedStatus && (
                  <p className={`mt-1 text-sm ${selectedStatus.color}`}>
                    {selectedStatus.label}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {selectedPaymentMethod && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <PaymentIcon className="h-4 w-4" />
                    <span>{selectedPaymentMethod.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes about this payroll record..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/hr/payroll')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Payroll' : 'Save Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollForm;
