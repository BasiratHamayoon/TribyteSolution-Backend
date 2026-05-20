const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changeEmail,
  changePassword
} = require('../controllers/settingController');
const protect = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);           
router.put('/profile', protect, updateProfile);        
router.put('/change-email', protect, changeEmail);     
router.put('/change-password', protect, changePassword); 

module.exports = router;