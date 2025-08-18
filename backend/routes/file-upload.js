import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${extension}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/png', 
    'image/jpeg', 
    'image/gif', 
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

export async function uploadFile(req, res) {
  // Use multer middleware
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File Too Large',
          message: 'The uploaded file exceeds the maximum allowed size'
        });
      }
      return res.status(400).json({
        error: 'Upload Error',
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        error: 'Upload Error',
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No File Uploaded',
        message: 'Please select a file to upload'
      });
    }
    
    // Generate file URL
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    console.log(`File uploaded successfully: ${req.file.filename}`);
    
    res.json({
      file_url: fileUrl,
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
}

// Optional: Add endpoint to delete uploaded files
export async function deleteFile(req, res) {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'The specified file does not exist'
      });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      message: 'File deleted successfully',
      filename: filename
    });
    
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Deletion Error',
      message: error.message
    });
  }
}