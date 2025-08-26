import { useState, useEffect } from 'react';
import Layout from './Layout';
import BannerGenerator from './BannerGenerator';
import UserCabinet from '@/components/cabinet/UserCabinet';
import { getSessionId } from '@/api/history-client';
import { setCurrentUserId, getCurrentUserId } from '@/utils/user-id';

export default function MainApp({ userId }) {
  const [currentView, setCurrentView] = useState('create'); // 'create' | 'history'
  const [sessionId, setSessionId] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);

  // Initialize user ID and session
  useEffect(() => {
    // Установить userId если он передан через пропс
    if (userId !== undefined && userId !== null) {
      setCurrentUserId(userId);
      console.log('[MainApp] External User ID set:', userId);
    }
    
    // Получить актуальный ID (из пропса, глобальной переменной или localStorage)
    const id = getCurrentUserId();
    setSessionId(id);
    console.log('[MainApp] Current User ID:', id);
  }, [userId]);

  // Handle navigation between views
  const handleNavigate = (view) => {
    console.log('[MainApp] Navigating to:', view);
    setCurrentView(view);
    
    // Очистим сохраненную конфигурацию при переходе к созданию нового баннера
    if (view === 'create' && savedConfig) {
      setSavedConfig(null);
    }
  };

  // Handle selecting generation from history for editing
  const handleSelectGeneration = (generationData) => {
    console.log('[MainApp] Loading generation for editing:', generationData);
    
    // Convert history data to generator config format
    const config = {
      url: generationData.url,
      size: generationData.size,
      template: generationData.template,
      font: generationData.font,
      imageModel: generationData.imageModel,
      selected_headline: generationData.selectedHeadline,
      uploadedImage: generationData.uploadedImage,
      // Additional restoration data
      _isRestored: true,
      _originalId: generationData.originalId,
      _originalTimestamp: generationData.originalTimestamp
    };
    
    setSavedConfig(config);
    setCurrentView('create');
  };

  // Handle back from history
  const handleBackFromHistory = () => {
    setCurrentView('create');
  };

  return (
    <Layout 
      showNavigation={true} 
      onNavigate={handleNavigate}
    >
      {currentView === 'create' ? (
        <BannerGenerator 
          sessionId={sessionId}
          initialConfig={savedConfig}
          onConfigChange={() => setSavedConfig(null)} // Clear saved config when user makes changes
        />
      ) : currentView === 'history' ? (
        <UserCabinet
          sessionId={sessionId}
          onSelectGeneration={handleSelectGeneration}
          onBack={handleBackFromHistory}
        />
      ) : null}
    </Layout>
  );
}