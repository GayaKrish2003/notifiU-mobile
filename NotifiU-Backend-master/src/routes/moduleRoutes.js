// Import express to create routes
const express = require("express");

// Create router object
const router = express.Router();

// Import controller 
const controller = require("../controllers/moduleController");

// Import upload middleware
const upload = require("../middlewares/moduleUploadMiddleware");


// ================== ADMIN ROUTES ==================

// Create a new module
router.post("/modules", controller.createModule);

// Get single module by ID
router.get("/modules/:id", controller.getModuleById);

// Update module details
router.put("/modules/:id", controller.updateModule);

// Delete module
router.delete("/modules/:id", controller.deleteModule);

// Archive or unarchive module
router.put("/modules/archive/:id", controller.archiveModule);

// Assign lecturer to a module
router.put("/modules/:id/assign", controller.assignLecturer);


// ================== COMMON ROUTES ==================

// Get all modules (used by admin, lecturer, student)
router.get("/modules", controller.getModules);


// ================== LECTURER ROUTES ==================

// Upload files to a module (max 10 files)
router.post("/modules/:id/upload", upload.array("files", 10), controller.uploadFile);

// Rename a file (change display name only)
router.put("/modules/:id/file/rename", controller.renameFile);

// Delete a file from module
router.delete("/modules/:id/file", controller.removeFile);

// Get enrollments for lecturer view
router.get("/lecturer/enrollments", controller.getLecturerEnrollments);


// ================== STUDENT ROUTES ==================

// Enroll a student to a module
router.post("/modules/:id/enroll", controller.enrollStudent);

// Get logged-in student's enrollments
router.get("/my-enrollments", controller.getMyEnrollments);


// ================== USER ROUTES ==================

// Get all lecturers (used for assigning lecturer)
router.get("/users/lecturers", controller.getLecturers);


// ================== ADMIN REPORT ROUTES ==================

// Get all enrollments 
router.get("/enrollments", controller.getEnrollments);

// Delete an enrollment
router.delete("/enrollments/:id", controller.deleteEnrollment);

// Get workload report 
router.get("/reports/workload", controller.getWorkloadReport);

// Get semester report
router.get("/reports/semester", controller.getSemesterReport);


// Export router to use in server
module.exports = router;