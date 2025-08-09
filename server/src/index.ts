import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { registerSignaling } from './webrtc/signaling.js';
import { registerCreditRoutes } from './routes/credits.js';
import { registerPaymentRoutes } from './routes/payments.js';
import { registerNoteRoutes } from './routes/notes.js';
import { registerTeacherRoutes } from './routes/teachers.js';
import { registerBookingRoutes } from './routes/bookings.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerVideoRoutes } from './routes/video.js';
import { getDataStore } from './store/datastore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5174);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// Data store (in-memory fallback)
const dataStore = getDataStore();
app.set('dataStore', dataStore);

// Routes
registerCreditRoutes(app);
registerPaymentRoutes(app);
registerNoteRoutes(app);
registerTeacherRoutes(app);
registerBookingRoutes(app);
registerAdminRoutes(app);
registerVideoRoutes(app);

// Static serve client build in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

// WebSocket signaling for WebRTC
registerSignaling(io, dataStore);

server.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});