const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file');
    console.error('   Set it to a MongoDB Atlas URI or local MongoDB URI');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('');
    console.error('   💡 If you don\'t have MongoDB installed locally, use MongoDB Atlas (free):');
    console.error('      1. Go to https://www.mongodb.com/atlas → Create free cluster');
    console.error('      2. Create a database user with password');
    console.error('      3. Add 0.0.0.0/0 to IP Access List');
    console.error('      4. Get your connection string and set it in server/.env:');
    console.error('         MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/taskflow');
    console.error('');
    process.exit(1);
  }
};

module.exports = connectDB;
