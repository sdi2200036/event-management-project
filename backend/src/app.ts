import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import eventRoutes from './routes/events.routes';
import bookingRoutes from './routes/bookings.routes';
import messageRoutes from './routes/messages.routes';
import exportRoutes from './routes/export.routes';
import { completeExpiredEvents } from './services/event.service';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));

// Body parsing — 20mb limit to accommodate base64-encoded event photos
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/export', exportRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 3000;
const keyPath = path.resolve(process.env.SSL_KEY_PATH || './certs/key.pem');
const certPath = path.resolve(process.env.SSL_CERT_PATH || './certs/cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('SSL certificate files not found.');
  console.error(`Expected key:  ${keyPath}`);
  console.error(`Expected cert: ${certPath}`);
  console.error('Generate them with:');
  console.error('  mkdir -p certs && openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"');
  process.exit(1);
}

const sslOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const runCompleteExpired = async () => {
  const count = await completeExpiredEvents();
  if (count > 0) console.log(`Marked ${count} expired event(s) as COMPLETED`);
};

https.createServer(sslOptions, app).listen(PORT, async () => {
  console.log(`HTTPS server running on port ${PORT}`);
  await runCompleteExpired();
  setInterval(runCompleteExpired, 60 * 60 * 1000);
});

export default app;
