const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobsAdmin,
  getJobBySlug,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getApplicants,
  updateApplicantStatus
} = require('../controllers/jobController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', getJobs);
router.get('/:slug', getJobBySlug);
router.post('/:id/apply', upload.single('resume'), applyForJob);

// ── Admin Routes ───────────────────────────────────────────────────────────────
router.get('/admin/all', protect, getJobsAdmin);
router.get('/admin/:id', protect, getJobById);
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.get('/:id/applicants', protect, getApplicants);
router.put('/:jobId/applicants/:applicantId/status', protect, updateApplicantStatus);

module.exports = router;