# NotifiU Backend

Express + MongoDB REST API for Announcements, Support Tickets, and FAQs.

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Environment Variables

| Variable       | Description                |
| -------------- | -------------------------- |
| PORT           | Server port (default 5000) |
| MONGO_URI      | MongoDB connection string  |
| JWT_SECRET     | Secret for signing JWTs    |
| JWT_EXPIRES_IN | JWT expiry (e.g. `7d`)     |

---

## API Reference

All protected routes require `Authorization: Bearer <token>` header.

Roles: `admin` · `lecturer` · `student` · `staff`

---

### Announcements

| Method | Route                                              | Access                  | Description                                                                               |
| ------ | -------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/api/announcements`                               | All                     | List announcements (paginated). Query: `status`, `priority`, `module_id`, `page`, `limit` |
| GET    | `/api/announcements/:id`                           | All                     | Get single announcement                                                                   |
| POST   | `/api/announcements`                               | admin, lecturer         | Create announcement (multipart/form-data, up to 5 files)                                  |
| PUT    | `/api/announcements/:id`                           | admin, lecturer (owner) | Update announcement                                                                       |
| DELETE | `/api/announcements/:id`                           | admin                   | Delete announcement                                                                       |
| DELETE | `/api/announcements/:id/attachments/:attachmentId` | admin, lecturer (owner) | Remove attachment                                                                         |

**POST/PUT body fields:**

```
title, content, priority (low|medium|high|urgent),
publish_date, expiry_date, module_id (optional),
status (draft|published|archived), attachments[] (files)
```

---

### FAQs

#### Categories

| Method | Route                      | Access | Description                |
| ------ | -------------------------- | ------ | -------------------------- |
| GET    | `/api/faqs/categories`     | Public | List all categories        |
| POST   | `/api/faqs/categories`     | admin  | Create category            |
| PUT    | `/api/faqs/categories/:id` | admin  | Update category            |
| DELETE | `/api/faqs/categories/:id` | admin  | Delete category + its FAQs |

#### FAQ Items

| Method | Route               | Access | Description                               |
| ------ | ------------------- | ------ | ----------------------------------------- |
| GET    | `/api/faqs`         | Public | List FAQs. Query: `category_id`, `search` |
| GET    | `/api/faqs/grouped` | Public | FAQs grouped by category                  |
| GET    | `/api/faqs/:id`     | Public | Get single FAQ                            |
| POST   | `/api/faqs`         | admin  | Create FAQ                                |
| PUT    | `/api/faqs/:id`     | admin  | Update FAQ                                |
| DELETE | `/api/faqs/:id`     | admin  | Delete FAQ                                |

---

### Support Tickets

| Method | Route                                    | Access                    | Description                                                                         |
| ------ | ---------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/api/tickets`                           | All                       | Own tickets (students), all tickets (admin/staff). Query: `status`, `page`, `limit` |
| GET    | `/api/tickets/:id`                       | All (owner / admin/staff) | Ticket + all responses                                                              |
| POST   | `/api/tickets`                           | All                       | Submit a new ticket                                                                 |
| PATCH  | `/api/tickets/:id/status`                | admin, staff              | Update status (`open`\|`in_progress`\|`resolved`\|`closed`)                         |
| DELETE | `/api/tickets/:id`                       | admin                     | Delete ticket + responses                                                           |
| POST   | `/api/tickets/:id/responses`             | All (owner / admin/staff) | Add response                                                                        |
| DELETE | `/api/tickets/:id/responses/:responseId` | admin                     | Delete response                                                                     |
