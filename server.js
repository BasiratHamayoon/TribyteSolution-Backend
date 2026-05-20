require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
 
     SanzyLimited Backend Started!          
     Server: http://localhost:${PORT}       
     API:    http://localhost:${PORT}/api   
     Mode:   ${process.env.NODE_ENV || 'development'}            
  
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();