import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Download, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Image as ImageIcon,
  Type,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getUserHistory, 
  deleteGeneration, 
  reproduceGeneration,
  searchHistory,
  getUserStats 
} from "@/api/history-client";

export default function HistoryStep({ sessionId, onSelectGeneration, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Load user history
  const loadHistory = async (page = 1, search = '') => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      let response;
      
      if (search.trim()) {
        response = await searchHistory(sessionId, {
          query: search,
          type: selectedFilter === 'all' ? undefined : selectedFilter,
          page,
          limit: 12
        });
      } else {
        response = await getUserHistory(sessionId, {
          page,
          limit: 12,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
      }
      
      setHistory(response.data || []);
      setPagination(response.pagination || {});
      
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    }
    setLoading(false);
  };

  // Load user stats
  const loadStats = async () => {
    if (!sessionId) return;
    
    try {
      const response = await getUserStats(sessionId);
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [sessionId]);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadHistory(1, searchQuery);
  };

  // Delete generation
  const handleDelete = async (generationId) => {
    if (!confirm('Удалить эту генерацию из истории?')) return;
    
    try {
      await deleteGeneration(generationId, sessionId);
      loadHistory(currentPage, searchQuery); // Reload current page
    } catch (error) {
      console.error('Failed to delete generation:', error);
      alert('Ошибка при удалении генерации');
    }
  };

  // Continue editing
  const handleContinueEditing = async (generationId) => {
    try {
      const response = await reproduceGeneration(generationId, sessionId);
      if (onSelectGeneration) {
        onSelectGeneration(response.data);
      }
    } catch (error) {
      console.error('Failed to reproduce generation:', error);
      alert('Ошибка при загрузке настроек генерации');
    }
  };

  // Download banner
  const downloadBanner = (bannerUrl, generationId, index) => {
    const link = document.createElement('a');
    link.href = bannerUrl;
    link.download = `banner-${generationId}-${index + 1}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all banners from generation
  const downloadAllBanners = (generation) => {
    if (!generation.bannersData || generation.bannersData.length === 0) {
      alert('Нет баннеров для скачивания');
      return;
    }

    generation.bannersData.forEach((banner, index) => {
      if (banner.imageUrl) {
        setTimeout(() => {
          downloadBanner(banner.imageUrl, generation.id, index);
        }, index * 500); // Небольшая задержка между скачиваниями
      }
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get template color
  const getTemplateColor = (template) => {
    return template === 'blue_white' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="step-header mb-6">
        <div className="step-number"><History className="w-5 h-5" /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">История генераций</h2>
          <p className="text-gray-600">Все ваши созданные баннеры сохранены здесь</p>
        </div>
      </div>

      <Card className="step-card mb-6">
        <CardContent className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Популярные шрифты */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Шрифты
              </h3>
              <div className="space-y-2">
                {stats.fonts?.length > 0 ? stats.fonts.map(([font, count], index) => (
                  <div key={font} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 capitalize">{font}</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">Нет данных</div>
                )}
              </div>
            </div>

            {/* Популярные сайты */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Сайты
              </h3>
              <div className="space-y-2">
                {stats.sites?.length > 0 ? stats.sites.map(([site, count], index) => (
                  <div key={site} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-2">{site}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">Нет данных</div>
                )}
              </div>
            </div>

            {/* Популярные модели */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Модели ИИ
              </h3>
              <div className="space-y-2">
                {stats.models?.length > 0 ? stats.models.map(([model, count], index) => (
                  <div key={model} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{model}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </div>
                )) : (
                  <div className="text-gray-500 text-sm">Нет данных</div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по заголовкам, URL..."
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Все</option>
              <option value="headline">По заголовкам</option>
              <option value="url">По URL</option>
              <option value="template">По стилю</option>
            </select>
          </div>

          {/* History Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  Загрузка истории...
                </div>
              </motion.div>
            ) : history.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Ничего не найдено' : 'История пуста'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Создайте первые баннеры, чтобы они появились здесь'
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {history.map((generation, index) => (
                  <motion.div
                    key={generation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-2 border-gray-200 hover:border-purple-300 transition-all rounded-xl">
                      <CardContent className="p-4">
                        {/* Generation Info */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getTemplateColor(generation.template)}>
                              {generation.template === 'blue_white' ? 'Синий' : 'Красный'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {generation.size}
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                            {generation.selectedHeadline}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(generation.timestamp)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Globe className="w-3 h-3" />
                            <span className="truncate">{new URL(generation.url).hostname}</span>
                          </div>
                        </div>

                        {/* Preview Image */}
                        {generation.previewImage && (
                          <div className="mb-4">
                            <img
                              src={generation.previewImage}
                              alt={`Превью баннера: ${generation.selectedHeadline.substring(0, 50)}...`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {generation.bannersCount} баннеров
                          </div>
                          <div className="flex items-center gap-1">
                            <Type className="w-3 h-3" />
                            {generation.language}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleContinueEditing(generation.id)}
                            className="flex-1 h-8 text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Редактировать
                          </Button>
                          
                          {generation.bannersData && generation.bannersData.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadAllBanners(generation)}
                              className="h-8 px-2"
                              title="Скачать все баннеры"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(generation.id)}
                            className="h-8 px-2"
                            title="Удалить генерацию"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Страница {pagination.page} из {pagination.totalPages} 
                ({pagination.total} всего)
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    loadHistory(newPage, searchQuery);
                  }}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    loadHistory(newPage, searchQuery);
                  }}
                  disabled={currentPage >= pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center mt-6">
            <Button onClick={onBack} variant="outline" className="px-8">
              Вернуться к созданию
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}