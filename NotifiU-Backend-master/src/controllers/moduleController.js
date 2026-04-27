// Import required libraries for file upload and database operations
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const path = require("path");
const mongoose = require("mongoose");

// Import models
const Module = require("../models/module");
const Enrollment = require("../models/enrollment");
const User = require("../models/user");

// Configure Cloudflare R2 (similar to AWS S3)
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

// Remove extra "/" from URL
const cleanBaseUrl = (url = "") => url.replace(/\/+$/, "");

// Build public URL to access uploaded file
const buildPublicUrl = (key) => {
  return `${cleanBaseUrl(process.env.R2_PUBLIC_URL)}/${key}`;
};

// Normalize file structure (handle different formats)
const normalizeFiles = (files = []) => {
  if (!Array.isArray(files)) return [];

  return files
    .map((file) => {
      if (typeof file === "string") {
        return {
          storedName: file,
          displayName: file,
          url: ""
        };
      }

      if (!file || typeof file !== "object") return null;

      return {
        storedName: file.storedName || file.key || "",
        displayName: file.displayName || file.originalName || file.storedName || "",
        url: file.url || ""
      };
    })
    .filter((file) => file && file.storedName && file.displayName);
};

// Get raw module from database using MongoDB collection
const getRawModuleById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Module.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
};

// Migrate old file formats to new format if needed
const migrateModuleFilesIfNeeded = async (rawModule) => {
  if (!rawModule) return null;

  const normalizedFiles = normalizeFiles(rawModule.files);
  const needsMigration =
    JSON.stringify(rawModule.files || []) !== JSON.stringify(normalizedFiles);

  if (needsMigration) {
    await Module.collection.updateOne(
      { _id: rawModule._id },
      { $set: { files: normalizedFiles } }
    );
    rawModule.files = normalizedFiles;
  }

  return rawModule;
};

// Get module safely with normalized files
const getSafeModule = async (id) => {
  const rawModule = await getRawModuleById(id);
  if (!rawModule) return null;
  return migrateModuleFilesIfNeeded(rawModule);
};

// CREATE MODULE
exports.createModule = async (req, res) => {
  try {
    const module = new Module({
      moduleCode: req.body.moduleCode,
      moduleName: req.body.moduleName,
      semester: req.body.semester,
      academicYear: req.body.academicYear
    });

    await module.save();
    res.json(module);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to create module",
      error: err.message
    });
  }
};

// GET MODULES
exports.getModules = async (req, res) => {
  try {
    const role = req.query.role;

    const query =
      role === "admin" || role === "superadmin"
        ? {}
        : { archived: false };

    const rawModules = await Module.collection.find(query).sort({ _id: -1 }).toArray();

    const modules = [];
    for (const rawModule of rawModules) {
      const migrated = await migrateModuleFilesIfNeeded(rawModule);
      modules.push({
        ...migrated,
        files: normalizeFiles(migrated.files)
      });
    }

    res.json(modules);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch modules",
      error: err.message
    });
  }
};

// GET SINGLE MODULE
exports.getModuleById = async (req, res) => {
  try {
    const module = await getSafeModule(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    module.files = normalizeFiles(module.files);
    res.json(module);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch module",
      error: err.message
    });
  }
};

// UPDATE MODULE
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      {
        moduleCode: req.body.moduleCode,
        moduleName: req.body.moduleName,
        semester: req.body.semester,
        academicYear: req.body.academicYear
      },
      { new: true }
    );

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const obj = module.toObject();
    obj.files = normalizeFiles(obj.files);
    res.json(obj);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to update module",
      error: err.message
    });
  }
};

// DELETE MODULE
exports.deleteModule = async (req, res) => {
  try {
    const module = await getSafeModule(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    for (const file of normalizeFiles(module.files)) {
      if (file.url) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: file.storedName
            })
          );
        } catch (deleteErr) {
          console.log("Failed to delete R2 file:", deleteErr.message);
        }
      }
    }

    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: "Module deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to delete module",
      error: err.message
    });
  }
};

// ARCHIVE / UNARCHIVE MODULE
exports.archiveModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    module.archived = !module.archived;
    await module.save();

    const obj = module.toObject();
    obj.files = normalizeFiles(obj.files);
    res.json(obj);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to change archive status",
      error: err.message
    });
  }
};

// ASSIGN LECTURER
exports.assignLecturer = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (module.archived) {
      return res.status(400).json({
        message: "Cannot assign lecturer to archived module"
      });
    }

    const lecturer = await User.findById(req.body.lecturerId);

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    module.lecturerId = lecturer._id;
    module.lecturerName = lecturer.name;

    await module.save();

    const obj = module.toObject();
    obj.files = normalizeFiles(obj.files);
    res.json(obj);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to assign lecturer",
      error: err.message
    });
  }
};

// GET ALL LECTURERS
exports.getLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: "lecturer" }).select("-password");
    res.json(lecturers);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch lecturers",
      error: err.message
    });
  }
};

// ENROLL STUDENT
exports.enrollStudent = async (req, res) => {
  try {
    const module = await getSafeModule(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (module.archived) {
      return res.status(400).json({
        message: "Cannot enroll in archived module"
      });
    }

    const existing = await Enrollment.findOne({
      moduleId: module._id,
      studentId: String(req.body.studentId)
    });

    if (existing) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    const enroll = new Enrollment({
      moduleId: module._id,
      moduleCode: module.moduleCode,
      moduleName: module.moduleName,
      studentId: String(req.body.studentId || "STU001"),
      studentName: req.body.studentName || "Student User"
    });

    await enroll.save();
    res.json(enroll);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to enroll student",
      error: err.message
    });
  }
};

// ADMIN ENROLLMENTS
exports.getEnrollments = async (req, res) => {
  try {
    const data = await Enrollment.find().sort({ _id: -1 });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch enrollments",
      error: err.message
    });
  }
};

// DELETE ENROLLMENT
exports.deleteEnrollment = async (req, res) => {
  try {
    await Enrollment.findByIdAndDelete(req.params.id);
    res.json({ message: "Enrollment deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to delete enrollment",
      error: err.message
    });
  }
};

// UPLOAD FILES TO R2
exports.uploadFile = async (req, res) => {
  try {
    if ((!req.files || req.files.length === 0) && !req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (
      !process.env.R2_ENDPOINT ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !process.env.R2_PUBLIC_URL ||
      process.env.R2_ENDPOINT.includes("YOUR_ACCOUNT_ID") ||
      process.env.R2_ACCESS_KEY_ID.includes("YOUR_R2_ACCESS_KEY") ||
      process.env.R2_SECRET_ACCESS_KEY.includes("YOUR_R2_SECRET_KEY") ||
      process.env.R2_BUCKET_NAME.includes("YOUR_BUCKET_NAME") ||
      process.env.R2_PUBLIC_URL.includes("YOUR_PUBLIC_BUCKET_DOMAIN")
    ) {
      return res.status(500).json({
        message: "R2 environment variables are not configured correctly"
      });
    }

    const module = await getSafeModule(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (module.archived) {
      return res.status(400).json({
        message: "Cannot upload files to archived module"
      });
    }

    const currentFiles = normalizeFiles(module.files);
    const filesToUpload =
      req.files && req.files.length > 0 ? req.files : [req.file];

    for (const file of filesToUpload) {
      const uniqueKey = `modules/${req.params.id}/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: uniqueKey,
          Body: file.buffer,
          ContentType: file.mimetype
        })
      );

      currentFiles.push({
        storedName: uniqueKey,
        displayName: file.originalname,
        url: buildPublicUrl(uniqueKey)
      });
    }

    await Module.collection.updateOne(
      { _id: module._id },
      { $set: { files: currentFiles } }
    );

    const updated = await getSafeModule(req.params.id);
    res.json(updated);
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({
      message: "Failed to upload file",
      error: err.message
    });
  }
};

// RENAME DISPLAY NAME ONLY
exports.renameFile = async (req, res) => {
  try {
    const module = await getSafeModule(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const { storedName, displayName } = req.body;

    if (!storedName || !displayName) {
      return res.status(400).json({
        message: "storedName and displayName are required"
      });
    }

    const files = normalizeFiles(module.files);
    const fileIndex = files.findIndex((file) => file.storedName === storedName);

    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" });
    }

    files[fileIndex].displayName = displayName.trim();

    await Module.collection.updateOne(
      { _id: module._id },
      { $set: { files } }
    );

    const updated = await getSafeModule(req.params.id);
    res.json({
      message: "File name updated successfully",
      module: updated
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to rename file",
      error: err.message
    });
  }
};

// REMOVE FILE FROM R2
exports.removeFile = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const { storedName } = req.body;

    if (!storedName) {
      return res.status(400).json({ message: "storedName is required" });
    }

    const files = normalizeFiles(module.files);
    const fileToDelete = files.find((file) => file.storedName === storedName);

    if (!fileToDelete) {
      return res.status(404).json({ message: "File not found" });
    }

    console.log("Deleting from R2:", storedName);

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: storedName
      })
    );

    module.files = files.filter((file) => file.storedName !== storedName);

    await module.save();

    res.json({ message: "File removed successfully" });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({
      message: "Failed to remove file",
      error: err.message
    });
  }
};

// LECTURER ENROLLMENTS
exports.getLecturerEnrollments = async (req, res) => {
  try {
    const { moduleId } = req.query;
    const activeModules = await Module.find({ archived: false }).select("_id");
    const activeModuleIds = activeModules.map((m) => m._id.toString());

    let query = {
      moduleId: { $in: activeModuleIds }
    };

    if (moduleId) {
      query = { moduleId };
    }

    const enrollments = await Enrollment.find(query).sort({ _id: -1 });
    res.json(enrollments);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch lecturer enrollments",
      error: err.message
    });
  }
};

// STUDENT MY ENROLLMENTS
exports.getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const activeModules = await Module.find({ archived: false }).select("_id");
    const activeModuleIds = activeModules.map((m) => m._id);

    if (studentId) {
      const data = await Enrollment.find({
        studentId: String(studentId),
        moduleId: { $in: activeModuleIds }
      }).sort({ _id: -1 });

      return res.json(data);
    }

    const data = await Enrollment.find({
      moduleId: { $in: activeModuleIds }
    }).sort({ _id: -1 });

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch my enrollments",
      error: err.message
    });
  }
};

// WORKLOAD REPORT
exports.getWorkloadReport = async (req, res) => {
  try {
    const data = await Module.find({
      lecturerId: { $ne: null },
      archived: false
    })
      .populate("lecturerId", "name")
      .sort({ semester: 1 });

    const formatted = data.map((m) => ({
      lecturerName: m.lecturerId?.name || m.lecturerName || "Not Assigned",
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      semester: m.semester
    }));

    res.json(formatted);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch workload report",
      error: err.message
    });
  }
};

// SEMESTER REPORT
exports.getSemesterReport = async (req, res) => {
  try {
    const data = await Module.find({ archived: false }).sort({ semester: 1 });

    const formatted = data.map((m) => ({
      semester: m.semester,
      moduleCode: m.moduleCode,
      moduleName: m.moduleName
    }));

    res.json(formatted);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch semester report",
      error: err.message
    });
  }
};