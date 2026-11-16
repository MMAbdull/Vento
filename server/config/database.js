const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });
    console.log("MongoDB Connected");
  } catch (error) {
    // Driver errors may contain connection details. Startup logs only a generic failure.
    throw new Error('Database connection failed');
  }
};

module.exports = connectDatabase;
