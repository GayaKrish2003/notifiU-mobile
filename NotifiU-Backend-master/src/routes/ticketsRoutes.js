const express = require('express');
const { getTickets, getTicketById, createTicket, updateTicket, deleteTicket, addResponseToTicket, deleteResponseFromTicket } = require('../controllers/ticketsController');
const { protect } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get("/tickets", protect, getTickets);
router.get("/tickets/:id", protect, getTicketById);
router.post("/tickets", protect, createTicket);
router.patch("/tickets/:id", protect, updateTicket);
router.delete("/tickets/:id", protect, authorizeRoles("superadmin"), deleteTicket);
router.post("/tickets/:id/responses", protect, addResponseToTicket);
router.delete("/tickets/:id/responses/:responseId", protect, deleteResponseFromTicket);

module.exports = router;