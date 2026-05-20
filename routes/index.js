const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const contactRoutes = require('./contactRoutes');
const serviceRoutes = require('./serviceRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const settingRoutes = require('./settingRoutes');
const jobRoutes = require('./jobRoutes');
const teamRoutes = require('./teamRoutes');

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/contact', contactRoutes);
router.use('/services', serviceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingRoutes);
router.use('/jobs', jobRoutes);
router.use('/team', teamRoutes);

module.exports = router;