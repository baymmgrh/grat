import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface FAQ {
  id: number;
  category_id: number;
  category_name: string;
  question: string;
  answer: string;
  order: number;
}

interface Category {
  id: number;
  name: string;
}

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [faqsRes, categoriesRes] = await Promise.all([
          axiosInstance.get('/api/manual/faqs'),
          axiosInstance.get('/api/manual/categories')
        ]);
        setFaqs(faqsRes.data.faqs || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFaq = (faqId: number) => {
    setExpandedFaqs(prev =>
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || faq.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const categoryName = faq.category_name || 'Umum';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/manual')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Kembali ke Manual
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <QuestionMarkCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pertanyaan Umum (FAQ)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Temukan jawaban untuk pertanyaan yang sering diajukan
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQ List */}
        {Object.keys(groupedFaqs).length === 0 ? (
          <div className="text-center py-12">
            <QuestionMarkCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Tidak ada FAQ yang cocok dengan pencarian' : 'Belum ada FAQ'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFaqs).map(([categoryName, categoryFaqs]) => (
              <div key={categoryName}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  {categoryName}
                </h2>
                <div className="space-y-3">
                  {categoryFaqs.map(faq => (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-white pr-4">
                          {faq.question}
                        </span>
                        {expandedFaqs.includes(faq.id) ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaqs.includes(faq.id) && (
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="manual-content text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {faq.answer}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {filteredFaqs.length} dari {faqs.length} FAQ
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
