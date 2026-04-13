const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'user_id is required'],
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: [255, 'Subject cannot exceed 255 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        category: {
            type: String,
            enum: ['Academic', 'Administrative', 'Technical', 'General', 'Other'],
            default: 'General',
        },
    },
    {
        timestamps: true,
    }
);

supportTicketSchema.index({ user_id: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

const ticketResponseSchema = new mongoose.Schema(
    {
        ticket_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SupportTicket',
            required: [true, 'ticket_id is required'],
        },
        responded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'responded_by is required'],
        },
        response_message: {
            type: String,
            required: [true, 'Response message is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

ticketResponseSchema.index({ ticket_id: 1, createdAt: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const TicketResponse = mongoose.model('TicketResponse', ticketResponseSchema);

module.exports = { SupportTicket, TicketResponse };
