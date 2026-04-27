// Import mongoose to create schema and interact with MongoDB
const mongoose = require("mongoose");

// This schema is used to store file details related to a module
const fileSchema = new mongoose.Schema(
  {
    // Name used internally (saved in server/storage)
    storedName: {
      type: String,
      required: true
    },

    // Name shown to users
    displayName: {
      type: String,
      required: true
    },

    // URL to access the file (for download/view)
    url: {
      type: String,
      required: true
    }
  },
  { _id: false } // Prevents creating a separate ID for each file object
);

// Main schema for Module
const moduleSchema = new mongoose.Schema({
  
 
  moduleCode: {
    type: String,
    required: true
  },

  moduleName: {
    type: String,
    required: true
  },

  semester: {
    type: String,
    required: true
  },

  academicYear: {
    type: String,
    required: true
  },


  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // No lecturer assigned initially
  },

  // Array of uploaded files related to the module
  files: {
    type: [fileSchema], // Uses fileSchema defined above
    default: []
  },

  // Used to soft-delete or hide modules without removing them permanently
  archived: {
    type: Boolean,
    default: false
  }
});

// Export model (prevents duplicate model error during development)
module.exports = mongoose.models.module || mongoose.model("module", moduleSchema);