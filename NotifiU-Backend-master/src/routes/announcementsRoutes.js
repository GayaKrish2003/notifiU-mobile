const express = require("express");
const {
  getAnnouncementById,
  getAnnouncements,
  deleteAnnouncement,
  deleteAnnouncementAttachment,
  createAnnouncement,
  updateAnnouncement,
} = require("../controllers/announcementsController");
const { protect } = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const uploadAnnouncement = require("../middlewares/uploadAnnouncementMiddleware");

const router = express.Router();

router.get("/announcements", protect, getAnnouncements);
router.get("/announcements/:id", protect, getAnnouncementById);
router.post(
  "/announcements",
  protect,
  authorizeRoles("superadmin", "lecturer"),
  uploadAnnouncement.array("attachments", 5),
  createAnnouncement,
);
router.put(
  "/announcements/:id",
  protect,
  authorizeRoles("superadmin", "lecturer"),
  updateAnnouncement,
);
router.delete(
  "/announcements/:id",
  protect,
  authorizeRoles("superadmin", "lecturer"),
  deleteAnnouncement,
);
router.delete(
  "/announcements/:id/attachments/:attachmentId",
  protect,
  authorizeRoles("superadmin", "lecturer"),
  deleteAnnouncementAttachment,
);

module.exports = router;