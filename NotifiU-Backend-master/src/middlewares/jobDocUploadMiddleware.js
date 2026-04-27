const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the jobdocs upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'jobdocs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Format: job_timestamp_random.pdf
        const filename = `job_${Date.now()}_${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
        cb(null, filename);
    },
});

// Only accept PDF files
const fileFilter = (req, file, cb) => {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf'
        && file.mimetype === 'application/pdf';
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