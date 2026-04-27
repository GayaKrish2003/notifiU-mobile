// Import multer library
const multer = require("multer");

// Store uploaded files in memory 
const storage = multer.memoryStorage();

// Configure upload settings
const upload = multer({
  storage, // use memory storage

  limits: {
    // Limit file size to 10MB
    fileSize: 10 * 1024 * 1024
  }
});

// Export upload middleware to use in routes
module.exports = upload;