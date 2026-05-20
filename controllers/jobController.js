const Job = require('../models/Job');
const nodemailer = require('nodemailer');
const { deleteFile, getFileUrl, getFilenameFromUrl } = require('../middleware/upload');
const path = require('path');

// ─── Create Transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ─── Get All Jobs (Public) ─────────────────────────────────────────────────────
exports.getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      department = 'all',
      type = 'all',
      isActive = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    } else {
      // Public route only shows active jobs by default
      query.isActive = true;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [jobs, totalCount, departments, types] = await Promise.all([
      Job.find(query)
        .select('-applicants')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(query),
      Job.distinct('department'),
      Job.distinct('type')
    ]);

    res.json({
      data: jobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      },
      filters: {
        departments: departments.filter(Boolean),
        types: types.filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Get All Jobs Admin (with applicants count) ────────────────────────────────
exports.getJobsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      department = 'all',
      type = 'all',
      isActive = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') query.department = department;
    if (type && type !== 'all') query.type = type;
    if (isActive !== 'all') query.isActive = isActive === 'true';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [jobs, totalCount] = await Promise.all([
      Job.find(query).sort(sort).skip(skip).limit(limitNum),
      Job.countDocuments(query)
    ]);

    // Add applicants count to each job
    const jobsWithCount = jobs.map(job => ({
      ...job.toObject(),
      applicantsCount: job.applicants ? job.applicants.length : 0
    }));

    res.json({
      data: jobsWithCount,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get jobs admin error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Get Job By Slug (Public) ──────────────────────────────────────────────────
exports.getJobBySlug = async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug }).select('-applicants');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Get Job By ID Admin ───────────────────────────────────────────────────────
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ─── Create Job (Admin) ────────────────────────────────────────────────────────
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      slug,
      department,
      location,
      type,
      experience,
      salary,
      description,
      fullDescription,
      requirements,
      responsibilities,
      benefits,
      skills,
      isActive,
      isFeatured,
      applicationEmail,
      applicationDeadline
    } = req.body;

    if (!title || !department || !location || !type || !experience || !description) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const jobSlug = slug || title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingJob = await Job.findOne({ slug: jobSlug });
    if (existingJob) {
      return res.status(400).json({ message: 'A job with this slug already exists' });
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

    const newJob = await Job.create({
      title: title.trim(),
      slug: jobSlug,
      department: department.trim(),
      location: location.trim(),
      type,
      experience: experience.trim(),
      salary: salary || '',
      description: description.trim(),
      fullDescription: fullDescription ? fullDescription.trim() : '',
      requirements: parseArray(requirements),
      responsibilities: parseArray(responsibilities),
      benefits: parseArray(benefits),
      skills: parseArray(skills),
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      applicationEmail: applicationEmail || process.env.EMAIL_USER,
      applicationDeadline: applicationDeadline || null
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
};

// ─── Update Job (Admin) ────────────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
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

    const updateData = {};
    const fields = [
      'title', 'slug', 'department', 'location', 'type',
      'experience', 'salary', 'description', 'fullDescription',
      'applicationEmail', 'applicationDeadline'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    if (req.body.requirements !== undefined) updateData.requirements = parseArray(req.body.requirements);
    if (req.body.responsibilities !== undefined) updateData.responsibilities = parseArray(req.body.responsibilities);
    if (req.body.benefits !== undefined) updateData.benefits = parseArray(req.body.benefits);
    if (req.body.skills !== undefined) updateData.skills = parseArray(req.body.skills);

    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
};

// ─── Delete Job (Admin) ────────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
};

// ─── Apply For Job (Public) ────────────────────────────────────────────────────
exports.applyForJob = async (req, res) => {
  try {
    const { name, email, phone, coverLetter } = req.body;

    if (!name || !email) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.isActive) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if already applied
    const alreadyApplied = job.applicants.find(
      a => a.email.toLowerCase() === email.toLowerCase()
    );
    if (alreadyApplied) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Check deadline
    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    let resumeUrl = '';
    if (req.file) {
      resumeUrl = getFileUrl(req.file.filename, 'resumes');
    }

    job.applicants.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      coverLetter: coverLetter || '',
      resumeUrl,
      status: 'Pending',
      appliedAt: new Date()
    });

    await job.save();

    // Send confirmation email to applicant
    try {
      const transporter = createTransporter();

      // Email to applicant
      await transporter.sendMail({
        from: `"TribyteSolutions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Application Received - ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TribyteSolutions</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Application Confirmation</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
              <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
              <p style="color: #555; line-height: 1.6;">
                Thank you for applying for the <strong>${job.title}</strong> position at TribyteSolutions.
                We've received your application and our team will review it shortly.
              </p>
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Application Details</h3>
                <p style="margin: 5px 0; color: #555;"><strong>Position:</strong> ${job.title}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Department:</strong> ${job.department}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Location:</strong> ${job.location}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Type:</strong> ${job.type}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Applied On:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <p style="color: #555; line-height: 1.6;">
                We'll be in touch with you within 5-7 business days. If you have any questions,
                feel free to reach out to us.
              </p>
              <p style="color: #777; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Best Regards,<br>
                <strong>TribyteSolutions HR Team</strong><br>
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #667eea;">${process.env.EMAIL_USER}</a>
              </p>
            </div>
          </div>
        `
      });

      // Email to admin
      await transporter.sendMail({
        from: `"TribyteSolutions Jobs" <${process.env.EMAIL_USER}>`,
        to: job.applicationEmail || process.env.EMAIL_USER,
        subject: `New Application: ${job.title} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #333; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">New Job Application</h2>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
              <h3 style="color: #333;">Applicant Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Position:</strong> ${job.title}</p>
              <p><strong>Department:</strong> ${job.department}</p>
              <p><strong>Cover Letter:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #eee;">
                ${coverLetter || 'No cover letter provided'}
              </p>
              ${resumeUrl ? `<p><strong>Resume:</strong> <a href="${resumeUrl}">Download Resume</a></p>` : ''}
              <p style="color: #777; font-size: 14px;">Applied on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Application submitted successfully! We will contact you soon.',
      success: true
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};

// ─── Get Applicants For A Job (Admin) ─────────────────────────────────────────
exports.getApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const {
      status = 'all',
      page = 1,
      limit = 20
    } = req.query;

    let applicants = job.applicants;

    if (status !== 'all') {
      applicants = applicants.filter(a => a.status === status);
    }

    const total = applicants.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    applicants = applicants
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(skip, skip + limitNum);

    res.json({
      jobTitle: job.title,
      data: applicants,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ message: 'Error fetching applicants', error: error.message });
  }
};

// ─── Update Applicant Status (Admin) ──────────────────────────────────────────
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { jobId, applicantId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applicant = job.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    applicant.status = status;
    await job.save();

    // Send email to applicant about status update
    try {
      const transporter = createTransporter();
      const statusMessages = {
        Reviewed: 'Your application has been reviewed by our team.',
        Shortlisted: 'Congratulations! You have been shortlisted for the next round.',
        Rejected: 'After careful consideration, we have decided to move forward with other candidates.',
        Hired: 'Congratulations! We would like to offer you the position.'
      };

      if (statusMessages[status]) {
        await transporter.sendMail({
          from: `"TribyteSolutions" <${process.env.EMAIL_USER}>`,
          to: applicant.email,
          subject: `Application Update - ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">TribyteSolutions</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
                <h2 style="color: #333;">Hi ${applicant.name}! 👋</h2>
                <p style="color: #555; line-height: 1.6;">
                  We have an update regarding your application for <strong>${job.title}</strong>.
                </p>
                <div style="background: ${status === 'Hired' || status === 'Shortlisted' ? '#e8f5e9' : status === 'Rejected' ? '#fce4ec' : '#e3f2fd'}; 
                  padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h3 style="color: ${status === 'Hired' || status === 'Shortlisted' ? '#2e7d32' : status === 'Rejected' ? '#c62828' : '#1565c0'}; margin: 0 0 10px 0;">
                    Status: ${status}
                  </h3>
                  <p style="color: #555; margin: 0;">${statusMessages[status]}</p>
                </div>
                <p style="color: #555; line-height: 1.6;">
                  If you have any questions, feel free to reach out to us.
                </p>
                <p style="color: #777; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  Best Regards,<br>
                  <strong>TribyteSolutions HR Team</strong>
                </p>
              </div>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Status email failed:', emailError);
    }

    res.json({
      message: 'Applicant status updated successfully',
      applicant
    });
  } catch (error) {
    console.error('Update applicant status error:', error);
    res.status(500).json({ message: 'Error updating applicant status', error: error.message });
  }
};