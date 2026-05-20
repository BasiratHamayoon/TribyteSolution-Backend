const Contact = require('../models/Contact');
const Project = require('../models/Project');
const Services = require('../models/Services');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Team = require('../models/Team');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalMessages,
      unreadMessages,
      respondedMessages,
      totalProjects,
      featuredProjects,
      totalServices,
      popularServices,
      totalAdmins,
      totalJobs,
      activeJobs,
      totalTeamMembers,
      activeTeamMembers
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: { $in: ['New', 'Pending'] } }),
      Contact.countDocuments({ status: 'Responded' }),
      Project.countDocuments(),
      Project.countDocuments({ featured: true }),
      Services.countDocuments(),
      Services.countDocuments({ popular: true }),
      Admin.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Team.countDocuments(),
      Team.countDocuments({ isActive: true })
    ]);

    // Total applicants across all jobs
    const applicantsAgg = await Job.aggregate([
      { $project: { applicantsCount: { $size: '$applicants' } } },
      { $group: { _id: null, total: { $sum: '$applicantsCount' } } }
    ]);
    const totalApplicants = applicantsAgg[0]?.total || 0;

    const recentMessages = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug category tag createdAt');

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title department type location isActive createdAt')
      .lean()
      .then(jobs => jobs.map(j => ({
        ...j,
        applicantsCount: j.applicants ? j.applicants.length : 0
      })));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const messagesByDay = await Contact.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = messagesByDay.find(d => d._id === dateStr);
      chartData.push({
        _id: dateStr,
        count: existing ? existing.count : 0
      });
    }

    res.json({
      stats: {
        totalMessages,
        unreadMessages,
        respondedMessages,
        totalProjects,
        featuredProjects,
        totalServices,
        popularServices,
        teamMembers: totalAdmins,
        totalJobs,
        activeJobs,
        totalTeamMembers,
        activeTeamMembers,
        totalApplicants
      },
      recentMessages,
      recentProjects,
      recentJobs,
      chartData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};