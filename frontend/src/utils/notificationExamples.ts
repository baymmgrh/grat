// Example usage of notification service throughout the application
import { notificationService } from '../services/notificationService';

// Example: Product operations
export const productNotifications = {
  created: (productName: string) => {
    notificationService.success(
      `Product "${productName}" has been created successfully`,
      'Product Created',
      'product'
    );
  },
  
  updated: (productName: string) => {
    notificationService.info(
      `Product "${productName}" has been updated`,
      'Product Updated',
      'product'
    );
  },
  
  deleted: (productName: string) => {
    notificationService.warning(
      `Product "${productName}" has been deleted`,
      'Product Deleted',
      'product'
    );
  },
  
  lowStock: (productName: string, currentStock: number) => {
    notificationService.warning(
      `Product "${productName}" is running low on stock (${currentStock} remaining)`,
      'Low Stock Alert',
      'inventory'
    );
  }
};

// Example: Production operations
export const productionNotifications = {
  workOrderCompleted: (woNumber: string) => {
    notificationService.success(
      `Work Order ${woNumber} has been completed successfully`,
      'Production Complete',
      'production'
    );
  },
  
  workOrderStarted: (woNumber: string) => {
    notificationService.info(
      `Work Order ${woNumber} has been started`,
      'Production Started',
      'production'
    );
  },
  
  machineDown: (machineName: string) => {
    notificationService.error(
      `Machine "${machineName}" is currently down and requires maintenance`,
      'Machine Alert',
      'maintenance'
    );
  },
  
  qualityIssue: (batchNumber: string) => {
    notificationService.error(
      `Quality issue detected in batch ${batchNumber}. Immediate attention required`,
      'Quality Alert',
      'quality'
    );
  }
};

// Example: System operations
export const systemNotifications = {
  backupCompleted: () => {
    notificationService.success(
      'System backup has been completed successfully',
      'Backup Complete',
      'system'
    );
  },
  
  maintenanceScheduled: (scheduledTime: string) => {
    notificationService.info(
      `System maintenance is scheduled for ${scheduledTime}`,
      'Maintenance Scheduled',
      'system'
    );
  },
  
  loginSuccess: (userName: string) => {
    notificationService.success(
      `Welcome back, ${userName}!`,
      'Login Successful',
      'auth'
    );
  },
  
  sessionExpiring: (minutes: number) => {
    notificationService.warning(
      `Your session will expire in ${minutes} minutes. Please save your work`,
      'Session Expiring',
      'auth'
    );
  }
};

// Example: Sales operations
export const salesNotifications = {
  orderReceived: (orderNumber: string, customerName: string) => {
    notificationService.info(
      `New order ${orderNumber} received from ${customerName}`,
      'New Order',
      'sales'
    );
  },
  
  orderShipped: (orderNumber: string) => {
    notificationService.success(
      `Order ${orderNumber} has been shipped successfully`,
      'Order Shipped',
      'sales'
    );
  },
  
  paymentReceived: (amount: number, customerName: string) => {
    notificationService.success(
      `Payment of $${amount.toFixed(2)} received from ${customerName}`,
      'Payment Received',
      'finance'
    );
  }
};

// Example: HR operations
export const hrNotifications = {
  leaveApproved: (employeeName: string, leaveType: string) => {
    notificationService.success(
      `${leaveType} request for ${employeeName} has been approved`,
      'Leave Approved',
      'hr'
    );
  },
  
  attendanceAlert: (employeeName: string) => {
    notificationService.warning(
      `${employeeName} has not clocked in today`,
      'Attendance Alert',
      'hr'
    );
  },
  
  trainingDue: (employeeName: string, trainingName: string) => {
    notificationService.info(
      `${employeeName} has upcoming training: ${trainingName}`,
      'Training Reminder',
      'hr'
    );
  }
};

// Utility function to show notifications based on API responses
export const showApiResponseNotification = (response: any, operation: string) => {
  if (response.status >= 200 && response.status < 300) {
    notificationService.success(
      `${operation} completed successfully`,
      'Success'
    );
  } else if (response.status >= 400 && response.status < 500) {
    notificationService.error(
      response.data?.message || `${operation} failed due to client error`,
      'Error'
    );
  } else if (response.status >= 500) {
    notificationService.error(
      `${operation} failed due to server error. Please try again later`,
      'Server Error'
    );
  }
};

// Utility function for form validation notifications
export const showValidationNotification = (errors: string[]) => {
  if (errors.length === 1) {
    notificationService.warning(errors[0], 'Validation Error');
  } else if (errors.length > 1) {
    notificationService.warning(
      `Please fix the following errors:\n${errors.join('\n')}`,
      'Validation Errors'
    );
  }
};
