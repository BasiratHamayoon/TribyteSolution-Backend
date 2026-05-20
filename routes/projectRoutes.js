const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');


router.get('/', projectController.getProjects);
router.get('/:slug', projectController.getProjectBySlug);


router.post('/', authMiddleware, upload.single('image'), projectController.createProject);
router.put('/:id', authMiddleware, upload.single('image'), projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;