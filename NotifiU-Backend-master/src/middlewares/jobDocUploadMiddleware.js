const multer = require('multer');

// Store file in memory (buffer) so we can upload it to R2
const storage = multer.memoryStorage();

// Only accept PDF files
const fileFilter = (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf';
    if (isPdf) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const jobDocUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter,
});

module.exports = jobDocUpload;