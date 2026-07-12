import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import path from 'path';

import prisma from './config/prisma';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/bookings.routes';
import eventRoutes from './routes/events.routes';
import exportRoutes from './routes/export.routes';
import messageRoutes from './routes/messages.routes';
import userRoutes from './routes/users.routes';
import { completeExpiredEvents } from './services/event.service';
import { trainModel } from './services/recommendation.service';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
	cors({
		origin: JSON.parse(process.env.FRONTEND_URL || '["http://localhost:4200"]'),
		credentials: true
	})
);

// Body parsing - 20mb limit to accommodate base64-encoded event photos
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
		message: err.message || 'Internal Server Error'
	});
});

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const runCompleteExpired = async () => {
	const count = await completeExpiredEvents();
	if (count > 0) console.log(`Marked ${count} expired event(s) as COMPLETED`);
};

const runTrainModel = async () => {
	await trainModel();
	console.log('Recommendation model trained');
};

const onListening = async () => {
	console.log(`${isProduction ? 'HTTP' : 'HTTPS'} server running on port ${PORT}`);
	await runCompleteExpired();
	await runTrainModel();
	setInterval(runCompleteExpired, 5 * 60 * 1000);
	setInterval(runTrainModel, 60 * 60 * 1000);
};

let server: http.Server;

if (isProduction) {
	server = http.createServer(app);
} else {
	const keyPath = path.resolve(process.env.SSL_KEY_PATH || './certs/key.pem');
	const certPath = path.resolve(process.env.SSL_CERT_PATH || './certs/cert.pem');

	if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
		console.error('SSL certificate files not found.');
		console.error(`Expected key:  ${keyPath}`);
		console.error(`Expected cert: ${certPath}`);
		console.error('Generate them with:');
		console.error(
			'  mkdir -p certs && openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"'
		);
		process.exit(1);
	}

	server = https.createServer(
		{ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
		app
	) as unknown as http.Server;
}

server.listen(PORT, onListening);

process.on('SIGTERM', async () => {
	await prisma.$disconnect();
	server.close();
});
process.on('SIGINT', async () => {
	await prisma.$disconnect();
	server.close();
});

export default app;
