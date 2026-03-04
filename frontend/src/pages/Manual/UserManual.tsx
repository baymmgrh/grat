import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  CubeIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  article_count: number;
}

interface Article {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  order: number;
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
}

interface SearchResult {
  type: 'article' | 'faq';
  id: number;
  title: string;
  summary: string;
  category: string;
  slug?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpenIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
};

const UserManual: React.FC = () => {
  const navigate = useNavigate();
  const { categorySlug, articleSlug } = useParams();
  const [searchParams] = useSearchParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/api/manual/categories');
        setCategories(response.data.categories || []);
        // Expand all categories by default
        setExpandedCategories(response.data.categories?.map((c: Category) => c.id) || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch articles based on category
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const params = selectedCategory ? { category_id: selectedCategory.id } : {};
        const response = await axiosInstance.get('/api/manual/articles', { params });
        setArticles(response.data.articles || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [selectedCategory]);

  // Fetch FAQs
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await axiosInstance.get('/api/manual/faqs');
        setFaqs(response.data.faqs || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      }
    };
    fetchFaqs();
  }, []);

  // Fetch single article by slug
  useEffect(() => {
    const fetchArticle = async () => {
      if (articleSlug) {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/api/manual/articles/slug/${articleSlug}`);
          setCurrentArticle(response.data.article);
        } catch (error) {
          console.error('Error fetching article:', error);
          setCurrentArticle(null);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentArticle(null);
      }
    };
    fetchArticle();
  }, [articleSlug]);

  // Handle search
  useEffect(() => {
    const searchManual = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        const response = await axiosInstance.get('/api/manual/search', {
          params: { q: searchQuery }
        });
        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounce = setTimeout(searchManual, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleFaq = (faqId: number) => {
    setExpandedFaqs(prev =>
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || BookOpenIcon;
    return IconComponent;
  };

  const getArticlesByCategory = (categoryId: number) => {
    return articles.filter(a => a.category_id === categoryId);
  };

  // Render sidebar
  const renderSidebar = () => (
    <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0`}>
      <div className="h-full overflow-y-auto p-4">
        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari dokumentasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Hasil Pencarian
            </h4>
            {isSearching ? (
              <p className="text-sm text-gray-500">Mencari...</p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => {
                      if (result.type === 'article' && result.slug) {
                        navigate(`/app/manual/article/${result.slug}`);
                      }
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {result.type === 'article' ? (
                        <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <QuestionMarkCircleIcon className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {result.category}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tidak ada hasil</p>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
            <BookOpenIcon className="h-4 w-4 mr-2" />
            Kategori
          </h4>
          
          {categories.map(category => {
            const IconComponent = getIconComponent(category.icon);
            const categoryArticles = getArticlesByCategory(category.id);
            const isExpanded = expandedCategories.includes(category.id);
            
            return (
              <div key={category.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                      {category.article_count}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && categoryArticles.length > 0 && (
                  <div className="ml-7 mt-1 space-y-1">
                    {categoryArticles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => navigate(`/app/manual/article/${article.slug}`)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                          currentArticle?.id === article.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
              FAQ
            </h4>
            <button
              onClick={() => navigate('/app/manual/faq')}
              className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-400"
            >
              Lihat semua FAQ ({faqs.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render article content
  const renderArticleContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (currentArticle) {
      return (
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/app/manual')} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              <HomeIcon className="h-4 w-4" />
              Manual
            </button>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{currentArticle.category_name}</span>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 dark:text-white font-medium">{currentArticle.title}</span>
          </nav>

          {/* Article Header */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-3xl font-bold mb-4">
              {currentArticle.title}
            </h1>
            {currentArticle.summary && (
              <p className="text-lg text-blue-100 mb-6">
                {currentArticle.summary}
              </p>
            )}
            <div className="flex items-center gap-6 text-sm text-blue-200">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <EyeIcon className="h-4 w-4" />
                {currentArticle.view_count} views
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <ClockIcon className="h-4 w-4" />
                {new Date(currentArticle.updated_at).toLocaleDateString('id-ID')}
              </span>
              {currentArticle.author && (
                <span className="bg-white/10 px-3 py-1.5 rounded-full">Oleh: {currentArticle.author}</span>
              )}
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="manual-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentArticle.content || ''}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      );
    }

    // Home view - show all categories
    return (
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm shadow-lg">
              <BookOpenIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4">
              User Manual
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Dokumentasi lengkap untuk sistem ERP PT. Gratia Makmur Sentosa
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <span className="bg-white/20 px-4 py-2 rounded-full">{categories.length} Kategori</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">{articles.length} Artikel</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">{faqs.length} FAQ</span>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="max-w-2xl mx-auto mb-12 -mt-6 relative z-20">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-500" />
            <input
              type="text"
              placeholder="Cari panduan, tutorial, atau FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg shadow-xl transition-all"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category);
                  toggleCategory(category.id);
                }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.article_count} artikel
                    </p>
                  </div>
                </div>
                {category.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {category.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <QuestionMarkCircleIcon className="h-8 w-8 text-green-600" />
              Pertanyaan Umum (FAQ)
            </h2>
            <div className="space-y-4">
              {faqs.slice(0, 5).map(faq => (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {expandedFaqs.includes(faq.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedFaqs.includes(faq.id) && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="manual-content text-sm pt-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {faq.answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {faqs.length > 5 && (
              <button
                onClick={() => navigate('/app/manual/faq')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat semua FAQ →
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        {sidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {renderArticleContent()}
      </div>
    </div>
  );
};

export default UserManual;
