require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const lecturerRoutes = require('./routes/lecturerRoutes');
const moduleRoutes = require("./routes/moduleRoutes");
const authRoutes = require('./routes/authRoutes');
const announcementsRouter = require('./routes/announcementsRoutes');
const ticketsRouter = require('./routes/ticketsRoutes');
const chatRouter = require('./routes/chatRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const jobPostRoutes = require('./routes/jobPostRoutes');
const eventRoutes = require('./routes/eventRoutes');
const { startEventNotificationCron } = require('./utils/eventNotificationCron');

// Initialize Express
const app = express();

// 1. CORS Configuration
// In development: reflect every origin so any device on any network can connect.
// In production:  restrict to the comma-separated list in ALLOWED_ORIGINS env var.
const productionOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: process.env.NODE_ENV === 'production'
            ? productionOrigins
            : true,          // true = reflect the request Origin (allows any device)
        credentials: true,
    })
);

// 2. Security & Parsing Middleware
app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false, // Allow cross-origin images/files
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// 3. Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// 5. Routes
app.use('/api/users', userRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use("/api", moduleRoutes);;
app.use('/api/auth', authRoutes);
app.use('/api', announcementsRouter);
app.use('/api', ticketsRouter);
app.use('/api', chatRouter);
app.use('/api/jobs', jobPostRoutes);
app.use('/api/events', eventRoutes);


// Root Endpoint
app.get('/', (req, res) => {
    res.send('NotifiU API is Running...');
});

// 6. Error Handling (Must be after routes)
app.use(notFound);
app.use(errorHandler);

// 7. Server Start Logic
const PORT = process.env.PORT || 5005;

const startServer = async () => {
    try {
        console.log('--- Initializing System ---');
        await connectDB();
        app.listen(PORT, '0.0.0.0',() => {
            console.log(`🚀 Server listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
        startEventNotificationCron();
    } catch (error) {
        console.error(`❌ ERROR: Could not start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();