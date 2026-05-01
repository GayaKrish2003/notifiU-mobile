// Import mongoose to define schema and interact with MongoDB
const mongoose = require("mongoose");

// Define schema for student enrollment
const enrollmentSchema = new mongoose.Schema(
  {
    // Reference to the module 
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module"
    },

 
    moduleCode: String,
 
    moduleName: String,

    studentId: {
      type: String
    },

    studentName: String
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true
  }
);

// Export model 
module.exports =
  mongoose.models.enrollment ||
  mongoose.model("enrollment", enrollmentSchema);