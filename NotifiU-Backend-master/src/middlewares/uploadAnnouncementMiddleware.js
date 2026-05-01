const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
    const allowedExt = /pdf|doc|docx|jpeg|jpg|png|gif|webp/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'), false);
};

const uploadAnnouncement = multer({
    storage: multer.memoryStorage(),  // ← was diskStorage
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
});

module.exports = uploadAnnouncement;