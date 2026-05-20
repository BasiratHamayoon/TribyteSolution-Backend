const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

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

// ─── Create Contact ────────────────────────────────────────────────────────────
exports.createContact = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const newContact = await Contact.create(req.body);

    // Send emails (don't fail request if email fails)
    try {
      const transporter = createTransporter();

      // ── Email to user ──────────────────────────────────────────────────────
      await transporter.sendMail({
        from: `"TribyteSolutions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `We've received your message - TribyteSolutions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TribyteSolutions</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Thank you for reaching out!
              </p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; 
              border-radius: 0 0 10px 10px; border: 1px solid #eee;">
              <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
              <p style="color: #555; line-height: 1.8; font-size: 15px;">
                Thank you for contacting <strong>TribyteSolutions</strong>. 
                We have received your message and our team will get back to you 
                within <strong>24-48 hours</strong>.
              </p>
              <div style="background: white; border-left: 4px solid #667eea; 
                padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">
                  📋 Your Message Summary
                </h3>
                ${subject ? `<p style="margin: 8px 0; color: #555;">
                  <strong>Subject:</strong> ${subject}
                </p>` : ''}
                <p style="margin: 8px 0; color: #555;">
                  <strong>Message:</strong>
                </p>
                <p style="background: #f5f5f5; padding: 12px; border-radius: 5px; 
                  color: #666; font-style: italic; margin: 5px 0 0 0; line-height: 1.6;">
                  "${message}"
                </p>
              </div>
              <div style="background: linear-gradient(135deg, #667eea15, #764ba215); 
                padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 15px;">
                  ⚡ What happens next?
                </h3>
                <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Our team reviews your message</li>
                  <li>We'll reach out within 24-48 hours</li>
                  <li>We'll provide solutions tailored to your needs</li>
                </ul>
              </div>
              <p style="color: #555; line-height: 1.6;">
                In the meantime, feel free to explore our 
                <a href="${process.env.FRONTEND_URL || '#'}" 
                  style="color: #667eea; text-decoration: none; font-weight: bold;">
                  website
                </a> 
                to learn more about our services.
              </p>
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #777; font-size: 14px; margin: 0;">
                  Best Regards,<br>
                  <strong style="color: #333;">TribyteSolutions Team</strong><br>
                  <a href="mailto:${process.env.EMAIL_USER}" 
                    style="color: #667eea; text-decoration: none;">
                    ${process.env.EMAIL_USER}
                  </a>
                </p>
              </div>
            </div>
            <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} TribyteSolutions. All rights reserved.
            </p>
          </div>
        `
      });

      // ── Email to admin (TribyteSolutions) ──────────────────────────────────
      await transporter.sendMail({
        from: `"TribyteSolutions Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📩 New Contact: ${subject || 'General Inquiry'} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1a1a2e; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">📩 New Contact Message</h2>
              <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0;">
                Received: ${new Date().toLocaleString()}
              </p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; 
              border-radius: 0 0 10px 10px; border: 1px solid #eee;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; 
                    font-weight: bold; color: #333; width: 30%;">Name</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">
                    ${name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; 
                    font-weight: bold; color: #333;">Email</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <a href="mailto:${email}" style="color: #667eea;">${email}</a>
                  </td>
                </tr>
                ${subject ? `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; 
                    font-weight: bold; color: #333;">Subject</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">
                    ${subject}
                  </td>
                </tr>` : ''}
              </table>
              <div style="margin-top: 20px;">
                <p style="font-weight: bold; color: #333; margin-bottom: 10px;">Message:</p>
                <div style="background: white; padding: 20px; border-radius: 8px; 
                  border: 1px solid #eee; color: #555; line-height: 1.8;">
                  ${message}
                </div>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                <a href="mailto:${email}" 
                  style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 12px 30px; border-radius: 25px; 
                  text-decoration: none; font-weight: bold; display: inline-block;">
                  Reply to ${name}
                </a>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: newContact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// ─── Get All Contacts (Admin) ──────────────────────────────────────────────────
exports.getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      if (status === 'new') {
        query.status = { $in: ['New', 'Pending'] };
      } else if (status === 'responded') {
        query.status = 'Responded';
      } else {
        query.status = status;
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [contacts, totalCount, statusCounts] = await Promise.all([
      Contact.find(query).sort(sort).skip(skip).limit(limitNum),
      Contact.countDocuments(query),
      Contact.aggregate([
        {
          $group: {
            _id: null,
            newCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['New', 'Pending']] }, 1, 0]
              }
            },
            respondedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Responded'] }, 1, 0] }
            },
            total: { $sum: 1 }
          }
        }
      ])
    ]);

    const counts = statusCounts[0] || { newCount: 0, respondedCount: 0, total: 0 };

    res.json({
      data: contacts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      },
      counts: {
        new: counts.newCount,
        responded: counts.respondedCount,
        total: counts.total
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
};

// ─── Reply To Contact (Admin) ──────────────────────────────────────────────────
exports.replyToContact = async (req, res) => {
  const { id } = req.params;
  const { replyMessage } = req.body;

  try {
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"TribyteSolutions" <${process.env.EMAIL_USER}>`,
      to: contact.email,
      subject: `Re: ${contact.subject || 'Your inquiry to TribyteSolutions'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">TribyteSolutions</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; 
            border-radius: 0 0 10px 10px; border: 1px solid #eee;">
            <h2 style="color: #333; margin-top: 0;">Hi ${contact.name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for reaching out to us. Here is our response to your inquiry:
            </p>
            <div style="background: white; border-left: 4px solid #667eea; 
              padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #555; line-height: 1.8; margin: 0;">
                ${replyMessage}
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #888; font-size: 13px; margin: 0;">
                <strong>Your original message:</strong><br>
                <em style="color: #999;">"${contact.message}"</em>
              </p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #777; font-size: 14px; margin: 0;">
                Best Regards,<br>
                <strong style="color: #333;">TribyteSolutions Team</strong><br>
                <a href="mailto:${process.env.EMAIL_USER}" 
                  style="color: #667eea; text-decoration: none;">
                  ${process.env.EMAIL_USER}
                </a>
              </p>
            </div>
          </div>
          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} TribyteSolutions. All rights reserved.
          </p>
        </div>
      `
    });

    contact.reply = replyMessage;
    contact.status = 'Responded';
    await contact.save();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: contact
    });
  } catch (error) {
    console.error('Reply contact error:', error);
    res.status(500).json({ message: 'Error sending reply' });
  }
};