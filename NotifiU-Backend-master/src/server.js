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

// Initialize Express
const app = express();

// 1. CORS Configuration
app.use(
    cors({
        origin: [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://192.168.8.168:8082',
    'http://172.20.10.2:8085',  // Current phone port
    'http://172.20.10.2:5005',
    'http://172.20.10.2:8081',
    /\.exp\.direct$/,  // allows Expo tunnel URLs
],
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
    } catch (error) {
        console.error(`❌ ERROR: Could not start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
