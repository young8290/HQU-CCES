import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import multer from 'multer';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupWebSocket } from './ws/index.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gradeRoutes from './routes/grades.js';
import studentRoutes from './routes/students.js';
import scoreRoutes from './routes/scores.js';
import importRoutes from './routes/import.js';
import exportRoutes from './routes/export.js';
import academicYearRoutes from './routes/academicYears.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload middleware for student batch routes
const upload = multer({ storage: multer.memoryStorage() });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/students', (req, res, next) => {
  if (req.path.startsWith('/batch') && req.method === 'POST') {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
}, studentRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/academic-years', academicYearRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'comprehensive-eval-backend',
    status: 'ok',
    health: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// WebSocket
setupWebSocket(server);

// Start
server.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📡 WebSocket on ws://localhost:${config.port}/ws`);
});

export default app;
