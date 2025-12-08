import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetProductsQuery, useDeleteProductMutation } from '../../services/api'
import toast from 'react-hot-toast'
import {
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ProductList() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useGetProductsQuery({ page, search })
  const [deleteProduct] = useDeleteProductMutation()

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id).unwrap()
        toast.success('Product deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products.title')}</h1>
        <Link to="/products/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          {t('products.add_new')}
        </Link>
      </div>

      <div className="card p-4">
        <input
          type="text"
          placeholder="Search products..."
          className="input-field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.code')}</th>
                  <th>{t('common.name')}</th>
                  <th>{t('products.bom.category')}</th>
                  <th>UOM</th>
                  <th>{t('common.price')}</th>
                  <th>Material Type</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.products?.map((product: any) => (
                  <tr key={product.id}>
                    <td className="font-medium">{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.category || '-'}</td>
                    <td>{product.primary_uom}</td>
                    <td>Rp {product.price.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-info">{product.material_type}</span>
                    </td>
                    <td>
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-secondary"
          >
          </button>
          <span className="px-4 py-2">
            Page {page} of {data.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === data.pages}
            className="btn-secondary"
          >
          </button>
        </div>
      )}
    </div>
  )
}
