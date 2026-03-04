// Export utility functions for Finance module

interface ExportData {
  [key: string]: string | number | boolean
}

export const exportToCSV = (data: ExportData[], filename: string) => {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportToJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const generatePDFReport = async (reportType: string, data: any) => {
  try {
    // This would typically call a backend service to generate PDF
    const response = await fetch('/api/finance/reports/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: reportType,
        data: data,
        generated_at: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      throw new Error('Failed to generate PDF')
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    alert('PDF generation service not available. Exporting as CSV instead.')
    
    // Fallback to CSV export
    if (Array.isArray(data)) {
      exportToCSV(data, `${reportType}-report`)
    } else {
      exportToJSON(data, `${reportType}-report`)
    }
  }
}

export const formatRupiah = (amount: number, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID')
}
