import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import eventRoutes from './routes/events.routes';
import bookingRoutes from './routes/bookings.routes';
import messageRoutes from './routes/messages.routes';
import exportRoutes from './routes/export.routes';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// NOTE: For production, use HTTPS with SSL certificates:
// import https from 'https';
// import fs from 'fs';
// const options = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };
// https.createServer(options, app).listen(PORT, () => console.log(`HTTPS server on port ${PORT}`));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
