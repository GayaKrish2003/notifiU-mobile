const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title:          { type: String, required: true, trim: true },
    description:    { type: String, required: true },
    date:           { type: Date, required: true },
    time:           { type: String, required: true },
    location:       { type: String, required: true },
    organizingClub: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Workshop', 'Seminar', 'Club Activity', 'Sports', 'Musical'],
    },
    type:     { type: String, enum: ['Event', 'Workshop'], default: 'Event' },
    priority: { type: String, enum: ['Urgent', 'Normal'], default: 'Normal' },
    seatLimit: { type: Number, default: 0 }, // 0 = unlimited

    // R2 cloud storage for poster image
    posterImage:    { type: String, default: null }, // R2 public URL
    posterImageKey: { type: String, default: null }, // R2 object key (for deletion)

    creatorRole: {
        type: String,
        enum: ['clubpresident', 'lecturer', 'superadmin'],
        default: 'superadmin',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },

    status:    { type: String, enum: ['Upcoming', 'History'], default: 'Upcoming' },
    startTime: { type: Date },
    endTime:   { type: Date },

    rsvpList: [{
        name:          { type: String },
        studentId:     { type: String, required: true },
        contactNumber: { type: String, required: true },
        rsvpTime:      { type: Date, default: Date.now },
    }],

    attendanceList: [{
        studentId: { type: String, required: true },
        markedAt:  { type: Date, default: Date.now },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);