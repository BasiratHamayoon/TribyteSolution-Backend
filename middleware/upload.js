const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDir = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating directory:', error);
  }
};

const getUploadPath = (folder) => {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  return isServerless ? path.join('/tmp', folder) : folder;
};

const ensureUploadDirs = () => {
  createUploadDir(getUploadPath('uploads/projects'));
  createUploadDir(getUploadPath('uploads/services'));
  createUploadDir(getUploadPath('uploads/profiles'));
  createUploadDir(getUploadPath('uploads/team'));
  createUploadDir(getUploadPath('uploads/resumes'));
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDirs();

    let folder = 'uploads/';

    if (req.baseUrl.includes('projects') || req.path.includes('projects')) {
      folder = 'uploads/projects';
    } else if (req.baseUrl.includes('services')) {
      folder = 'uploads/services';
    } else if (req.baseUrl.includes('profile') || req.baseUrl.includes('settings')) {
      folder = 'uploads/profiles';
    } else if (req.baseUrl.includes('team')) {
      folder = 'uploads/team';
    } else if (req.baseUrl.includes('jobs') && file.fieldname === 'resume') {
      folder = 'uploads/resumes';
    } else {
      folder = 'uploads/general';
    }

    const uploadPath = getUploadPath(folder);
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images for most uploads
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  // Allow PDFs and docs for resumes
  const allowedResumeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.fieldname === 'resume') {
    if ([...allowedImageTypes, ...allowedResumeTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed for resume.'), false);
    }
  } else {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

const getFileUrl = (filename, folder = 'projects') => {
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

const getFilenameFromUrl = (url) => {
  if (!url) return null;
  return url.split('/').pop();
};

module.exports = {
  upload,
  deleteFile,
  getFileUrl,
  getFilenameFromUrl
};