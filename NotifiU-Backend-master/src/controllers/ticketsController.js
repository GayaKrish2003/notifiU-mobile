const { SupportTicket, TicketResponse } = require('../models/supportTicket');
const path = require('path');
const { uploadBufferToR2, deleteObjectFromR2 } = require('../utils/r2Storage');


async function getTickets(req, res) {
    try {
        const filter = req.user.role === 'student' ? { user_id: req.user.id } : {};
        const tickets = await SupportTicket.find(filter)
            .sort({ createdAt: -1 })
            .populate('user_id', 'username role');
        res.status(200).json(tickets);
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ error: 'An error occurred while fetching tickets' });
    }
}

async function getTicketById(req, res) {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('user_id', 'username role');

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        if (req.user.role === 'student' && ticket.user_id._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const responses = await TicketResponse.find({ ticket_id: ticket._id })
            .sort({ createdAt: 1 })
            .populate('responded_by', 'username role');

        res.status(200).json({ ticket, responses });
    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ error: 'An error occurred while fetching the ticket' });
    }
}

async function createTicket(req, res) {
    try {
        const { subject, description, category } = req.body;
        const ticketSubject = subject ? subject : `New ${category} Ticket`;

        const attachments = await Promise.all(
            (req.files || []).map(async (file) => {
                const ext = path.extname(file.originalname);
                const key = `tickets/tic_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
                const url = await uploadBufferToR2({
                    key,
                    buffer:      file.buffer,
                    contentType: file.mimetype,
                });
                return {
                    file_path:     url,
                    r2_key:        key,
                    original_name: file.originalname,
                    mime_type:     file.mimetype,
                    size_bytes:    file.size,
                };
            })
        );

        const savedTicket = await new SupportTicket({
            user_id: req.user._id,
            subject: ticketSubject,
            description, category,
            status: 'open',
            attachments,
        }).save();

        res.status(201).json(savedTicket);
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'An error occurred while creating the ticket' });
    }
}

async function updateTicket(req, res) {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // ── 5-minute content-edit window ─────────────────────────
        // Only enforced when content fields (subject / description / category)
        // are being changed. Pure status updates by admins are unrestricted.
        const isContentEdit =
            req.body.subject !== undefined ||
            req.body.description !== undefined ||
            req.body.category !== undefined;

        if (isContentEdit) {
            const EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
            const elapsed = Date.now() - new Date(ticket.createdAt).getTime();
            if (elapsed > EDIT_WINDOW_MS) {
                return res.status(403).json({
                    error: 'Tickets can only be edited within 5 minutes of creation.',
                    code: 'EDIT_WINDOW_EXPIRED',
                });
            }
        }

        if (req.user.role === 'student') {
            if (ticket.user_id.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const { subject, description, category } = req.body;
            ticket.subject = subject ?? ticket.subject;
            ticket.description = description ?? ticket.description;
            ticket.category = category ?? ticket.category;
        } else {
            const { subject, description, status, category } = req.body;
            ticket.subject = subject ?? ticket.subject;
            ticket.description = description ?? ticket.description;
            ticket.status = status ?? ticket.status;
            ticket.category = category ?? ticket.category;
        }

        // Inside updateTicket, replace the req.files block:
if (req.files && req.files.length > 0) {
    const newAttachments = await Promise.all(
        req.files.map(async (file) => {
            const ext = path.extname(file.originalname);
            const key = `tickets/tic_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            const url = await uploadBufferToR2({
                key,
                buffer:      file.buffer,
                contentType: file.mimetype,
            });
            return {
                file_path:     url,
                r2_key:        key,
                original_name: file.originalname,
                mime_type:     file.mimetype,
                size_bytes:    file.size,
            };
        })
    );
    ticket.attachments.push(...newAttachments);
}

        const updatedTicket = await ticket.save();
        res.status(200).json(updatedTicket);
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ error: 'An error occurred while updating the ticket' });
    }
}

async function deleteTicket(req, res) {
    try {
        const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        await TicketResponse.deleteMany({ ticket_id: req.params.id });

        res.status(200).json({ message: 'Ticket and its responses deleted successfully' });
    } catch (err) {
        console.error('Error deleting ticket:', err);
        res.status(500).json({ error: 'An error occurred while deleting the ticket' });
    }
}

async function addResponseToTicket(req, res) {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ error: 'Cannot respond to a closed ticket' });
        }

        const { response_message } = req.body;
        const newResponse = new TicketResponse({
            ticket_id: ticket._id,
            responded_by: req.user.id,
            response_message,
        });

        const savedResponse = await newResponse.save();

        if (ticket.status === 'open' && req.user.role !== 'student') {
            ticket.status = 'in_progress';
            await ticket.save();
        }

        res.status(201).json(savedResponse);
    } catch (err) {
        console.error('Error adding response:', err);
        res.status(500).json({ error: 'An error occurred while adding the response' });
    }
}

async function deleteResponseFromTicket(req, res) {
    try {
        const response = await TicketResponse.findById(req.params.responseId);
        if (!response) {
            return res.status(404).json({ error: 'Response not found' });
        }

        if (response.ticket_id.toString() !== req.params.id) {
            return res.status(400).json({ error: 'Response does not belong to this ticket' });
        }

        if (req.user.role !== 'admin' && response.responded_by.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await TicketResponse.findByIdAndDelete(req.params.responseId);
        res.status(200).json({ message: 'Response deleted successfully' });
    } catch (err) {
        console.error('Error deleting response:', err);
        res.status(500).json({ error: 'An error occurred while deleting the response' });
    }
}

async function deleteTicketAttachment(req, res) {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (req.user.role === 'student' && ticket.user_id.toString() !== req.user.id)
            return res.status(403).json({ error: 'Access denied' });

        const attachmentIndex = ticket.attachments.findIndex(
            att => att._id.toString() === req.params.attachmentId
        );
        if (attachmentIndex === -1) return res.status(404).json({ error: 'Attachment not found' });

        const attachment = ticket.attachments[attachmentIndex];

        // Delete from R2
        if (attachment.r2_key) {
            await deleteObjectFromR2(attachment.r2_key).catch(err =>
                console.error('R2 delete failed (continuing):', err.message)
            );
        }

        ticket.attachments.splice(attachmentIndex, 1);
        await ticket.save();
        res.status(200).json({ message: 'Attachment deleted successfully', ticket });
    } catch (err) {
        console.error('Error deleting attachment:', err);
        res.status(500).json({ error: 'An error occurred while deleting the attachment' });
    }
}

module.exports = {
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    addResponseToTicket,
    deleteResponseFromTicket,
    deleteTicketAttachment,
};