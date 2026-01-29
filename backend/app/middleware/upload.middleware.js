const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../config/logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-patientId.ext
    const patientId = req.params.id || req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${patientId}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).send({
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).send({
        message: 'Only one file allowed.'
      });
    }
    return res.status(400).send({
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).send({
      message: err.message || 'File upload failed'
    });
  }
  next();
};

module.exports = {
  upload,
  uploadDir,
  handleUploadError
};
