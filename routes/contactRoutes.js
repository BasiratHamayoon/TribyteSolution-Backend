const express = require('express');
const router = express.Router();
const { createContact, getAllContacts, replyToContact } = require('../controllers/contactController');
const protect = require('../middleware/authMiddleware');

router.post('/', createContact); 
router.get('/', protect, getAllContacts); 
router.post('/:id/reply', protect, replyToContact); 

module.exports = router;