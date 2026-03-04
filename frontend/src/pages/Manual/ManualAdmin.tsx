import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  FolderIcon,
  EyeIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
  article_count: number;
}

interface Article {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  order: number;
  is_published: boolean;
  view_count: number;
  author: string;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: number;
  category_id: number;
  category_name: string;
  question: string;
  answer: string;
  order: number;
  is_published: boolean;
}

interface Stats {
  total_categories: number;
  total_articles: number;
  total_faqs: number;
  popular_articles: { id: number; title: string; views: number }[];
}

type TabType = 'categories' | 'articles' | 'faqs';
type ModalType = 'category' | 'article' | 'faq' | null;

const ManualAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'BookOpenIcon',
    order: 0
  });
  
  const [articleForm, setArticleForm] = useState({
    category_id: 0,
    title: '',
    summary: '',
    content: '',
    order: 0,
    is_published: true
  });
  
  const [faqForm, setFaqForm] = useState({
    category_id: 0,
    question: '',
    answer: '',
    order: 0,
    is_published: true
  });

  const iconOptions = [
    'BookOpenIcon', 'CubeIcon', 'BuildingStorefrontIcon', 'TruckIcon',
    'CurrencyDollarIcon', 'UsersIcon', 'CogIcon', 'ChartBarIcon',
    'WrenchScrewdriverIcon', 'BeakerIcon', 'ClipboardDocumentCheckIcon',
    'ShoppingCartIcon', 'ArchiveBoxIcon', 'DocumentTextIcon'
  ];

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, articlesRes, faqsRes, statsRes] = await Promise.all([
        axiosInstance.get('/api/manual/categories'),
        axiosInstance.get('/api/manual/articles'),
        axiosInstance.get('/api/manual/faqs'),
        axiosInstance.get('/api/manual/stats')
      ]);
      
      setCategories(categoriesRes.data.categories || []);
      setArticles(articlesRes.data.articles || []);
      setFaqs(faqsRes.data.faqs || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category CRUD
  const handleSaveCategory = async () => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/manual/categories/${editingItem.id}`, categoryForm);
        toast.success('Kategori berhasil diupdate');
      } else {
        await axiosInstance.post('/api/manual/categories', categoryForm);
        toast.success('Kategori berhasil dibuat');
      }
      setModalType(null);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini? Semua artikel di dalamnya juga akan terhapus.')) return;
    try {
      await axiosInstance.delete(`/api/manual/categories/${id}`);
      toast.success('Kategori berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus kategori');
    }
  };

  // Article CRUD
  const handleSaveArticle = async () => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/manual/articles/${editingItem.id}`, articleForm);
        toast.success('Artikel berhasil diupdate');
      } else {
        await axiosInstance.post('/api/manual/articles', articleForm);
        toast.success('Artikel berhasil dibuat');
      }
      setModalType(null);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan artikel');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;
    try {
      await axiosInstance.delete(`/api/manual/articles/${id}`);
      toast.success('Artikel berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus artikel');
    }
  };

  // FAQ CRUD
  const handleSaveFaq = async () => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/manual/faqs/${editingItem.id}`, faqForm);
        toast.success('FAQ berhasil diupdate');
      } else {
        await axiosInstance.post('/api/manual/faqs', faqForm);
        toast.success('FAQ berhasil dibuat');
      }
      setModalType(null);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Yakin ingin menghapus FAQ ini?')) return;
    try {
      await axiosInstance.delete(`/api/manual/faqs/${id}`);
      toast.success('FAQ berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus FAQ');
    }
  };

  // Open modals
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingItem(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'BookOpenIcon',
        order: category.order
      });
    } else {
      setEditingItem(null);
      setCategoryForm({ name: '', description: '', icon: 'BookOpenIcon', order: 0 });
    }
    setModalType('category');
  };

  const openArticleModal = (article?: Article) => {
    if (article) {
      setEditingItem(article);
      setArticleForm({
        category_id: article.category_id,
        title: article.title,
        summary: article.summary || '',
        content: article.content || '',
        order: article.order,
        is_published: article.is_published
      });
    } else {
      setEditingItem(null);
      setArticleForm({
        category_id: categories[0]?.id || 0,
        title: '',
        summary: '',
        content: '',
        order: 0,
        is_published: true
      });
    }
    setModalType('article');
  };

  const openFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingItem(faq);
      setFaqForm({
        category_id: faq.category_id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        is_published: faq.is_published
      });
    } else {
      setEditingItem(null);
      setFaqForm({
        category_id: categories[0]?.id || 0,
        question: '',
        answer: '',
        order: 0,
        is_published: true
      });
    }
    setModalType('faq');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/manual')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kelola User Manual
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Buat dan kelola dokumentasi sistem
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/manual')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <EyeIcon className="h-5 w-5" />
            Lihat Manual
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FolderIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_categories}</p>
                  <p className="text-sm text-gray-500">Kategori</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_articles}</p>
                  <p className="text-sm text-gray-500">Artikel</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_faqs}</p>
                  <p className="text-sm text-gray-500">FAQ</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.popular_articles?.[0]?.views || 0}
                  </p>
                  <p className="text-sm text-gray-500">Top Views</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'articles', label: 'Artikel', icon: DocumentTextIcon, count: articles.length },
                { id: 'categories', label: 'Kategori', icon: FolderIcon, count: categories.length },
                { id: 'faqs', label: 'FAQ', icon: QuestionMarkCircleIcon, count: faqs.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Kategori</h3>
                  <button
                    onClick={() => openCategoryModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Tambah Kategori
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artikel</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urutan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {categories.map(category => (
                        <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{category.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{category.description || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{category.article_count}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{category.order}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openCategoryModal(category)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <TrashIcon className="h-4 w-4" />
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

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Artikel</h3>
                  <button
                    onClick={() => openArticleModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Tambah Artikel
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {articles.map(article => (
                        <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{article.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{article.summary}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{article.category_name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{article.view_count}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              article.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {article.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/app/manual/article/${article.slug}`)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openArticleModal(article)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(article.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <TrashIcon className="h-4 w-4" />
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

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar FAQ</h3>
                  <button
                    onClick={() => openFaqModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Tambah FAQ
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pertanyaan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {faqs.map(faq => (
                        <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{faq.question}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{faq.category_name || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              faq.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {faq.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openFaqModal(faq)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <TrashIcon className="h-4 w-4" />
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
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {modalType === 'category' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setModalType(null)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
                <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Nama kategori"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Deskripsi kategori"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {modalType === 'article' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setModalType(null)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Edit Artikel' : 'Tambah Artikel'}
                </h3>
                <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                  <select
                    value={articleForm.category_id}
                    onChange={(e) => setArticleForm({ ...articleForm, category_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value={0}>Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Judul artikel"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ringkasan</label>
                  <input
                    type="text"
                    value={articleForm.summary}
                    onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Ringkasan singkat artikel"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Konten (Markdown)
                  </label>
                  <textarea
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
                    rows={15}
                    placeholder="Tulis konten dengan format Markdown..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={articleForm.order}
                    onChange={(e) => setArticleForm({ ...articleForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={articleForm.is_published}
                      onChange={(e) => setArticleForm({ ...articleForm, is_published: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish artikel</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveArticle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {modalType === 'faq' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setModalType(null)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingItem ? 'Edit FAQ' : 'Tambah FAQ'}
                </h3>
                <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                  <select
                    value={faqForm.category_id}
                    onChange={(e) => setFaqForm({ ...faqForm, category_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value={0}>Umum</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pertanyaan</label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Pertanyaan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jawaban (Markdown)
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={6}
                    placeholder="Jawaban..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan</label>
                    <input
                      type="number"
                      value={faqForm.order}
                      onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={faqForm.is_published}
                      onChange={(e) => setFaqForm({ ...faqForm, is_published: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveFaq}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAdmin;
