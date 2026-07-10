import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Import configurations and routers
dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Load root .env
import apiRouter from './routes';
import { errorHandler } from './middlewares/error';
import { apiLimiter } from './middlewares/rateLimit';
import { initSocket } from './socket';
import { NotFoundError } from './utils/errors';
import { startScheduledPostPublisher } from './jobs/scheduledPosts';
import { startCleanupJobs } from './jobs/cleanup';
import { verifyCloudinaryCredentials } from './utils/cloudinary';

const app = express();
const server = http.createServer(app);
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawAllowedOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

// 1. Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false, // Required to serve images to frontend
  })
);

app.use(morgan('dev'));
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// 4. API Routes
app.use('/api', apiLimiter, apiRouter);

// 5. Unhandled Route handler
app.all('*', (req: any, res: any, next: any) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// 6. Global Error Handler
app.use(errorHandler);

// 7. Initialize Realtime Sockets
initSocket(server);

// 8. Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Nexus Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  void verifyCloudinaryCredentials().then((ok) => {
    console.log(ok ? '☁️ Cloudinary ready' : '⚠️ Cloudinary not verified');
  });
  startScheduledPostPublisher();
  startCleanupJobs();
});
