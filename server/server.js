/**
 * ScholarConnect — Express Server Entry Point
 *
 * Sets up middleware, passport strategies, routes, and error handling.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const { pool, testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize passport strategies
require('./config/auth');

const app = express();
const PORT = process.env.PORT || 5002;

// --- Security & Utility Middleware ---
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// --- API Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/mentors', require('./routes/mentor.routes'));
app.use('/api/teams', require('./routes/team.routes'));
app.use('/api/collab', require('./routes/collab.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/workspace', require('./routes/workspace.routes'));
// app.use('/api/copilot', require('./routes/copilot.routes'));
app.use('/api/reputation', require('./routes/reputation.routes'));
app.use('/api/network', require('./routes/network.routes'));

// Health check
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ScholarConnect API is running' });
});

// --- Global Error Handling ---
app.use(errorHandler);

// --- Start Server ---
const startServer = async () => {
  try {
    // Ensure DB connection before starting
    await testConnection();

    app.listen(PORT, () => {
      console.log(`
🚀 ScholarConnect Backend Running
--------------------------------
📡 Port: ${PORT}
🌍 Env:  ${process.env.NODE_ENV || 'development'}
📦 DB:   Connected (SQLite)
--------------------------------
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
