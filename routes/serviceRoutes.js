const express = require('express');
const router = express.Router();
const { 
    createService,
    getServices,
    getServiceBySlug,
    deleteService,
    updateService
} = require('../controllers/serviceController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');


router.get('/', getServices);
router.get('/:slug', getServiceBySlug);


router.post('/', protect, upload.single('image'), createService);
router.put('/:id', protect, upload.single('image'), updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;