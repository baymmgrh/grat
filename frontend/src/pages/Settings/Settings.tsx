import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationService } from '../../services/notificationService';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BellIcon,
  BoltIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CogIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  KeyIcon,
  LinkIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetCompanyProfileQuery,
  useUpdateCompanyProfileMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateBackupMutation,
  useUpdateSessionTimeoutMutation
} from '../../services/api';
import { useGetRolesQuery } from '../../services/userManagementApi';
import UserModal from '../../components/Settings/UserModal';

interface SettingsTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Settings: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    is_active: true,
    is_admin: false
  });

  // API Hooks - with error handling
  const { data: systemSettings, isLoading: systemLoading, error: systemError } = useGetSystemSettingsQuery(undefined, {
    skip: false, // Always try to fetch, but handle errors gracefully
  });
  const { data: companyData, isLoading: companyLoading, error: companyError } = useGetCompanyProfileQuery(undefined, {
    skip: false
  });
  const { data: usersData, isLoading: usersLoading, error: usersError } = useGetUsersQuery(undefined, {
    skip: false
  });
  
  const [updateSystemSettings] = useUpdateSystemSettingsMutation();
  const [updateCompanyProfile] = useUpdateCompanyProfileMutation();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createBackup] = useCreateBackupMutation();
  const [updateSessionTimeout] = useUpdateSessionTimeoutMutation();

  // Import State
  const [importFiles, setImportFiles] = useState({
    products: null as File | null,
    materials: null as File | null,
    inventory: null as File | null
  });
  const [importProgress, setImportProgress] = useState({
    products: { uploading: false, success: false, error: null as string | null },
    materials: { uploading: false, success: false, error: null as string | null },
    inventory: { uploading: false, success: false, error: null as string | null }
  });

  // Local state for form data with fallback defaults
  const [companySettings, setCompanySettings] = useState({
    name: 'PT. Gratia Makmur Sentosa',
    address: 'Jl. Industri No. 123, Jakarta',
    phone: '+62-21-1234567',
    email: 'info@gratiamakmur.com',
    website: 'www.gratiamakmur.com',
    taxId: '12.345.678.9-012.000',
    currency: 'IDR',
    timezone: 'Asia/Jakarta'
  });

  const [systemSettingsState, setSystemSettingsState] = useState({
    language: 'id',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    weekStart: 'monday',
    fiscalYearStart: 'january',
    autoBackup: true,
    backupFrequency: 'daily',
    theme: 'light',
    // In-App Notification Settings
    systemAlerts: true,
    taskReminders: true,
    inventoryAlerts: true,
    productionUpdates: true,
    qualityAlerts: true,
    soundNotifications: true,
    desktopNotifications: true,
    notificationTimeout: '5000'
  });

  // Load data from API when available, fallback to defaults if API fails
  useEffect(() => {
    if (companyData && !companyError) {
      setCompanySettings({
        name: companyData.name || 'PT. Gratia Makmur Sentosa',
        address: companyData.address || 'Jl. Industri No. 123, Jakarta',
        phone: companyData.phone || '+62-21-1234567',
        email: companyData.email || 'info@gratiamakmur.com',
        website: companyData.website || 'www.gratiamakmur.com',
        taxId: companyData.taxId || '12.345.678.9-012.000',
        currency: companyData.currency || 'IDR',
        timezone: companyData.timezone || 'Asia/Jakarta'
      });
    }
  }, [companyData, companyError]);

  useEffect(() => {
    if (systemSettings && !systemError) {
      setSystemSettingsState({
        language: systemSettings?.system?.language || 'id',
        dateFormat: systemSettings?.system?.dateFormat || 'DD/MM/YYYY',
        timeFormat: systemSettings?.system?.timeFormat || '24',
        weekStart: systemSettings?.system?.weekStart || 'monday',
        fiscalYearStart: systemSettings?.system?.fiscalYearStart || 'january',
        autoBackup: systemSettings?.backup?.autoBackup ?? true,
        backupFrequency: systemSettings?.backup?.backupFrequency || 'daily',
        theme: systemSettings?.ui?.theme || 'light',
        // In-App Notification Settings
        systemAlerts: systemSettings?.notifications?.systemAlerts ?? true,
        taskReminders: systemSettings?.notifications?.taskReminders ?? true,
        inventoryAlerts: systemSettings?.notifications?.inventoryAlerts ?? true,
        productionUpdates: systemSettings?.notifications?.productionUpdates ?? true,
        qualityAlerts: systemSettings?.notifications?.qualityAlerts ?? true,
        soundNotifications: systemSettings?.notifications?.soundNotifications ?? true,
        desktopNotifications: systemSettings?.notifications?.desktopNotifications ?? true,
        notificationTimeout: systemSettings?.notifications?.notificationTimeout || '5000'
      });
    }
  }, [systemSettings, systemError]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const tabs: SettingsTab[] = [
    { id: 'company', name: t('settings.company_profile'), icon: BuildingOfficeIcon },
    { id: 'system', name: t('settings.system_settings'), icon: CogIcon },
    { id: 'users', name: t('settings.user_management'), icon: UsersIcon },
    { id: 'security', name: t('settings.security'), icon: ShieldCheckIcon },
    { id: 'backup', name: t('settings.backup_restore'), icon: DocumentArrowDownIcon },
    { id: 'notifications', name: t('settings.notifications'), icon: BellIcon },
    { id: 'email', name: 'Email Settings', icon: EnvelopeIcon },
    { id: 'import', name: t('settings.data_import'), icon: DocumentArrowUpIcon },
    { id: 'advanced', name: 'Advanced Settings', icon: KeyIcon },
    { id: 'integration', name: 'Integration', icon: LinkIcon },
  ];

  const handleCompanyChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemChange = (field: string, value: string | boolean) => {
    setSystemSettingsState(prev => ({ ...prev, [field]: value }));
  };

  // Import helper functions
  const handleFileSelect = (type: 'products' | 'materials' | 'inventory', file: File | null) => {
    setImportFiles(prev => ({ ...prev, [type]: file }));
    // Reset progress when new file is selected
    setImportProgress(prev => ({
      ...prev,
      [type]: { uploading: false, success: false, error: null }
    }));
  };

  const downloadTemplate = (type: 'products' | 'materials' | 'inventory') => {
    if (type === 'products') {
      // Create Excel-like structure for products with separate sheets/sections
      createProductExcelTemplate();
    } else if (type === 'materials') {
      createMaterialExcelTemplate();
    } else if (type === 'inventory') {
      createInventoryExcelTemplate();
    }
  };

  const createProductExcelTemplate = () => {
    const headers = [
      'product_code', 'product_name', 'category', 'material_type', 'gsm', 'width_cm', 'length_m',
      'unit_price', 'cost_price', 'description', 'primary_uom', 'is_active', 'materials_bom'
    ];

    // Sample data rows with materials in JSON format
    const sampleData = [
      [
        'WTP001', 'Wet Tissue Premium', 'Wet Tissue', 'finished_goods', '50', '200', '150',
        '25000', '18000', 'Premium wet tissue for baby care', 'PCS', 'TRUE',
        'RM001:Spunlace Fabric:0.25:Meter|RM002:Purified Water:15:ML|RM003:Aloe Vera Extract:2:ML|RM004:Preservative:0.5:ML|PM001:Plastic Packaging:1:PCS'
      ],
      [
        'DTS001', 'Dry Tissue Standard', 'Dry Tissue', 'finished_goods', '35', '180', '120',
        '15000', '11000', 'Standard dry tissue for general use', 'PCS', 'TRUE',
        'RM005:Virgin Pulp:8:Gram|RM006:Recycled Fiber:4:Gram|RM007:Binding Agent:0.2:Gram|PM002:Paper Wrapper:1:PCS'
      ],
      [
        'HS001', 'Hand Sanitizer 60ml', 'Sanitizer', 'finished_goods', '', '', '',
        '12000', '8500', 'Alcohol-based hand sanitizer 70%', 'Bottle', 'TRUE',
        'RM008:Ethyl Alcohol 70%:50:ML|RM009:Glycerin:3:ML|RM010:Aloe Vera Gel:5:ML|RM011:Fragrance:1:ML|PM003:Plastic Bottle 60ml:1:PCS'
      ]
    ];

    // Create Excel-compatible XML format
    let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Product Import Template</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#CCE5FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name={t('navigation.products')}>
  <Table>`;

    // Add header row
    excelContent += '\n   <Row ss:StyleID="Header">';
    headers.forEach(header => {
      excelContent += `\n    <Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excelContent += '\n   </Row>';

    // Add data rows
    sampleData.forEach(row => {
      excelContent += '\n   <Row>';
      row.forEach(cell => {
        const cellValue = String(cell || '');
        const isNumber = !isNaN(Number(cellValue)) && cellValue !== '' && cellValue !== 'TRUE' && cellValue !== 'FALSE';
        const dataType = isNumber ? 'Number' : 'String';
        excelContent += `\n    <Cell><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
      });
      excelContent += '\n   </Row>';
    });

    excelContent += `
  </Table>
 </Worksheet>
</Workbook>`;

    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_products.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createMaterialExcelTemplate = () => {
    const headers = [
      'material_code', 'material_name', 'material_type', 'category', 'primary_uom', 'secondary_uom',
      'unit_cost', 'supplier_code', 'supplier_name', 'minimum_stock', 'maximum_stock', 'reorder_point',
      'lead_time_days', 'is_hazardous', 'storage_conditions', 'expiry_days', 'description'
    ];

    // Sample data rows
    const sampleData = [
      ['RM001', 'Spunlace Fabric', 'raw_materials', 'Textile', 'Meter', 'Roll', '15000', 'SUP001', 'PT Textile Indonesia', '100', '500', '150', '7', 'FALSE', 'Room Temperature', '365', 'High quality spunlace fabric for wet tissue'],
      ['RM002', 'Purified Water', 'raw_materials', 'Chemical', 'Liter', 'ML', '5000', 'SUP002', 'PT Water Treatment', '200', '1000', '300', '3', 'FALSE', 'Clean Storage', '30', 'Purified water for wet tissue production'],
      ['RM003', 'Aloe Vera Extract', 'raw_materials', 'Chemical', 'Liter', 'ML', '85000', 'SUP003', 'PT Natural Extract', '10', '50', '15', '14', 'FALSE', 'Cool Storage', '180', 'Natural aloe vera extract for skincare'],
      ['PM001', 'Plastic Packaging', 'packaging_materials', 'Packaging', 'PCS', 'Pack', '500', 'SUP005', 'PT Packaging Solution', '1000', '5000', '1500', '5', 'FALSE', 'Dry Storage', '1095', 'Plastic packaging for wet tissue']
    ];

    // Create Excel-compatible XML format
    let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Material Import Template</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#CCE5FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Materials">
  <Table>`;

    // Add header row
    excelContent += '\n   <Row ss:StyleID="Header">';
    headers.forEach(header => {
      excelContent += `\n    <Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excelContent += '\n   </Row>';

    // Add data rows
    sampleData.forEach(row => {
      excelContent += '\n   <Row>';
      row.forEach(cell => {
        const cellValue = String(cell || '');
        const isNumber = !isNaN(Number(cellValue)) && cellValue !== '' && cellValue !== 'TRUE' && cellValue !== 'FALSE';
        const dataType = isNumber ? 'Number' : 'String';
        excelContent += `\n    <Cell><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
      });
      excelContent += '\n   </Row>';
    });

    excelContent += `
  </Table>
 </Worksheet>
</Workbook>`;

    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_materials.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createInventoryExcelTemplate = () => {
    const headers = [
      'product_code', 'product_name', 'location_code', 'location_name', 'zone', 'rack', 'level', 'position',
      'quantity_on_hand', 'reserved_quantity', 'available_quantity', 'unit', 'batch_number', 'production_date',
      'expiry_date', 'quality_status', 'cost_per_unit', 'total_value', 'remarks'
    ];

    // Sample data rows
    const sampleData = [
      ['WTP001', 'Wet Tissue Premium', 'FG-A1-L1-P1', 'Finished Goods Warehouse A', 'Zone A1', 'Rack L1', 'Level P1', 'Position 001', '500', '50', '450', 'PCS', 'B20241001', '2024-10-01', '2025-12-31', 'Good', '18000', '9000000', 'Ready for shipment'],
      ['DTS001', 'Dry Tissue Standard', 'FG-A1-L2-P1', 'Finished Goods Warehouse A', 'Zone A1', 'Rack L2', 'Level P1', 'Position 001', '800', '100', '700', 'PCS', 'B20241002', '2024-10-02', '2026-10-02', 'Good', '11000', '8800000', 'Quality checked'],
      ['HS001', 'Hand Sanitizer 60ml', 'FG-B1-L1-P2', 'Finished Goods Warehouse B', 'Zone B1', 'Rack L1', 'Level P2', 'Position 002', '300', '25', '275', 'Bottle', 'B20241003', '2024-10-03', '2026-10-03', 'Good', '8500', '2550000', 'Temperature controlled'],
      ['RM001', 'Spunlace Fabric', 'RM-C1-L1-P1', 'Raw Materials Warehouse C', 'Zone C1', 'Rack L1', 'Level P1', 'Position 001', '150', '20', '130', 'Meter', 'RM20241001', '2024-09-15', '2025-09-15', 'Good', '15000', '2250000', 'Incoming inspection passed']
    ];

    // Create Excel-compatible XML format
    let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Inventory Import Template</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#CCE5FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Inventory">
  <Table>`;

    // Add header row
    excelContent += '\n   <Row ss:StyleID="Header">';
    headers.forEach(header => {
      excelContent += `\n    <Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excelContent += '\n   </Row>';

    // Add data rows
    sampleData.forEach(row => {
      excelContent += '\n   <Row>';
      row.forEach(cell => {
        const cellValue = String(cell || '');
        const isNumber = !isNaN(Number(cellValue)) && cellValue !== '' && cellValue !== 'TRUE' && cellValue !== 'FALSE';
        const dataType = isNumber ? 'Number' : 'String';
        excelContent += `\n    <Cell><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
      });
      excelContent += '\n   </Row>';
    });

    excelContent += `
  </Table>
 </Worksheet>
</Workbook>`;

    // Create blob and download
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_inventory.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadFile = async (type: 'products' | 'materials' | 'inventory') => {
    const file = importFiles[type];
    if (!file) return;

    setImportProgress(prev => ({
      ...prev,
      [type]: { uploading: true, success: false, error: null }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/import/data', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setImportProgress(prev => ({
        ...prev,
        [type]: { uploading: false, success: true, error: null }
      }));

      showMessage('success', `${result.imported_count} ${t('import.records_imported')} ${type}`);
      
    } catch (error) {
      setImportProgress(prev => ({
        ...prev,
        [type]: { uploading: false, success: false, error: error instanceof Error ? error.message : 'Upload failed' }
      }));
      showMessage('error', t('import.upload_error'));
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'company') {
        await updateCompanyProfile(companySettings).unwrap();
        
        // Trigger event to update header and other components
        window.dispatchEvent(new CustomEvent('companySettingsUpdated'));
        
        showMessage('success', 'Company profile updated successfully!');
      } else if (activeTab === 'system') {
        // Organize settings by category for backend
        const settingsPayload = {
          system: {
            language: systemSettingsState.language,
            dateFormat: systemSettingsState.dateFormat,
            timeFormat: systemSettingsState.timeFormat,
            weekStart: systemSettingsState.weekStart,
            fiscalYearStart: systemSettingsState.fiscalYearStart
          },
          backup: {
            autoBackup: systemSettingsState.autoBackup,
            backupFrequency: systemSettingsState.backupFrequency
          },
          notifications: {
            systemAlerts: systemSettingsState.systemAlerts,
            taskReminders: systemSettingsState.taskReminders,
            inventoryAlerts: systemSettingsState.inventoryAlerts,
            productionUpdates: systemSettingsState.productionUpdates,
            qualityAlerts: systemSettingsState.qualityAlerts,
            soundNotifications: systemSettingsState.soundNotifications,
            desktopNotifications: systemSettingsState.desktopNotifications,
            notificationTimeout: systemSettingsState.notificationTimeout
          },
          ui: {
            theme: systemSettingsState.theme
          }
        };
        
        await updateSystemSettings(settingsPayload).unwrap();
        
        // Trigger theme update event
        if (systemSettingsState.theme) {
          window.dispatchEvent(new CustomEvent('themeSettingsUpdated', {
            detail: { theme: systemSettingsState.theme }
          }));
        }
        
        // Trigger language update event
        if (systemSettingsState.language) {
          window.dispatchEvent(new CustomEvent('languageSettingsUpdated', {
            detail: { language: systemSettingsState.language }
          }));
        }
        
        showMessage('success', t('settings.saved_success'));
      }
    } catch (error: any) {
      showMessage('error', `Failed to save settings: ${error.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      const result = await createBackup({}).unwrap();
      showMessage('success', `Backup created successfully! File: ${result.backup_file}`);
    } catch (error: any) {
      showMessage('error', `Backup failed: ${error.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionTimeoutUpdate = async (minutes: number) => {
    try {
      await updateSessionTimeout({ timeout_minutes: minutes }).unwrap();
      setSessionTimeout(minutes);
      showMessage('success', `Session timeout updated to ${minutes} minutes`);
    } catch (error: any) {
      showMessage('error', `Failed to update session timeout: ${error.data?.error || error.message}`);
    }
  };

  const handleTestInAppNotification = () => {
    // Show different types of in-app notifications for testing
    const notifications = [
      { 
        type: 'success' as const, 
        title: 'System Alert',
        message: 'Test notification successful! All systems are working properly.',
        category: 'system'
      },
      { 
        type: 'info' as const, 
        title: 'Task Reminder',
        message: 'You have 3 pending tasks to complete before end of day.',
        category: 'task'
      },
      { 
        type: 'warning' as const, 
        title: 'Inventory Alert',
        message: 'Low stock detected for 5 products. Please review reorder points.',
        category: 'inventory'
      },
      { 
        type: 'info' as const, 
        title: 'Production Update',
        message: 'Work Order WO-001 completed successfully. Quality check pending.',
        category: 'production'
      },
      { 
        type: 'error' as const, 
        title: 'Quality Alert',
        message: 'Quality inspection failed for Batch B-001. Immediate action required.',
        category: 'quality'
      }
    ];

    // Show multiple notifications for better testing
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        notificationService.show({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          category: notification.category
        });
      }, index * 500); // Stagger notifications by 500ms
    });
    
    // Show success message
    showMessage('success', 'Test notifications sent to notification center!');
  };

  // User Management Functions
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      full_name: '',
      password: '',
      is_active: true,
      is_admin: false
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: '', // Don't pre-fill password
      is_active: user.is_active,
      is_admin: user.is_admin
    });
    setShowUserModal(true);
  };

  const handleUserFormChange = (field: string, value: string | boolean) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          id: editingUser.id,
          username: userForm.username,
          email: userForm.email,
          full_name: userForm.full_name,
          is_active: userForm.is_active,
          is_admin: userForm.is_admin
        };
        
        // Only include password if provided
        if (userForm.password.trim()) {
          updateData.password = userForm.password;
        }
        
        await updateUser(updateData).unwrap();
        showMessage('success', 'User updated successfully!');
      } else {
        // Create new user
        if (!userForm.password.trim()) {
          showMessage('error', 'Password is required for new users');
          return;
        }
        
        await createUser(userForm).unwrap();
        showMessage('success', 'User created successfully!');
      }
      
      setShowUserModal(false);
    } catch (error: any) {
      showMessage('error', `Failed to save user: ${error.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: number, userName: string) => {
    if (!confirm(`Yakin ingin menonaktifkan user "${userName}"?\n\nUser akan di-deactivate dan tidak bisa login, tapi data tetap tersimpan.`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteUser(userId).unwrap();
      showMessage('success', 'User berhasil dinonaktifkan!');
    } catch (error: any) {
      showMessage('error', `Gagal menonaktifkan user: ${error.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentDeleteUser = async (userId: number, userName: string) => {
    // Double confirmation for permanent delete
    const firstConfirm = confirm(
      `⚠️ PERINGATAN: Hapus Permanen!\n\n` +
      `Anda akan menghapus user "${userName}" secara PERMANEN.\n\n` +
      `Tindakan ini TIDAK DAPAT DIBATALKAN!\n\n` +
      `Klik OK untuk melanjutkan.`
    );
    
    if (!firstConfirm) return;
    
    const secondConfirm = confirm(
      `🚨 KONFIRMASI TERAKHIR\n\n` +
      `Ketik OK untuk menghapus "${userName}" secara permanen.\n\n` +
      `Semua data user akan dihapus dari sistem.`
    );
    
    if (!secondConfirm) return;
    
    try {
      setIsLoading(true);
      // Call permanent delete endpoint
      await axiosInstance.delete(`/api/settings/users/${userId}/permanent`);
      showMessage('success', `User "${userName}" berhasil dihapus permanen!`);
      // Refresh user list
      window.location.reload();
    } catch (error: any) {
      showMessage('error', `Gagal menghapus user: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    // Show error state if API calls failed
    if (systemError || companyError || usersError) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">API Connection Error</h3>
            <p className="text-red-600 mb-4">
              Cannot connect to backend services. Please check:
            </p>
            <ul className="text-sm text-red-600 text-left space-y-1 max-w-md mx-auto">
              <li>• Backend server is running on port 5000</li>
              <li>• You are logged in with valid credentials</li>
              <li>• Network connection is stable</li>
            </ul>
            {systemError && (
              <div className="mt-4 p-2 bg-red-100 rounded text-xs text-red-700">
                System Settings Error: {JSON.stringify(systemError)}
              </div>
            )}
            {companyError && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                Company Profile Error: {JSON.stringify(companyError)}
              </div>
            )}
            {usersError && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                UsersIcon Error: {JSON.stringify(usersError)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Show loading state
    if (systemLoading || companyLoading || usersLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2">Loading settings...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={companySettings.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax ID / NPWP</label>
                <input
                  type="text"
                  value={companySettings.taxId || ''}
                  onChange={(e) => handleCompanyChange('taxId', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea
                  value={companySettings.address || ''}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="text"
                  value={companySettings.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={companySettings.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="text"
                  value={companySettings.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">{t('settings.system_preferences')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.language')}</label>
                <select
                  value={systemSettingsState.language}
                  onChange={(e) => handleSystemChange('language', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('settings.theme')}</label>
                <select
                  value={systemSettingsState.theme}
                  onChange={(e) => handleSystemChange('theme', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            
            {/* In-App Notifications Section */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <BellIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900">In-App Notifications</h4>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Receive real-time notifications within the application interface
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h5 className="font-medium text-gray-900">System Alerts</h5>
                      <p className="text-sm text-gray-600">Important system messages and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.systemAlerts !== false}
                      onChange={(e) => handleSystemChange('systemAlerts', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h5 className="font-medium text-gray-900">Task Reminders</h5>
                      <p className="text-sm text-gray-600">Reminders for pending tasks and deadlines</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.taskReminders !== false}
                      onChange={(e) => handleSystemChange('taskReminders', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h5 className="font-medium text-gray-900">Inventory Alerts</h5>
                      <p className="text-sm text-gray-600">Low stock and reorder point notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.inventoryAlerts !== false}
                      onChange={(e) => handleSystemChange('inventoryAlerts', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h5 className="font-medium text-gray-900">Production Updates</h5>
                      <p className="text-sm text-gray-600">Production status and completion notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.productionUpdates !== false}
                      onChange={(e) => handleSystemChange('productionUpdates', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <h5 className="font-medium text-gray-900">Quality Alerts</h5>
                      <p className="text-sm text-gray-600">Quality control and inspection notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.qualityAlerts !== false}
                      onChange={(e) => handleSystemChange('qualityAlerts', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notification Preferences */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Notification Preferences</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Sound Notifications</label>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.soundNotifications !== false}
                      onChange={(e) => handleSystemChange('soundNotifications', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Desktop Notifications</label>
                    <input
                      type="checkbox"
                      checked={systemSettingsState.desktopNotifications !== false}
                      onChange={(e) => handleSystemChange('desktopNotifications', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Auto-dismiss after</label>
                    <select
                      value={systemSettingsState.notificationTimeout || '5000'}
                      onChange={(e) => handleSystemChange('notificationTimeout', e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="3000">3 seconds</option>
                      <option value="5000">5 seconds</option>
                      <option value="10000">10 seconds</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Test Notification */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">Test Notification Center</h4>
                    <p className="text-sm text-green-700">Send test notifications to the bell icon notification center in the header</p>
                  </div>
                  <button
                    onClick={() => handleTestInAppNotification()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                    disabled={isLoading}
                  >
                    <BellIcon className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Send Test Notifications'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Backup & Restore</h3>
              <button
                onClick={() => navigate('/app/settings/backup-restore')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Advanced Backup
              </button>
            </div>

            {/* Enhanced Backup Info Card */}
            <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <DocumentArrowDownIcon className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">Enhanced Backup & Restore System</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-200">Advanced backup management with scheduling and automation</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">✨ New Features:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Automated backup scheduling</li>
                    <li>• Backup history management</li>
                    <li>• One-click restore functionality</li>
                    <li>• Backup compression options</li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">🔧 Advanced Options:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Retention policy management</li>
                    <li>• File inclusion/exclusion</li>
                    <li>• ArrowDownTrayIcon backup files</li>
                    <li>• Upload & restore from file</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/settings/backup-restore')}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Open Advanced Backup System
                </button>
              </div>
            </div>

            {/* Legacy Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Quick Backup</h4>
                <div className="space-y-3">
                  <button
                    onClick={handleCreateBackup}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Creating...' : 'Create Backup Now'}
                  </button>
                  <p className="text-xs text-gray-500">Basic backup functionality. Use Advanced Backup for more options.</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-6">
                <h4 className="font-medium mb-4">Auto Backup</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemSettingsState.autoBackup}
                      onChange={(e) => handleSystemChange('autoBackup', e.target.checked)}
                      className="w-4 h-4 text-primary-600 mr-3"
                    />
                    <label>Enable automatic backup</label>
                  </div>
                  <p className="text-xs text-gray-500">Configure advanced scheduling in Advanced Backup system.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Email Notification Settings</h3>
              <button
                onClick={() => navigate('/app/settings/email')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Open Email Settings
              </button>
            </div>

            {/* Email Settings Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <EnvelopeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Email Notification System</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">Configure email providers and notification settings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">📧 Supported Providers:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Resend (Recommended)</li>
                    <li>• Gmail SMTP</li>
                    <li>• Custom SMTP</li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">✉️ Email Templates:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Welcome emails</li>
                    <li>• Password reset</li>
                    <li>• Order notifications</li>
                    <li>• Low stock alerts</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/app/settings/email')}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Configure Email Settings
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Email configuration is done in the backend <code className="bg-yellow-100 px-1 rounded">.env</code> file. 
                Visit the Email Settings page for detailed setup instructions.
              </p>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Management</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/app/settings/user-roles')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Manage Roles
                </button>
                <button 
                  onClick={openAddUserModal}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Add New User
                </button>
              </div>
            </div>

            {/* Role Management Info Card */}
            <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <div className="flex items-center">
                <KeyIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Advanced Role Management</h4>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                For detailed role and permission management, use the <button onClick={() => navigate('/app/settings/user-roles')} className="underline font-medium hover:text-purple-600">Advanced Role Management</button> system.
              </p>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersData?.users?.length > 0 ? (
                    usersData.users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_admin 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditUserModal(user)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              title="Edit user"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            {user.is_active ? (
                              <button 
                                onClick={() => handleDeactivateUser(user.id, user.username)}
                                className="text-yellow-600 hover:text-yellow-800 font-medium"
                                title="Nonaktifkan user (data tetap tersimpan)"
                              >
                                Nonaktifkan
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Nonaktif</span>
                            )}
                            <span className="text-gray-300">|</span>
                            <button 
                              onClick={() => handlePermanentDeleteUser(user.id, user.username)}
                              className="text-red-600 hover:text-red-800 font-medium"
                              title="Hapus permanen (tidak dapat dikembalikan)"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-gray-600">Automatically log out after inactivity</p>
                </div>
                <select 
                  className="border rounded-lg px-3 py-2"
                  value={sessionTimeout}
                  onChange={(e) => handleSessionTimeoutUpdate(parseInt(e.target.value))}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('import.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{t('import.subtitle')}</p>
            </div>

            {/* Import Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products Import */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center mb-4">
                  <CubeIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{t('import.products')}</h4>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Import produk dengan kode, nama, kategori, harga, dan <strong>multiple materials per product</strong>
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📊 Template Excel (.xls) - Header Ringkas:</h5>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>13 Kolom Saja</strong>: Header tidak terlalu panjang, mudah dilihat</li>
                      <li>• <strong>Materials BOM</strong>: Semua material dalam 1 kolom dengan format: code:name:qty:unit|code:name:qty:unit</li>
                      <li>• <strong>Contoh Format</strong>: RM001:Spunlace Fabric:0.25:Meter|RM002:Purified Water:15:ML</li>
                      <li>• <strong>Separator</strong>: Gunakan | (pipe) untuk pisah antar material, : (titik dua) untuk pisah field</li>
                      <li>• <strong>Header Berwarna</strong>: Baris 1 dengan background biru dan font bold</li>
                      <li>• <strong>Sample Data</strong>: 3 contoh produk dengan format BOM yang benar</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => downloadTemplate('products')}
                    className="w-full btn-secondary text-sm"
                  >
                    📄 {t('import.download_template')}
                  </button>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => handleFileSelect('products', e.target.files?.[0] || null)}
                      className="hidden"
                      id="products-file"
                    />
                    <label htmlFor="products-file" className="cursor-pointer block text-center">
                      <div className="text-gray-600 dark:text-gray-300">
                        <DocumentArrowUpIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">{t('import.choose_file')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('import.file_requirements')}</p>
                      </div>
                    </label>
                  </div>

                  {importFiles.products && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📎 {importFiles.products.name}
                      </p>
                      <button
                        onClick={() => uploadFile('products')}
                        disabled={importProgress.products.uploading}
                        className="mt-2 w-full btn-primary text-sm"
                      >
                        {importProgress.products.uploading ? [t('import.processing')] : t('import.upload_file')}
                      </button>
                    </div>
                  )}

                  {importProgress.products.success && (
                    <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
                      <p className="text-sm text-green-600 dark:text-green-300">✅ {t('import.upload_success')}</p>
                    </div>
                  )}

                  {importProgress.products.error && (
                    <div className="bg-red-50 dark:bg-red-900 p-3 rounded">
                      <p className="text-sm text-red-600 dark:text-red-300">❌ {importProgress.products.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Materials Import */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center mb-4">
                  <BuildingStorefrontIcon className="h-8 w-8 text-green-600 mr-3" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{t('import.materials')}</h4>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Import bahan baku dengan kode, nama, supplier, dan informasi lengkap
                  </p>
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">📊 Template Excel (.xls):</h5>
                    <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>File Excel Asli</strong>: Format .xls yang bisa dibuka di Excel/LibreOffice</li>
                      <li>• <strong>Header Berwarna</strong>: Baris 1 dengan background biru dan font bold</li>
                      <li>• <strong>Baris 2-5</strong>: Sample data (bisa dihapus)</li>
                      <li>• <strong>Baris 6 dst</strong>: Isi dengan data material Anda</li>
                      <li>• <strong>Informasi Lengkap</strong>: Supplier, stok, lead time, storage conditions</li>
                      <li>• <strong>Kolom Terpisah</strong>: Setiap field dalam kolom sendiri, mudah diedit</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => downloadTemplate('materials')}
                    className="w-full btn-secondary text-sm"
                  >
                    📄 {t('import.download_template')}
                  </button>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => handleFileSelect('materials', e.target.files?.[0] || null)}
                      className="hidden"
                      id="materials-file"
                    />
                    <label htmlFor="materials-file" className="cursor-pointer block text-center">
                      <div className="text-gray-600 dark:text-gray-300">
                        <DocumentArrowUpIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">{t('import.choose_file')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('import.file_requirements')}</p>
                      </div>
                    </label>
                  </div>

                  {importFiles.materials && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📎 {importFiles.materials.name}
                      </p>
                      <button
                        onClick={() => uploadFile('materials')}
                        disabled={importProgress.materials.uploading}
                        className="mt-2 w-full btn-primary text-sm"
                      >
                        {importProgress.materials.uploading ? [t('import.processing')] : t('import.upload_file')}
                      </button>
                    </div>
                  )}

                  {importProgress.materials.success && (
                    <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
                      <p className="text-sm text-green-600 dark:text-green-300">✅ {t('import.upload_success')}</p>
                    </div>
                  )}

                  {importProgress.materials.error && (
                    <div className="bg-red-50 dark:bg-red-900 p-3 rounded">
                      <p className="text-sm text-red-600 dark:text-red-300">❌ {importProgress.materials.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Import */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">{t('import.inventory')}</h4>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Import stok barang dengan lokasi, kuantitas, batch, dan informasi lengkap
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">📊 Template Excel (.xls):</h5>
                    <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>File Excel Asli</strong>: Format .xls yang bisa dibuka di Excel/LibreOffice</li>
                      <li>• <strong>Header Berwarna</strong>: Baris 1 dengan background biru dan font bold</li>
                      <li>• <strong>Baris 2-5</strong>: Sample data (bisa dihapus)</li>
                      <li>• <strong>Baris 6 dst</strong>: Isi dengan data inventory Anda</li>
                      <li>• <strong>Lokasi Detail</strong>: Zone, rack, level, position lengkap</li>
                      <li>• <strong>Batch Tracking</strong>: Production date, expiry date, quality status</li>
                      <li>• <strong>Kolom Terpisah</strong>: Setiap field dalam kolom sendiri, mudah diedit</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => downloadTemplate('inventory')}
                    className="w-full btn-secondary text-sm"
                  >
                    📄 {t('import.download_template')}
                  </button>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => handleFileSelect('inventory', e.target.files?.[0] || null)}
                      className="hidden"
                      id="inventory-file"
                    />
                    <label htmlFor="inventory-file" className="cursor-pointer block text-center">
                      <div className="text-gray-600 dark:text-gray-300">
                        <DocumentArrowUpIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">{t('import.choose_file')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('import.file_requirements')}</p>
                      </div>
                    </label>
                  </div>

                  {importFiles.inventory && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📎 {importFiles.inventory.name}
                      </p>
                      <button
                        onClick={() => uploadFile('inventory')}
                        disabled={importProgress.inventory.uploading}
                        className="mt-2 w-full btn-primary text-sm"
                      >
                        {importProgress.inventory.uploading ? [t('import.processing')] : t('import.upload_file')}
                      </button>
                    </div>
                  )}

                  {importProgress.inventory.success && (
                    <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
                      <p className="text-sm text-green-600 dark:text-green-300">✅ {t('import.upload_success')}</p>
                    </div>
                  )}

                  {importProgress.inventory.error && (
                    <div className="bg-red-50 dark:bg-red-900 p-3 rounded">
                      <p className="text-sm text-red-600 dark:text-red-300">❌ {importProgress.inventory.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Petunjuk Import:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>ArrowDownTrayIcon template terlebih dahulu untuk format yang benar</li>
                <li>Isi data sesuai format template (jangan ubah header kolom)</li>
                <li>File maksimal 10MB dalam format .csv atau .xlsx</li>
                <li>Data yang duplikat akan diabaikan berdasarkan kode unik</li>
                <li>Proses import akan memvalidasi data sebelum menyimpan</li>
              </ul>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">System Configuration</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Advanced system settings</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/settings/system-config')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                </button>
              </div>

              {/* Audit Trail */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Audit Trail</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track system changes</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/settings/audit-trail')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  View Logs
                </button>
              </div>

              {/* Enhanced Backup & Restore */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <DocumentArrowDownIcon className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Enhanced Backup & Restore</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Advanced backup management</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/settings/backup-restore')}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">ℹ️ Advanced Settings Information:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>System Configuration: Configure advanced system parameters and settings</li>
                <li>Audit Trail: Track all system activities and changes for compliance</li>
                <li>Enhanced Backup & Restore: Advanced backup management with scheduling and automation</li>
              </ul>
            </div>
          </div>
        );

      case 'integration':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Integration Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* External Connectors */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <Link className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">External Connectors</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect external systems</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/integration/connectors')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                </button>
              </div>

              {/* API Gateway */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <GlobeAltIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">API Gateway</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage API endpoints</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/integration/api-gateway')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                </button>
              </div>

              {/* Data Synchronization */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <ArrowPathIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Data Sync</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Synchronize data</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/integration/data-sync')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                </button>
              </div>

              {/* Webhook Management */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <BoltIcon className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Webhooks</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Event notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/app/integration/webhooks')}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">🔗 Integration Information:</h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                <li>External Connectors: Connect and manage external system integrations</li>
                <li>API Gateway: Control API access and manage endpoint configurations</li>
                <li>Data Synchronization: Monitor and manage data sync between systems</li>
                <li>Webhooks: Set up event-driven notifications and integrations</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Select a tab to view settings</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-300">{t('settings.subtitle')}</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg">Processing...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {renderTabContent()}
            
            <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
              <button 
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={saveSettings}
                disabled={isLoading || (activeTab === 'backup') || (activeTab === 'notifications') || (activeTab === 'users') || (activeTab === 'email') || (activeTab === 'kpi')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? [t('common.loading')] : t('settings.save_changes')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        roles={useGetRolesQuery().data?.roles || []}
      />
    </div>
  );
};

export default Settings;
