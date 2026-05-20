const Admin = require('../models/Admin');
const AdminSettings = require('../models/Settings');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    
    try {
      await AdminSettings.findOneAndUpdate(
        { adminId: admin._id },
        {
          $push: {
            'security.loginHistory': {
              $each: [{
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                timestamp: new Date()
              }],
              $slice: -10 
            }
          }
        },
        { upsert: true }
      );
    } catch (historyError) {
      console.log('Login history update failed:', historyError);
      
    }

    res.json({ 
      token, 
      admin: { 
        id: admin._id, 
        name: admin.name,
        email: admin.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword
    });

    
    await AdminSettings.create({
      adminId: admin._id,
      profile: {
        name: admin.name,
        email: admin.email,
        role: 'Admin'
      }
    });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};