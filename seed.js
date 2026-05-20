const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding...');
    
    
    const adminExists = await Admin.findOne({ email: 'tribytesolutions546@gmail.com' });
    if (adminExists) {
        console.log('Admin already exists');
        process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); 

    await Admin.create({
        email: 'tribytesolutions546@gmail.com',
        password: hashedPassword
    });

    console.log('Admin created successfully!');
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });