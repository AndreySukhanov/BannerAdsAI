// Mock API для тестирования когда OpenAI недоступен

export const mockLLMResponse = (prompt) => {
  // Имитируем задержку API
  return new Promise((resolve) => {
    setTimeout(() => {
      // Генерируем mock заголовки на основе промпта
      const headlines = [
        'ПОЛУЧИТЕ ПРОФЕССИОНАЛЬНОЕ РЕШЕНИЕ СЕГОДНЯ',
        'РЕШАЕМ ВАШУ ЗАДАЧУ БЫСТРО И КАЧЕСТВЕННО', 
        'НАЧНИТЕ ПРЯМО СЕЙЧАС - РЕЗУЛЬТАТ ГАРАНТИРОВАН'
      ];
      
      resolve(headlines.join('\n'));
    }, 1500); // Имитируем задержку 1.5 секунды
  });
};

export const mockImageGeneration = (prompt) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Возвращаем placeholder изображения
      const placeholderUrls = [
        'https://picsum.photos/1024/1024?random=1',
        'https://picsum.photos/1024/1024?random=2',
        'https://picsum.photos/1024/1024?random=3'
      ];
      
      const randomUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];
      
      resolve({
        url: randomUrl,
        revised_prompt: prompt
      });
    }, 2000); // Имитируем задержку 2 секунды
  });
};

