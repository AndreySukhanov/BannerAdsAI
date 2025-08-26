
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Check, ArrowRight, ArrowLeft, Target, Edit3, Save, X, Type, Image } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { generateHeadlines as generateHeadlinesMultiAgent, regenerateHeadlines } from "@/api/multi-agent-client";
import BannerPreview from "@/components/ui/BannerPreview";

export default function HeadlineStep({ config, setConfig, sessionId, onNext, onBack }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [headlines, setHeadlines] = useState(config.generated_headlines || []);
  const [selectedHeadline, setSelectedHeadline] = useState(config.selected_headline || '');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackForHeadline, setFeedbackForHeadline] = useState(null);

  const generateHeadlines = useCallback(async () => {
    setIsGenerating(true);
    try {
      console.log('Generating headlines using multi-agent system...');
      
      const result = await generateHeadlinesMultiAgent({
        url: config.url,
        template: config.template,
        sessionId: sessionId
      });
      
      // Extract text from headline objects
      const cleanHeadlines = result.headlines.map(h => h.text.toUpperCase());
      
      setHeadlines(cleanHeadlines);
      setConfig({
        ...config,
        generated_headlines: cleanHeadlines,
        webContent: result.webContent,
        taskId: result.taskId,
        status: 'selecting_headline'
      });
      
      console.log('Headlines generated successfully:', cleanHeadlines);
    } catch (error) {
      console.error('Ошибка генерации заголовков:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message.includes('Failed to generate headlines:') 
        ? error.message.replace('Failed to generate headlines: ', '')
        : 'Произошла ошибка при генерации заголовков. Проверьте ссылку и попробуйте снова.';
      
      alert(errorMessage);
    }
    setIsGenerating(false);
  }, [config, setConfig]);

  useEffect(() => {
    if (!headlines.length && !isGenerating) {
      generateHeadlines();
    }
  }, [headlines.length, isGenerating, generateHeadlines]);

  const selectHeadline = (headline) => {
    setSelectedHeadline(headline);
    setConfig({
      ...config,
      selected_headline: headline
    });
  };

  const startEditing = (index, headline) => {
    setEditingIndex(index);
    setEditedHeadline(headline);
  };

  const saveEdit = (index) => {
    const updatedHeadlines = [...headlines];
    updatedHeadlines[index] = editedHeadline.toUpperCase();
    setHeadlines(updatedHeadlines);
    
    // Update config
    setConfig({
      ...config,
      generated_headlines: updatedHeadlines
    });
    
    // If this was the selected headline, update it too
    if (selectedHeadline === headlines[index]) {
      setSelectedHeadline(editedHeadline.toUpperCase());
      setConfig({
        ...config,
        generated_headlines: updatedHeadlines,
        selected_headline: editedHeadline.toUpperCase()
      });
    }
    
    setEditingIndex(null);
    setEditedHeadline('');
  };

  const handleRegenerateHeadline = async (headlineIndex) => {
    if (!feedbackText.trim()) {
      alert('Пожалуйста, введите пожелания для улучшения заголовка');
      return;
    }

    setIsRegenerating(true);
    try {
      console.log('Regenerating headline with feedback:', feedbackText, 'for headline:', headlines[headlineIndex]);
      
      const result = await regenerateHeadlines({
        url: config.url,
        template: config.template,
        currentHeadlines: [headlines[headlineIndex]], // Только один выбранный заголовок
        userFeedback: feedbackText,
        webContent: config.webContent,
        sessionId: sessionId
      });
      
      // Extract text from headline objects
      const cleanHeadlines = result.headlines.map(h => h.text.toUpperCase());
      
      setHeadlines(cleanHeadlines);
      setConfig({
        ...config,
        generated_headlines: cleanHeadlines,
        webContent: result.webContent,
        taskId: result.taskId
      });
      
      setShowFeedbackInput(false);
      setFeedbackText('');
      setFeedbackForHeadline(null);
      console.log('Headline regenerated successfully:', cleanHeadlines);
      
    } catch (error) {
      console.error('Ошибка регенерации заголовка:', error);
      alert('Произошла ошибка при регенерации заголовка. Попробуйте снова.');
    }
    setIsRegenerating(false);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedHeadline('');
  };

  const getClickabilityScore = (headline) => {
    const triggers = [
      'скидка', 'бесплатно', 'экономьте', 'увеличьте', 'получите', 'улучшите',
      'профессиональный', 'качественный', 'надежный', 'быстро', 'эффективно',
      'консультация', 'решение', 'выгода', 'предложение', '%', 'забудьте',
      'не тратьте', 'устали', 'начните', 'воспользуйтесь', 'сегодня', 'сейчас',
      'off', 'free', 'save', 'increase', 'get', 'improve', 'professional',
      'quality', 'reliable', 'fast', 'effective', 'consultation', 'solution',
      'benefit', 'offer', 'don\'t waste', 'tired', 'start', 'use', 'today', 'now'
    ];
    
    const lowerHeadline = headline.toLowerCase();
    const score = triggers.filter(trigger => lowerHeadline.includes(trigger)).length;
    
    if (score >= 3) return { label: 'Высокая', color: 'bg-green-100 text-green-800' };
    if (score >= 2) return { label: 'Средняя', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Базовая', color: 'bg-gray-100 text-gray-800' };
  };

  const getHeadlineStyle = (index) => {
    const styles = [
      { label: 'Прямая выгода', color: 'bg-purple-100 text-purple-800' },
      { label: 'Решение проблемы', color: 'bg-orange-100 text-orange-800' },
      { label: 'Призыв к действию', color: 'bg-green-100 text-green-800' }
    ];
    return styles[index] || styles[0];
  };

  return (
    <div>
      {/* Шаг 4: Выбор заголовка */}
      <div className="step-header mb-6">
        <div className="step-number">4</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Выберите заголовок</h2>
          <p className="text-gray-600">ИИ создал эффективные заголовки в разных стилях для вашего баннера</p>
        </div>
      </div>

      <Card className="step-card mb-8">
        <CardContent className="p-6">
          {/* Конфигурация */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="secondary" className="px-4 py-2">{config.size}</Badge>
            <Badge variant="secondary" className="px-4 py-2">
              {config.template === 'blue_white' ? 'Синий стиль' : 'Красный стиль'}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 truncate max-w-xs">
              {new URL(config.url).hostname}
            </Badge>
          </div>

          {/* Информация о заголовках */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Заголовки в разных стилях</span>
            </div>
            <p className="text-sm text-blue-700">
              Каждый заголовок использует свой маркетинговый подход для максимальной эффективности.
              Нажмите на иконку редактирования, чтобы изменить текст.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="relative mb-6">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Создаем заголовки</h3>
                <p className="text-gray-500">ИИ анализирует вашу страницу и создает подходящие заголовки в разных стилях</p>
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="headlines"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4 mb-6"
              >
                {headlines.map((headline, index) => {
                  const clickability = getClickabilityScore(headline);
                  const style = getHeadlineStyle(index);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => editingIndex !== index && selectHeadline(headline)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all hover:shadow-lg cursor-pointer ${
                        selectedHeadline === headline
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                          selectedHeadline === headline
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedHeadline === headline && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          {editingIndex === index ? (
                            <div className="space-y-3">
                              <Input
                                value={editedHeadline}
                                onChange={(e) => setEditedHeadline(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editedHeadline.trim()) {
                                    saveEdit(index);
                                  }
                                  if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                placeholder="Введите заголовок..."
                                className="font-medium text-base"
                                autoFocus
                                maxLength={100}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(index)}
                                  disabled={!editedHeadline.trim()}
                                  className="h-8"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Сохранить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  className="h-8"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <p className="font-medium text-gray-900 text-base leading-tight flex-1 pr-2">
                                  {headline}
                                </p>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(index, headline);
                                    }}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackForHeadline(index);
                                      setShowFeedbackInput(true);
                                    }}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-green-600"
                                  >
                                    <Target className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500">{headline.length}/100 символов</span>
                                  <Badge className={`${clickability.color} font-medium`}>
                                    {clickability.label}
                                  </Badge>
                                  <Badge className={`${style.color} font-medium`}>
                                    {style.label}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Вариант {index + 1}
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Font Selection */}
          {selectedHeadline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-indigo-600" />
                <Label className="text-base font-semibold text-gray-900">
                  Выберите шрифт для заголовка
                </Label>
              </div>
              
              <Select 
                value={config.font || 'roboto'} 
                onValueChange={(value) => setConfig({...config, font: value})}
              >
                <SelectTrigger className="h-12 text-base border-gray-200 focus:border-indigo-500 rounded-xl bg-white">
                  <SelectValue placeholder="Выберите шрифт" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="roboto" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900" style={{fontFamily: 'Roboto, sans-serif'}}>Roboto</div>
                      <div className="text-sm text-gray-500">Современный, читаемый</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="inter" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>Inter</div>
                      <div className="text-sm text-gray-500">Универсальный, чистый</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="montserrat" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900" style={{fontFamily: 'Montserrat, sans-serif'}}>Montserrat</div>
                      <div className="text-sm text-gray-500">Элегантный, привлекательный</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="opensans" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900" style={{fontFamily: 'Open Sans, sans-serif'}}>Open Sans</div>
                      <div className="text-sm text-gray-500">Дружелюбный, доступный</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-gray-600">
                Выбранный шрифт будет применен к заголовку на всех баннерах
              </p>
            </motion.div>
          )}

          {/* Image Model Selection */}
          {selectedHeadline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100"
            >
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-green-600" />
                <Label className="text-base font-semibold text-gray-900">
                  Выберите модель генерации изображений
                </Label>
              </div>
              
              <Select 
                value={config.imageModel || 'recraftv3'} 
                onValueChange={(value) => {
                  console.log('Setting imageModel to:', value);
                  setConfig({...config, imageModel: value});
                }}
              >
                <SelectTrigger className="h-12 text-base border-gray-200 focus:border-green-500 rounded-xl bg-white">
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="recraftv3" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Recraft V3</div>
                      <div className="text-sm text-gray-500">Универсальная модель высокого качества</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="realistic" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Realistic</div>
                      <div className="text-sm text-gray-500">Фотореалистичные изображения</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="digital_illustration" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Digital Illustration</div>
                      <div className="text-sm text-gray-500">Яркие рекламные иллюстрации</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="vector_illustration" className="p-4 rounded-lg">
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Vector Art</div>
                      <div className="text-sm text-gray-500">Чистые геометрические формы</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-gray-600">
                Выбранная модель будет использована для создания фоновых изображений баннеров
              </p>
            </motion.div>
          )}

          {/* Real-time Banner Preview */}
          {selectedHeadline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Предпросмотр баннера
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Live Preview
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    {config.size} - {config.template === 'blue_white' ? 'Синий стиль' : 'Красный стиль'}
                  </div>
                  <BannerPreview
                    headline={editingIndex !== null ? editedHeadline : selectedHeadline}
                    font={config.font || 'roboto'}
                    template={config.template}
                    size={config.size}
                    className="w-full max-w-sm"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Детали предпросмотра</div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Заголовок:</span>
                      <span className="font-medium">
                        {(editingIndex !== null ? editedHeadline : selectedHeadline).length} символов
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Шрифт:</span>
                      <span className="font-medium">{config.font || 'roboto'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Размер:</span>
                      <span className="font-medium">{config.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Стиль:</span>
                      <span className="font-medium">
                        {config.template === 'blue_white' ? 'Деловой' : 'Энергичный'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-700">
                      💡 Это предварительный просмотр. Финальные баннеры будут созданы с уникальными AI-изображениями фона.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Feedback Input for Regeneration */}
          <AnimatePresence>
            {showFeedbackInput && feedbackForHeadline !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 border border-green-200 rounded-xl bg-green-50"
              >
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Как улучшить заголовок "{headlines[feedbackForHeadline]?.substring(0, 50)}..."?
                </Label>
                <p className="text-xs text-gray-500 mb-3">
                  Например: "сделать более агрессивным", "добавить юмор", "более профессионально", "проще для понимания"
                </p>
                <div className="flex gap-2">
                  <Input
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Опишите ваши пожелания..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRegenerateHeadline(feedbackForHeadline);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleRegenerateHeadline(feedbackForHeadline)}
                    disabled={isRegenerating || !feedbackText.trim()}
                    className="px-6"
                  >
                    {isRegenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Применить'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFeedbackInput(false);
                      setFeedbackText('');
                      setFeedbackForHeadline(null);
                    }}
                    className="px-4"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="h-12 px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            
            <Button
              variant="outline"
              onClick={generateHeadlines}
              disabled={isGenerating || isRegenerating}
              className="flex-1 h-12"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Создать новые варианты
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!selectedHeadline}
              className="flex-1 h-12 gradient-button"
            >
              Создать баннеры
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
