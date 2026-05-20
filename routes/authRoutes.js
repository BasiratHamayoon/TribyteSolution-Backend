const express = require('express');
const router = express.Router();
const { loginAdmin, getMe , registerAdmin} = require('../controllers/authController');

router.post('/login', loginAdmin);
router.get('/me', getMe);
router.post('/register', registerAdmin);

module.exports = router;