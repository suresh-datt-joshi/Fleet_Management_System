import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import config from './config/index.js';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { initSockets } from './socket/index.js';
import { startGpsSimulator, stopGpsSimulator } from './jobs/gpsSimulator.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
// Health check (excluded from rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fleet Management API is running',
    version: config.apiVersion,
    timestamp: new Date().toISOString(),
  });
});

app.use(globalLimiter);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(`/api/${config.apiVersion}`, routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

initSockets(io);

export { app, httpServer, io };

const startServer = async () => {
  if (process.env.MONGODB_URI) {
    await connectDB();
  } else {
    console.warn('MONGODB_URI not set — running without database connection');
  }

  if (process.env.DISABLE_GPS_SIMULATOR !== 'true') {
    startGpsSimulator();
  }

  httpServer.listen(config.port, () => {
    console.log(`Server running in ${config.env} mode on port ${config.port}`);
  });
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  startServer();
}

export { startServer };
