const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    file_path: {
        type: String,
        required: [true, 'File path is required'],
    },
    original_name: {
        type: String,
        default: null,
    },
    mime_type: {
        type: String,
        default: null,
    },
    size_bytes: {
        type: Number,
        default: null,
    },
});

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [255, 'Title cannot exceed 255 characters'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        publish_date: {
            type: Date,
            default: Date.now,
        },
        expiry_date: {
            type: Date,
            default: null,
            validate: {
                validator: function (val) {
                    return !val || !this.publish_date || val > this.publish_date;
                },
                message: 'expiry_date must be after publish_date',
            },
        },
        module_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            default: null,
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'published',
        },
        attachments: {
            type: [attachmentSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

announcementSchema.index({ status: 1, publish_date: -1 });
announcementSchema.index({ module_id: 1, status: 1 });
announcementSchema.index({ posted_by: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
