// React import not needed in main.jsx with new JSX transform
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Импортируем виджет для глобального доступа
import '@/integration/banner-widget.js'

// Получаем userId из глобальной переменной (для интеграции)
const userId = window.BANNER_USER_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
    <App userId={userId} />
) 