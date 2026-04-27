const Event = require('../models/Event');
const mongoose = require('mongoose');
const path = require('path');
const { uploadBufferToR2, deleteObjectFromR2 } = require('../utils/r2Storage');

// ── Helper ────────────────────────────────────────────────────────────────────
const buildStartEnd = (date, time) => {
    let dateStr = date;
    if (typeof date === 'string' && date.includes('T')) dateStr = date.split('T')[0];
    const startTime = new Date(`${dateStr}T${time}:00`);
    const endTime   = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    return { startTime, endTime };
};

// ── Create Event ──────────────────────────────────────────────────────────────
exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, date, time, location,
            organizingClub, category, type, priority, seatLimit, creatorRole,
        } = req.body;

        if (!title || !description || !date || !time || !location || !organizingClub || !category) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        const { startTime, endTime } = buildStartEnd(date, time);

        // Upload poster to R2 if provided
        let posterImage    = null;
        let posterImageKey = null;

        if (req.file) {
            const ext = path.extname(req.file.originalname);
            posterImageKey = `events/posters/${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            posterImage = await uploadBufferToR2({
                key:         posterImageKey,
                buffer:      req.file.buffer,
                contentType: req.file.mimetype,
            });
        }

        const event = await Event.create({
            title, description, date, time, location,
            organizingClub, category,
            type:        type        || 'Event',
            priority:    priority    || 'Normal',
            seatLimit:   seatLimit   ? Number(seatLimit) : 0,
            creatorRole: creatorRole || req.user.role,
            createdBy:   req.user._id,
            startTime, endTime,
            posterImage, posterImageKey,
        });

        res.status(201).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ── Get All Events ────────────────────────────────────────────────────────────
exports.getEvents = async (req, res) => {
    try {
        const { category, organizingClub, status, type } = req.query;
        const query = {};

        if (category)       query.category       = category;
        if (organizingClub) query.organizingClub = organizingClub;
        if (type)           query.type           = type;

        // Default: students see only Upcoming
        if (status) {
            query.status = status;
        } else if (req.user.role === 'student') {
            query.status = 'Upcoming';
        }

        const events = await Event.find(query).sort({ date: 1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Get My Events (Club President / Admin) ────────────────────────────────────
exports.getMyEvents = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { createdBy: req.user._id };
        if (status) query.status = status;

        const events = await Event.find(query).sort({ date: -1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Get Single Event ──────────────────────────────────────────────────────────
exports.getEventById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Event ID' });
        }
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Update Event ──────────────────────────────────────────────────────────────
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Ownership check for club presidents
        if (
            req.user.role === 'clubpresident' &&
            String(event.createdBy) !== String(req.user._id)
        ) {
            return res.status(403).json({ message: 'Not authorized to edit this event' });
        }

        const updateData = { ...req.body };
        if (updateData.seatLimit !== undefined) updateData.seatLimit = Number(updateData.seatLimit);

        // Rebuild startTime/endTime if date or time changed
        const newDate = updateData.date || event.date;
        const newTime = updateData.time || event.time;
        const { startTime, endTime } = buildStartEnd(newDate, newTime);
        updateData.startTime = startTime;
        updateData.endTime   = endTime;

        // Handle poster image update
        if (req.file) {
            // Delete old poster from R2 if exists
            if (event.posterImageKey) {
                await deleteObjectFromR2(event.posterImageKey).catch(err =>
                    console.error('Failed to delete old poster:', err.message)
                );
            }
            const ext = path.extname(req.file.originalname);
            const posterImageKey = `events/posters/${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            const posterImage = await uploadBufferToR2({
                key:         posterImageKey,
                buffer:      req.file.buffer,
                contentType: req.file.mimetype,
            });
            updateData.posterImage    = posterImage;
            updateData.posterImageKey = posterImageKey;
        }

        const updated = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ── Delete Event ──────────────────────────────────────────────────────────────
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Ownership check for club presidents
        if (
            req.user.role === 'clubpresident' &&
            String(event.createdBy) !== String(req.user._id)
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        // Delete poster from R2
        if (event.posterImageKey) {
            await deleteObjectFromR2(event.posterImageKey).catch(err =>
                console.error('Failed to delete poster from R2:', err.message)
            );
        }

        await event.deleteOne();
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── RSVP ─────────────────────────────────────────────────────────────────────
exports.rsvpEvent = async (req, res) => {
    try {
        const { name, studentId, contactNumber } = req.body;

        if (!studentId || !contactNumber) {
            return res.status(400).json({ message: 'Student ID and Contact Number are required' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.status !== 'Upcoming') {
            return res.status(400).json({ message: 'Cannot RSVP to a past event' });
        }

        const alreadyRsvped = event.rsvpList.some(r => r.studentId === studentId);
        if (alreadyRsvped) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        if (event.seatLimit > 0 && event.rsvpList.length >= event.seatLimit) {
            return res.status(400).json({ message: `Sorry, this event is fully booked! (${event.seatLimit} seats maximum)` });
        }

        event.rsvpList.push({ name, studentId, contactNumber, rsvpTime: new Date() });
        await event.save();

        res.status(200).json({ success: true, message: 'RSVP successful', data: event });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ── Mark Attendance ───────────────────────────────────────────────────────────
exports.markAttendance = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Event ID' });
        }

        const { studentId } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const hasRsvped = event.rsvpList.some(r => String(r.studentId) === String(studentId));
        if (!hasRsvped) {
            return res.status(400).json({ message: "Only users who RSVP'd can mark attendance" });
        }

        // Enforce time window: 15 min before start to end
        if (event.startTime && event.endTime) {
            const now         = new Date();
            const windowStart = new Date(event.startTime.getTime() - 15 * 60 * 1000);
            if (now < windowStart || now > event.endTime) {
                return res.status(400).json({ message: 'Attendance tracking is not active right now' });
            }
        }

        const alreadyAttended = event.attendanceList.some(
            a => String(a.studentId) === String(studentId)
        );

        if (!alreadyAttended) {
            event.attendanceList.push({ studentId });
            await event.save();
        }

        res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Student Notifications ─────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) return res.status(200).json({ success: true, data: [] });

        const now           = new Date();
        const notifications = [];

        const upcomingEvents = await Event.find({
            status:              'Upcoming',
            'rsvpList.studentId': studentId,
        });

        upcomingEvents.forEach(event => {
            if (!event.startTime) return;

            const timeDiff = event.startTime.getTime() - now.getTime();
            const diffMins = Math.floor(timeDiff / 60000);

            if (diffMins > 5 && diffMins <= 15) {
                notifications.push({
                    eventId: event._id,
                    title:   event.title,
                    message: `"${event.title}" is starting in ${diffMins} minutes!`,
                    type:    'reminder',
                });
            } else if (diffMins >= -15 && diffMins <= 5) {
                const hasAttended = event.attendanceList.some(
                    a => String(a.studentId) === String(studentId)
                );
                notifications.push({
                    eventId: event._id,
                    title:   event.title,
                    message: diffMins > 0
                        ? `"${event.title}" starts in ${diffMins} mins. Are you there?`
                        : `"${event.title}" has started. Mark your attendance!`,
                    type: 'attendance',
                    hasAttended,
                });
            }
        });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};