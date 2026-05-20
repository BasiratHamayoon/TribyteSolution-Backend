const Team = require('../models/Team');
const path = require('path');
const { deleteFile, getFileUrl, getFilenameFromUrl } = require('../middleware/upload');

// ─── Get All Team Members (Public) ────────────────────────────────────────────
exports.getTeamMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      department = 'all',
      isActive = 'true',
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [members, totalCount, departments] = await Promise.all([
      Team.find(query).sort(sort).skip(skip).limit(limitNum),
      Team.countDocuments(query),
      Team.distinct('department')
    ]);

    res.json({
      data: members,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      },
      filters: {
        departments: departments.filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Get Team Member By Slug (Public) ─────────────────────────────────────────
exports.getTeamMemberBySlug = async (req, res) => {
  try {
    const member = await Team.findOne({ slug: req.params.slug });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Create Team Member (Admin) ────────────────────────────────────────────────
exports.createTeamMember = async (req, res) => {
  try {
    const {
      name,
      slug,
      role,
      department,
      bio,
      email,
      phone,
      socialLinks,
      skills,
      isActive,
      isFeatured,
      order,
      joinedAt
    } = req.body;

    if (!name || !role || !department) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Name, role and department are required' });
    }

    const memberSlug = slug || name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await Team.findOne({ slug: memberSlug });
    if (existing) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'A team member with this slug already exists' });
    }

    let image = null;
    if (req.file) {
      image = getFileUrl(req.file.filename, 'team');
    }

    const parseArray = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return field.split(',').map(i => i.trim()).filter(Boolean);
      }
      return [];
    };

    let parsedSocialLinks = {};
    if (socialLinks) {
      try {
        parsedSocialLinks = typeof socialLinks === 'string'
          ? JSON.parse(socialLinks)
          : socialLinks;
      } catch {
        parsedSocialLinks = {};
      }
    }

    const newMember = await Team.create({
      name: name.trim(),
      slug: memberSlug,
      role: role.trim(),
      department: department.trim(),
      bio: bio ? bio.trim() : '',
      image,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      socialLinks: parsedSocialLinks,
      skills: parseArray(skills),
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      order: order ? parseInt(order) : 0,
      joinedAt: joinedAt || new Date()
    });

    res.status(201).json(newMember);
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Error creating team member', error: error.message });
  }
};

// ─── Update Team Member (Admin) ────────────────────────────────────────────────
exports.updateTeamMember = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ message: 'Team member not found' });
    }

    const {
      name, slug, role, department, bio,
      email, phone, socialLinks, skills,
      isActive, isFeatured, order, joinedAt,
      removeImage
    } = req.body;

    let image = member.image;

    if (req.file) {
      if (member.image) {
        const oldFilename = getFilenameFromUrl(member.image);
        if (oldFilename) deleteFile(path.join('uploads/team', oldFilename));
      }
      image = getFileUrl(req.file.filename, 'team');
    }

    if (removeImage === 'true' || removeImage === true) {
      if (member.image) {
        const oldFilename = getFilenameFromUrl(member.image);
        if (oldFilename) deleteFile(path.join('uploads/team', oldFilename));
      }
      image = null;
    }

    const parseArray = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return field.split(',').map(i => i.trim()).filter(Boolean);
      }
      return [];
    };

    let parsedSocialLinks = member.socialLinks;
    if (socialLinks !== undefined) {
      try {
        parsedSocialLinks = typeof socialLinks === 'string'
          ? JSON.parse(socialLinks)
          : socialLinks;
      } catch {
        parsedSocialLinks = member.socialLinks;
      }
    }

    const updateData = {
      image,
      socialLinks: parsedSocialLinks
    };

    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) {
      updateData.slug = slug.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (role !== undefined) updateData.role = role.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (skills !== undefined) updateData.skills = parseArray(skills);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (order !== undefined) updateData.order = parseInt(order);
    if (joinedAt !== undefined) updateData.joinedAt = joinedAt;

    const updatedMember = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedMember);
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Error updating team member', error: error.message });
  }
};

// ─── Delete Team Member (Admin) ────────────────────────────────────────────────
exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (member.image) {
      const filename = getFilenameFromUrl(member.image);
      if (filename) deleteFile(path.join('uploads/team', filename));
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Error deleting team member', error: error.message });
  }
};