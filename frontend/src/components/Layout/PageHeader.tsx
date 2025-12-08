import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon
} from '@heroicons/react/24/outline';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action?: {
    label: string;
    href: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  action 
}) => {

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        {Icon && <Icon className="h-8 w-8 text-gray-600 mr-4" />}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      
      {action && (
        <Link
          to={action.href}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {action.icon ? (
            <action.icon className="-ml-1 mr-2 h-5 w-5" />
          ) : (
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          )}
          {action.label}
        </Link>
      )}
    </div>
  );
};

export default PageHeader;
