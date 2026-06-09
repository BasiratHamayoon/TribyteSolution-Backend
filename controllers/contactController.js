const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

exports.createContact = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const newContact = await Contact.create(req.body);

    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: `"TribyteSolutions" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `We have received your message - TribyteSolutions`,
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f8f8f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                  <tr>
                    <td style="background:#ff6b00;padding:40px 30px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">TribyteSolutions</h1>
                      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;font-weight:500;">Thank you for reaching out</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;padding:35px 30px;">
                      <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px;font-weight:700;">Hi ${name},</h2>
                      <p style="color:#555;line-height:1.8;font-size:14px;margin:0 0 25px;">
                        Thank you for contacting <strong style="color:#ff6b00;">TribyteSolutions</strong>.
                        We have received your message and our team will get back to you
                        within <strong>24 hours</strong>.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3;border-left:4px solid #ff6b00;margin:0 0 25px;">
                        <tr>
                          <td style="padding:20px;">
                            <p style="color:#ff6b00;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Message Summary</p>
                            ${subject ? `<p style="margin:6px 0;color:#555;font-size:13px;"><strong>Subject:</strong> ${subject}</p>` : ''}
                            <p style="margin:6px 0 4px;color:#555;font-size:13px;"><strong>Message:</strong></p>
                            <p style="background:#f5f0eb;padding:12px 15px;color:#666;font-style:italic;margin:5px 0 0;line-height:1.7;font-size:13px;">"${message}"</p>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5ee;margin:0 0 25px;">
                        <tr>
                          <td style="padding:20px;">
                            <p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 10px;">What happens next?</p>
                            <table cellpadding="0" cellspacing="0">
                              <tr><td style="padding:4px 0;color:#555;font-size:13px;">— Our team reviews your message</td></tr>
                              <tr><td style="padding:4px 0;color:#555;font-size:13px;">— We will reach out within 24 hours</td></tr>
                              <tr><td style="padding:4px 0;color:#555;font-size:13px;">— We will provide solutions tailored to your needs</td></tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="color:#555;line-height:1.7;font-size:13px;margin:0;">
                        If you have any urgent questions, you can reach us directly at
                        <a href="mailto:info@tribyte.org" style="color:#ff6b00;text-decoration:none;font-weight:700;"> info@tribyte.org</a>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#1a1a1a;padding:25px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p style="color:#ff6b00;font-size:14px;font-weight:800;margin:0 0 5px;">TribyteSolutions</p>
                            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 3px;">Office no 3, IT Technology Park</p>
                            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 3px;">SBBWU, Larama, Peshawar</p>
                            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0;">+92 324 987 5634</p>
                          </td>
                          <td align="right" valign="top">
                            <a href="mailto:info@tribyte.org" style="color:#ff6b00;text-decoration:none;font-size:12px;font-weight:600;">info@tribyte.org</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:15px 0;text-align:center;">
                      <p style="color:#aaa;font-size:11px;margin:0;">© ${new Date().getFullYear()} TribyteSolutions. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      });

      await transporter.sendMail({
        from: `"TribyteSolutions Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Contact: ${subject || 'General Inquiry'} - ${name}`,
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f8f8f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                  <tr>
                    <td style="background:#1a1a1a;padding:30px;text-align:center;">
                      <h2 style="color:#ff6b00;margin:0 0 5px;font-size:22px;font-weight:800;">New Contact Message</h2>
                      <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px;">Received: ${new Date().toLocaleString()}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;padding:30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                        <tr>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1a1a;width:30%;font-size:13px;">Name</td>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1a1a;font-size:13px;">Email</td>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;font-size:13px;"><a href="mailto:${email}" style="color:#ff6b00;text-decoration:none;font-weight:600;">${email}</a></td>
                        </tr>
                        ${subject ? `
                        <tr>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;font-weight:700;color:#1a1a1a;font-size:13px;">Subject</td>
                          <td style="padding:12px 15px;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">${subject}</td>
                        </tr>` : ''}
                      </table>
                      <p style="font-weight:700;color:#1a1a1a;margin:0 0 10px;font-size:13px;">Message:</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3;border-left:4px solid #ff6b00;">
                        <tr>
                          <td style="padding:20px;color:#555;line-height:1.8;font-size:13px;">${message}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#1a1a1a;padding:15px 30px;text-align:center;">
                      <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;">© ${new Date().getFullYear()} TribyteSolutions Admin</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
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
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f8f8f8;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr>
                  <td style="background:#ff6b00;padding:35px 30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">TribyteSolutions</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">We have responded to your inquiry</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;padding:35px 30px;">
                    <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px;font-weight:700;">Hi ${contact.name},</h2>
                    <p style="color:#555;line-height:1.7;font-size:14px;margin:0 0 25px;">
                      Thank you for reaching out to us. Here is our response to your inquiry:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3;border-left:4px solid #ff6b00;margin:0 0 25px;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="color:#ff6b00;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Our Response</p>
                          <p style="color:#333;line-height:1.8;margin:0;font-size:14px;">${replyMessage}</p>
                        </td>
                      </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;margin:0 0 25px;">
                      <tr>
                        <td style="padding:15px 20px;">
                          <p style="color:#999;font-size:12px;margin:0 0 5px;font-weight:700;">Your original message:</p>
                          <p style="color:#888;font-size:12px;font-style:italic;margin:0;line-height:1.6;">"${contact.message}"</p>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#555;line-height:1.7;font-size:13px;margin:0;">
                      If you have any further questions, feel free to reply to this email or contact us at
                      <a href="mailto:info@tribyte.org" style="color:#ff6b00;text-decoration:none;font-weight:700;"> info@tribyte.org</a>.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#1a1a1a;padding:25px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="color:#ff6b00;font-size:14px;font-weight:800;margin:0 0 5px;">TribyteSolutions</p>
                          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 3px;">Office no 3, IT Technology Park</p>
                          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 3px;">SBBWU, Larama, Peshawar</p>
                          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0;">+92 324 987 5634</p>
                        </td>
                        <td align="right" valign="top">
                          <a href="mailto:info@tribyte.org" style="color:#ff6b00;text-decoration:none;font-size:12px;font-weight:600;">info@tribyte.org</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 0;text-align:center;">
                    <p style="color:#aaa;font-size:11px;margin:0;">© ${new Date().getFullYear()} TribyteSolutions. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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