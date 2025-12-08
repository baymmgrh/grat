// Note: Cannot use useLanguage hook in service files as they are not React components
// Using static strings instead for notification titles
// Global notification service to replace toast notifications
export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  category?: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Show a notification in the notification center
   */
  public show(options: NotificationOptions): void {
    const notification = {
      type: options.type || 'info',
      title: options.title || this.getDefaultTitle(options.type || 'info'),
      message: options.message,
      category: options.category,
      timestamp: new Date()
    };

    // Dispatch custom event that NotificationCenter will listen to
    const event = new CustomEvent('showNotification', {
      detail: notification
    });
    window.dispatchEvent(event);

    // Auto-dismiss if duration is specified
    if (options.duration && options.duration > 0) {
      setTimeout(() => {
        // Could implement auto-dismiss logic here if needed
      }, options.duration);
    }
  }

  /**
   * Show success notification
   */
  public success(message: string, title?: string, category?: string): void {
    this.show({
      type: 'success',
      title: title || 'Success',
      message,
      category
    });
  }

  /**
   * Show error notification
   */
  public error(message: string, title?: string, category?: string): void {
    this.show({
      type: 'error',
      title: title || 'Error',
      message,
      category
    });
  }

  /**
   * Show warning notification
   */
  public warning(message: string, title?: string, category?: string): void {
    this.show({
      type: 'warning',
      title: title || 'Warning',
      message,
      category
    });
  }

  /**
   * Show info notification
   */
  public info(message: string, title?: string, category?: string): void {
    this.show({
      type: 'info',
      title: title || 'Information',
      message,
      category
    });
  }

  /**
   * Show system alert notification
   */
  public systemAlert(message: string, title?: string): void {
    this.show({
      type: 'warning',
      title: title || 'System Alert',
      message,
      category: 'system'
    });
  }

  /**
   * Show task reminder notification
   */
  public taskReminder(message: string, title?: string): void {
    this.show({
      type: 'info',
      title: title || 'Task Reminder',
      message,
      category: 'task'
    });
  }

  /**
   * Show inventory alert notification
   */
  public inventoryAlert(message: string, title?: string): void {
    this.show({
      type: 'warning',
      title: title || 'Inventory Alert',
      message,
      category: 'inventory'
    });
  }

  /**
   * Show production update notification
   */
  public productionUpdate(message: string, title?: string): void {
    this.show({
      type: 'info',
      title: title || 'Production Update',
      message,
      category: 'production'
    });
  }

  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
      default:
        return 'Information';
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export convenience functions for easy import
export const showNotification = (options: NotificationOptions) => notificationService.show(options);
export const showSuccess = (message: string, title?: string, category?: string) => notificationService.success(message, title, category);
export const showError = (message: string, title?: string, category?: string) => notificationService.error(message, title, category);
export const showWarning = (message: string, title?: string, category?: string) => notificationService.warning(message, title, category);
export const showInfo = (message: string, title?: string, category?: string) => notificationService.info(message, title, category);

// Backward compatibility with existing toast usage
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo
};

export default notificationService;
