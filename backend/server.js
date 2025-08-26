import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import route handlers
import { invokeLLM } from './routes/llm.js';
import { generateImage } from './routes/image-generation.js';
import { uploadFile } from './routes/file-upload.js';

// Import multi-agent system routes
import { 
  generateBanner, 
  generateHeadlines, 
  generateBannerFromHeadline,
  regenerateHeadlines,
  regenerateImages,
  getTaskStatus,
  getStats 
} from './routes/multi-agent.js';

import {
  getUserHistory,
  getGeneration,
  saveGeneration,
  deleteGeneration,
  getUserStats,
  reproduceGeneration,
  searchHistory,
  saveDownloadedBanner,
  clearUserHistory
} from './routes/history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('🔧 Environment Variables:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('RECRAFT_API_KEY:', process.env.RECRAFT_API_KEY ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// More permissive CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['*'],
  optionsSuccessStatus: 200
}));

// Additional CORS middleware to ensure headers are always set
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'banner-backend'
  });
});

// Legacy API Routes (for backward compatibility)
app.post('/api/invoke-llm', invokeLLM);
app.post('/api/generate-image', generateImage);
app.post('/api/upload-file', uploadFile);

// Multi-Agent API Routes
app.post('/api/agents/generate-banner', generateBanner);
app.post('/api/agents/generate-headlines', generateHeadlines);
app.post('/api/agents/generate-banner-from-headline', generateBannerFromHeadline);
app.post('/api/agents/regenerate-headlines', regenerateHeadlines);
app.post('/api/agents/regenerate-images', regenerateImages);
app.get('/api/agents/task/:taskId', getTaskStatus);
app.get('/api/agents/stats', getStats);

// History API Routes
app.get('/api/history/:sessionId', getUserHistory);
app.get('/api/history/:sessionId/stats', getUserStats);  
app.get('/api/history/:sessionId/search', searchHistory);
app.delete('/api/history/:sessionId/clear', clearUserHistory);
app.get('/api/generation/:generationId', getGeneration);
app.post('/api/generation', saveGeneration);
app.delete('/api/generation/:generationId', deleteGeneration);
app.get('/api/generation/:generationId/reproduce', reproduceGeneration);
app.post('/api/banner/download', saveDownloadedBanner);

// Error handling middleware (must have 4 args)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Banner Backend API running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`🌐 CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175'}`);
});