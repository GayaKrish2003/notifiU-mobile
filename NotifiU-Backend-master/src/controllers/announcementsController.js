const Announcement = require('../models/announcement');

function getAnnouncements(req, res) {
    try {
        const { module_id, status, priority } = req.query;
        const filter = {};
        if (module_id) filter.module_id = module_id;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        Announcement.find(filter)
            .sort({ publish_date: -1 })
            .then(announcements => res.status(200).json(announcements))
            .catch(err => res.status(500).json({ error: 'Failed to fetch announcements' }));
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ error: 'An error occurred while fetching announcements' });
    }
}

async function getAnnouncementById(req, res) {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.status(200).json(announcement);
    } catch (err) {
        console.error('Error fetching announcement by ID:', err);
        res.status(500).json({ error: 'An error occurred while fetching the announcement' });
    }
}

async function createAnnouncement(req, res) {
    try {
        const { title, content, priority, publish_date, expiry_date, module_id, status } = req.body;

        const attachments = (req.files || []).map(file => ({
            file_path: `/uploads/announcements/${file.filename}`,
            original_name: file.originalname,
            mime_type: file.mimetype,
            size_bytes: file.size,
        }));

        const newAnnouncement = new Announcement({
            title,
            content,
            priority,
            publish_date,
            expiry_date,
            module_id,
            status,
            attachments,
        });

        const savedAnnouncement = await newAnnouncement.save();
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
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ error: 'An error occurred while updating the announcement' });
    }
}

async function deleteAnnouncement(req, res) {
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ error: 'An error occurred while deleting the announcement' });
    }
}

function deleteAnnouncementAttachment(req, res) {
    try {
        const { id, attachmentId } = req.params;
        Announcement.findById(id)
            .then(announcement => {
                if (!announcement) {
                    return res.status(404).json({ error: 'Announcement not found' });
                }
                const attachmentIndex = announcement.attachments.findIndex(att => att._id.toString() === attachmentId);
                if (attachmentIndex === -1) {
                    return res.status(404).json({ error: 'Attachment not found' });
                }
                announcement.attachments.splice(attachmentIndex, 1);
                return announcement.save();
            })
            .then(updatedAnnouncement => res.status(200).json(updatedAnnouncement))
            .catch(err => res.status(500).json({ error: 'Failed to delete announcement attachment', details: err }));
    } catch (err) {
        console.error('Error deleting announcement attachment:', err);
        res.status(500).json({ error: 'An error occurred while deleting the announcement attachment' });
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
