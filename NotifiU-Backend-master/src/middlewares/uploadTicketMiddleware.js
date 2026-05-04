const multer = require('multer');

const fileFilter = (req, file, cb) => {
    const allowedMime = /image\/(jpeg|jpg|png)|application\/pdf/.test(file.mimetype);
    if (allowedMime) return cb(null, true);
    cb(new Error('Only PNG, JPG, JPEG images and PDF files are allowed!'), false);
};

const uploadTicket = multer({
    storage: multer.memoryStorage(),  // ← was diskStorage
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
});

module.exports = uploadTicket;