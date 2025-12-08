import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getPageTitle, getCommonButtons } from '../utils/translateHelper'
/**
 * Template for Module Pages with Translation Support
 * Use this template for consistent translation implementation across all modules
 */


interface ModulePageTemplateProps {
  moduleKey: string  // e.g., 'products', 'warehouse', 'production'
  pageTitle?: string // optional override for page title
  showAddButton?: boolean
  addButtonLink?: string
  addButtonText?: string
  children: React.ReactNode
}

const ModulePageTemplate: React.FC<ModulePageTemplateProps> = ({
  moduleKey,
  pageTitle,
  showAddButton = true,
  addButtonLink,
  addButtonText,
  children
}) => {
  const { t } = useLanguage();

  const { t } = useLanguage();
  const buttons = getCommonButtons(t)
  const [searchTerm, setSearchTerm] = useState('')

  // Generate page title
  const title = pageTitle || getPageTitle(t, moduleKey)
  const defaultAddText = addButtonText || `${buttons.add} ${title}`
  const defaultAddLink = addButtonLink || `/${moduleKey}/new`

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t(`${moduleKey}.subtitle`) || `Manage ${title.toLowerCase()}`}
          </p>
        </div>
        {showAddButton && (
          <Link
            to={defaultAddLink}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {defaultAddText}
          </Link>
        )}
      </div>

      {/* Search/FunnelIcon Bar */}
      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`${buttons.search}...`}
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

export default ModulePageTemplate

// Example usage:
/*

const ProductList = () => {
  return (
    <ModulePageTemplate
      moduleKey="products"
      addButtonLink="/app/products/new"
    >
      Your table/list content here
    </ModulePageTemplate>
  )
}
*/
