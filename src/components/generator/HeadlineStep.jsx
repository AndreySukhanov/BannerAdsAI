
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Check, ArrowRight, ArrowLeft, Target, Edit3, Save, X, Type, Image, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { generateHeadlines as generateHeadlinesMultiAgent, regenerateHeadlines } from "@/api/multi-agent-client";
import BannerPreview from "@/components/ui/BannerPreview";

export default function HeadlineStep({ config, setConfig, sessionId, onNext, onBack }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [headlines, setHeadlines] = useState(() => {
    // Если это восстановленная конфигурация (редактирование), начинаем с сохранённого заголовка
    if (config._isRestored && config.selected_headline) {
      return [config.selected_headline];
    }
    return config.generated_headlines || [];
  });
  const [selectedHeadline, setSelectedHeadline] = useState(config.selected_headline || '');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackForHeadline, setFeedbackForHeadline] = useState(null);

  // Для брендированного шаблона - выбор варианта размещения текста
  const [selectedVariant, setSelectedVariant] = useState(config.selectedVariant || 1);

  const isBrandedTemplate = config.template === 'branded';

  // Debug logs
  console.log('[HeadlineStep] isBrandedTemplate:', isBrandedTemplate);
  console.log('[HeadlineStep] config.template:', config.template);
  console.log('[HeadlineStep] selectedHeadline:', selectedHeadline);
  console.log('[HeadlineStep] selectedVariant:', selectedVariant);

  const generateHeadlines = useCallback(async () => {
    setIsGenerating(true);
    try {
      console.log('Generating headlines using multi-agent system...');
      
      const result = await generateHeadlinesMultiAgent({
        url: config.url,
        template: config.template,
        sessionId: sessionId,
        brandingData: config.brandingData,
        useBrandStyle: config.useBrandStyle
      });
      
      
      // Keep full headline objects with translation data
      // Применяем uppercase только для шаблонов, которые этого требуют
      const shouldApplyUppercase = config.template !== 'branded';
      const processedHeadlines = result.headlines.map(h => ({
        text: shouldApplyUppercase 
          ? (h.text?.toUpperCase() || h.toUpperCase())
          : (h.text || h),
        language: h.language || 'ru',
        russianTranslation: h.russianTranslation
      }));
      
      // Если это режим редактирования, объединяем с существующими заголовками
      const finalHeadlines = (config._isRestored && headlines.length > 0) 
        ? [...headlines, ...processedHeadlines.slice(0, 2)] // Ограничиваем до 2 новых заголовков
        : processedHeadlines;
        
      setHeadlines(finalHeadlines);
      setConfig({
        ...config,
        generated_headlines: finalHeadlines,
        webContent: result.webContent,
        taskId: result.taskId,
        status: 'selecting_headline'
      });
      
      console.log('Headlines generated successfully:', processedHeadlines);
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
    // Генерируем заголовки если их нет совсем, или если это режим редактирования и у нас только 1 заголовок
    const needsGeneration = (!headlines.length) || 
      (config._isRestored && headlines.length === 1 && !isGenerating);
    
    if (needsGeneration && !isGenerating) {
      generateHeadlines();
    }
  }, [headlines.length, isGenerating, generateHeadlines, config._isRestored]);

  const selectHeadline = (headline) => {
    const headlineText = typeof headline === 'string' ? headline : headline.text;
    setSelectedHeadline(headlineText);
    setConfig({
      ...config,
      selected_headline: headlineText,
      selected_headline_object: headline,
      selectedVariant: isBrandedTemplate ? selectedVariant : undefined
    });
  };

  const selectVariant = (variant) => {
    setSelectedVariant(variant);
    setConfig({
      ...config,
      selectedVariant: variant
    });
  };

  const startEditing = (index, headline) => {
    setEditingIndex(index);
    const headlineText = typeof headline === 'string' ? headline : headline.text;
    setEditedHeadline(headlineText);
  };

  const saveEdit = (index) => {
    const updatedHeadlines = [...headlines];
    const originalHeadline = headlines[index];
    const headlineText = typeof originalHeadline === 'string' ? originalHeadline : originalHeadline.text;
    
    // Применяем uppercase только для шаблонов, которые этого требуют
    const shouldApplyUppercase = config.template !== 'branded';
    const processedEditedHeadline = shouldApplyUppercase ? editedHeadline.toUpperCase() : editedHeadline;
    
    // Update the headline while preserving translation data
    updatedHeadlines[index] = typeof originalHeadline === 'string' 
      ? processedEditedHeadline
      : {
          ...originalHeadline,
          text: processedEditedHeadline
        };
    
    setHeadlines(updatedHeadlines);
    
    // Update config
    setConfig({
      ...config,
      generated_headlines: updatedHeadlines
    });
    
    // If this was the selected headline, update it too
    if (selectedHeadline === headlineText) {
      setSelectedHeadline(processedEditedHeadline);
      setConfig({
        ...config,
        generated_headlines: updatedHeadlines,
        selected_headline: processedEditedHeadline,
        selected_headline_object: updatedHeadlines[index]
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
      const currentHeadline = headlines[headlineIndex];
      const currentHeadlineText = typeof currentHeadline === 'string' ? currentHeadline : currentHeadline.text;
      console.log('Regenerating headline with feedback:', feedbackText, 'for headline:', currentHeadlineText);
      
      const result = await regenerateHeadlines({
        url: config.url,
        template: config.template,
        currentHeadlines: [currentHeadlineText], // Только один выбранный заголовок
        userFeedback: feedbackText,
        webContent: config.webContent,
        sessionId: sessionId
      });
      
      // Keep full headline objects with translation data for regenerated headlines
      // Применяем uppercase только для шаблонов, которые этого требуют
      const shouldApplyUppercase = config.template !== 'branded';
      const processedHeadlines = result.headlines.map(h => ({
        text: shouldApplyUppercase 
          ? (h.text?.toUpperCase() || h.toUpperCase())
          : (h.text || h),
        language: h.language || 'ru',
        russianTranslation: h.russianTranslation
      }));
      
      setHeadlines(processedHeadlines);
      setConfig({
        ...config,
        generated_headlines: processedHeadlines,
        webContent: result.webContent,
        taskId: result.taskId
      });
      
      setShowFeedbackInput(false);
      setFeedbackText('');
      setFeedbackForHeadline(null);
      console.log('Headline regenerated successfully:', processedHeadlines);
      
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
          <h2 className="text-xl font-bold text-gray-900">
            {isBrandedTemplate ? 'Выберите заголовок и стиль размещения' : 'Выберите заголовок и изображение'}
          </h2>
          <p className="text-gray-600">
            {isBrandedTemplate
              ? 'ИИ создал эффективные заголовки и варианты размещения текста для брендированного баннера'
              : 'ИИ создал эффективные заголовки в разных стилях для вашего баннера'
            }
          </p>
        </div>
      </div>

      <Card className="step-card mb-8">
        <CardContent className="p-6">
          {/* Конфигурация */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="secondary" className="px-4 py-2">{config.size}</Badge>
            <Badge variant="secondary" className="px-4 py-2">
              {isBrandedTemplate ? 'Брендированный стиль' :
               config.template === 'blue_white' ? 'Синий стиль' : 'Красный стиль'}
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
                  const headlineText = typeof headline === 'string' ? headline : headline.text;
                  const headlineLanguage = typeof headline === 'string' ? 'ru' : headline.language;
                  const russianTranslation = typeof headline === 'string' ? null : headline.russianTranslation;
                  const clickability = getClickabilityScore(headlineText);
                  const style = getHeadlineStyle(index);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => editingIndex !== index && selectHeadline(headline)}
                      className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg cursor-pointer ${
                        selectedHeadline === headlineText
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                          selectedHeadline === headlineText
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedHeadline === headlineText && <Check className="w-4 h-4 text-white" />}
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
                                <div className="flex-1 pr-2">
                                  <p className="font-medium text-gray-900 text-base leading-tight">
                                    {headlineText}
                                  </p>
                                  {russianTranslation && headlineLanguage !== 'ru' && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-1 mb-1">
                                        <span className="text-xs font-medium text-blue-600">Перевод:</span>
                                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5">
                                          {headlineLanguage === 'en' ? 'EN' : headlineLanguage.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-blue-800 leading-tight">
                                        {russianTranslation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(index, headline);
                                    }}
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all"
                                    title="Редактировать заголовок"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackForHeadline(index);
                                      setShowFeedbackInput(true);
                                    }}
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-green-100 text-green-600 hover:text-green-700 transition-all flex items-center justify-center"
                                    title="Улучшить заголовок"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500">{headlineText.length}/100 символов</span>
                                  <Badge className={`${clickability.color} font-medium pointer-events-none`}>
                                    {clickability.label}
                                  </Badge>
                                  <Badge className={`${style.color} font-medium pointer-events-none`}>
                                    {style.label}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs pointer-events-none">
                                  Вариант {index + 1}
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Feedback Input for specific headline */}
                      <AnimatePresence>
                        {showFeedbackInput && feedbackForHeadline === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 border border-green-200 rounded-xl bg-green-50"
                          >
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Как улучшить заголовок "{headlineText.substring(0, 50)}..."?
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
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Font Selection - только для стандартных шаблонов */}
          {selectedHeadline && !isBrandedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
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

          {/* Image Model Selection - только для стандартных шаблонов */}
          {selectedHeadline && !isBrandedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 mt-6"
            >
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-indigo-600" />
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

          {/* Выбор варианта размещения текста - только для брендированного шаблона */}
          {selectedHeadline && isBrandedTemplate && (
            console.log('[HeadlineStep] Showing variant selection UI') || true) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mt-6"
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-blue-600" />
                <Label className="text-base font-semibold text-gray-900">
                  Выберите стиль размещения текста
                </Label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((variant) => (
                  <div
                    key={variant}
                    onClick={() => selectVariant(variant)}
                    className={`relative rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                      selectedVariant === variant
                        ? 'border-red-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Preview баннера */}
                    <div className="p-4">
                      <BannerPreview
                        headline={selectedHeadline}
                        template="branded"
                        variant={variant}
                        size={config.size || '300x250'}
                        brandingData={config.brandingData}
                        className="w-full"
                      />
                    </div>

                    {/* Описание варианта */}
                    <div className="p-4 border-t border-gray-100">
                      <div className="text-center space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          Вариант {variant}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {variant === 1 && 'Красная подложка под каждой строкой'}
                          {variant === 2 && 'Структурированный текст на белой плашке'}
                          {variant === 3 && 'Центрированный текст с эффектом тиснения'}
                        </p>

                        {selectedVariant === variant && (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mx-auto">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                Выберите стиль размещения текста для вашего брендированного баннера
              </p>
            </motion.div>
          )}



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
              Сгенерировать новые заголовки
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!selectedHeadline || (isBrandedTemplate && !selectedVariant)}
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
