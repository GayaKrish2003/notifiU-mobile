const Announcement = require('../models/announcement');
const { uploadBufferToR2, deleteObjectFromR2 } = require('../utils/r2Storage');
const path = require('path');

async function getAnnouncements(req, res) {
    try {
        const { module_id, status, priority } = req.query;
        const filter = {};
        if (module_id) filter.module_id = module_id;
        if (status)    filter.status = status;
        if (priority)  filter.priority = priority;

        const announcements = await Announcement.find(filter).sort({ publish_date: -1 });
        res.status(200).json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'An error occurred while fetching announcements' });
    }
}

async function getAnnouncementById(req, res) {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        res.status(200).json(announcement);
    } catch (err) {
        console.error('Error fetching announcement by ID:', err);
        res.status(500).json({ error: 'An error occurred while fetching the announcement' });
    }
}

async function createAnnouncement(req, res) {
    try {
        const { title, content, priority, publish_date, expiry_date, module_id, status } = req.body;

        // Upload each file to R2
        const attachments = await Promise.all(
            (req.files || []).map(async (file) => {
                const ext = path.extname(file.originalname);
                const key = `announcements/ann_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
                const url = await uploadBufferToR2({
                    key,
                    buffer:      file.buffer,
                    contentType: file.mimetype,
                });
                return {
                    file_path:     url,   // public R2 URL
                    r2_key:        key,   // stored for deletion later
                    original_name: file.originalname,
                    mime_type:     file.mimetype,
                    size_bytes:    file.size,
                };
            })
        );

        const savedAnnouncement = await new Announcement({
            title, content, priority, publish_date,
            expiry_date, module_id, status, attachments,
        }).save();

        res.status(201).json(savedAnnouncement);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ error: 'An error occurred while creating the announcement' });
    }
}

async function updateAnnouncement(req, res) {
    try {
        const { title, content, priority, status, expiry_date, module_id } = req.body;
        const updated = await Announcement.findByIdAndUpdate(
            req.params.id,
            { title, content, priority, status, expiry_date, module_id },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Announcement not found' });
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ error: 'An error occurred while updating the announcement' });
    }
}

async function deleteAnnouncement(req, res) {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

        // Delete all attachments from R2
        await Promise.allSettled(
            (announcement.attachments || []).map(att =>
                att.r2_key ? deleteObjectFromR2(att.r2_key) : Promise.resolve()
            )
        );

        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Announcement and associated files deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ error: 'An error occurred while deleting the announcement' });
    }
}

async function deleteAnnouncementAttachment(req, res) {
    try {
        const { id, attachmentId } = req.params;
        const announcement = await Announcement.findById(id);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

        const attachmentIndex = announcement.attachments.findIndex(
            att => att._id.toString() === attachmentId
        );
        if (attachmentIndex === -1) return res.status(404).json({ error: 'Attachment not found' });

        const attachment = announcement.attachments[attachmentIndex];

        // Delete from R2
        if (attachment.r2_key) {
            await deleteObjectFromR2(attachment.r2_key).catch(err =>
                console.error('R2 delete failed (continuing):', err.message)
            );
        }

        announcement.attachments.splice(attachmentIndex, 1);
        const updated = await announcement.save();
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error deleting announcement attachment:', err);
        res.status(500).json({ error: 'An error occurred while deleting the attachment' });
    }
}

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    deleteAnnouncementAttachment,
};