
// React import not needed with new JSX transform
import { Zap, History } from "lucide-react";

export default function Layout({ children, showNavigation = false, onNavigate }) {
  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate('create');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --primary-purple: #8b5cf6;
          --primary-pink: #ec4899;
          --gradient-primary: linear-gradient(135deg, #8b5cf6, #ec4899);
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --surface-white: #ffffff;
          --border-light: #e5e7eb;
          --green-accent: #10b981;
        }
        
        .step-card {
          background: var(--surface-white);
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid var(--border-light);
        }
        
        .gradient-button {
          background: var(--gradient-primary);
          border: none;
          color: white;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .gradient-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.4);
        }
        
        .step-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--green-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .step-check {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--green-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      {/* Минималистичный хедер */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleLogoClick} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BannerAdsAI</span>
            </button>
            
            {/* Navigation */}
            {showNavigation && onNavigate && (
              <nav className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('history')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  История
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="py-8">
        {children}
      </main>
    </div>
  );
}
