import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FunnelIcon,
  LinkIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
const OpportunityList: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <FunnelIcon className="h-8 w-8 text-gray-600 mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opportunity Pipeline</h1>
            <p className="text-gray-600 mt-1">Manage and track your sales opportunities</p>
          </div>
        </div>
        
        <Link
          to="/app/sales/opportunities/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New Opportunity
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first opportunity.
          </p>
          <div className="mt-6">
            <Link
              to="/app/sales/opportunities/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add New Opportunity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityList;
