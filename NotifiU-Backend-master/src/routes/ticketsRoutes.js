const express = require('express');
const { getTickets, getTicketById, createTicket, updateTicket, deleteTicket, addResponseToTicket, deleteResponseFromTicket, deleteTicketAttachment } = require('../controllers/ticketsController');
const { protect } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const uploadTicket = require('../middlewares/uploadTicketMiddleware');

const router = express.Router();

router.get("/tickets", protect, getTickets);
router.get("/tickets/:id", protect, getTicketById);
router.post("/tickets", protect, uploadTicket.array("attachments", 5), createTicket);
router.patch("/tickets/:id", protect, uploadTicket.array("attachments", 5), updateTicket);
router.delete("/tickets/:id", protect, authorizeRoles("superadmin"), deleteTicket);
router.delete("/tickets/:id/attachments/:attachmentId", protect, deleteTicketAttachment);
router.post("/tickets/:id/responses", protect, addResponseToTicket);
router.delete("/tickets/:id/responses/:responseId", protect, deleteResponseFromTicket);

module.exports = router;