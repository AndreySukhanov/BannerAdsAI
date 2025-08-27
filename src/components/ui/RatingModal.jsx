import React, { useState } from 'react';
import { X, MessageSquare, Tag } from 'lucide-react';
import StarRating from './StarRating';
import { Button } from './button';

const RatingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  bannerData,
  isSubmitting = false
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const quickTags = [
    'Отличное качество',
    'Хорошие цвета',
    'Подходящий шрифт',
    'Удачная композиция',
    'Слишком яркий',
    'Плохо читается',
    'Неподходящий стиль',
    'Низкое качество',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку от 1 до 5 звезд');
      return;
    }

    const ratingData = {
      rating,
      feedback: feedback.trim(),
      tags: selectedTags,
      context: bannerData
    };

    try {
      await onSubmit(ratingData);
      // Сброс формы
      setRating(0);
      setFeedback('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Оцените баннер
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Как вам понравился сгенерированный баннер?
              </p>
              <StarRating
                value={rating}
                onChange={setRating}
                size={32}
                className="justify-center"
              />
            </div>

            {/* Quick Tags */}
            {rating > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Быстрые теги (необязательно):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`
                        px-3 py-1 text-xs rounded-full border transition-colors
                        ${selectedTags.includes(tag)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {rating > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Комментарий (необязательно):
                  </span>
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Поделитесь своими впечатлениями о баннере..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {feedback.length}/500
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Пропустить
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;