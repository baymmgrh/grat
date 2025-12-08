import React, { useEffect } from 'react';
import { useEffect } from 'react'
import { useGetCompanyProfileQuery } from '../services/api'

export const useDocumentTitle = (pageTitle?: string) => {
  const { data: companyProfile } = useGetCompanyProfileQuery()
  
  useEffect(() => {
    const companyName = companyProfile?.company?.name || 'ERP System'
    const title = pageTitle ? `${pageTitle} - ${companyName}` : companyName
    document.title = title
  }, [companyProfile, pageTitle])
}
