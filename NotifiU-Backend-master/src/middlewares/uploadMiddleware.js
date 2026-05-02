const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
};

const upload = multer({
    storage: multer.memoryStorage(),  // ← was diskStorage
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

module.exports = upload;