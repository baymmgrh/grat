import { useState } from 'react';
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Breadcrumb from '../ui/Breadcrumb'
import AIAssistant from '../AIAssistant/AIAssistant'
import SkipLink from '../ui/SkipLink'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true) // Default open for better UX

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip Link for keyboard navigation */}
      <SkipLink href="#main-content" />
      
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main id="main-content" className="py-6" role="main" aria-label="Konten utama">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  )
}
