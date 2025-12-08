import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLanguage } from '../../contexts/LanguageContext';
const RosterTest: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Roster Test Page</h1>
      <p>This is a test page to verify routing is working.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-800">✅ Route /app/hr/roster/integrated is working!</p>
        <p className="text-sm text-green-600 mt-2">
          If you can see this page, the routing is configured correctly.
        </p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Available Roster URLs:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><a href="/app/hr/roster" className="text-blue-600 hover:underline">/app/hr/roster</a> - Calendar view</li>
          <li><a href="/app/hr/roster/manage" className="text-blue-600 hover:underline">/app/hr/roster/manage</a> - Drag & Drop (Fixed)</li>
          <li><a href="/app/hr/roster/integrated" className="text-blue-600 hover:underline">/app/hr/roster/integrated</a> - Integrated (This page)</li>
        </ul>
      </div>
    </div>
  );
};

export default RosterTest;
