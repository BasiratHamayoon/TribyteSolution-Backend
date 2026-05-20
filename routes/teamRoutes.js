const express = require('express');
const router = express.Router();
const {
  getTeamMembers,
  getTeamMemberBySlug,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require('../controllers/teamController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', getTeamMembers);
router.get('/:slug', getTeamMemberBySlug);

// ── Admin Routes ───────────────────────────────────────────────────────────────
router.post('/', protect, upload.single('image'), createTeamMember);
router.put('/:id', protect, upload.single('image'), updateTeamMember);
router.delete('/:id', protect, deleteTeamMember);

module.exports = router;