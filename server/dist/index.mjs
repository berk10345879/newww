// src/index.ts
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";

// src/webrtc/signaling.ts
function registerSignaling(io2, _store) {
  const nsp = io2.of("/ws");
  nsp.on("connection", (socket) => {
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("peer-joined", socket.id);
    });
    socket.on("signal", (payload) => {
      const { roomId, description, candidate } = payload;
      socket.to(roomId).emit("signal", { from: socket.id, description, candidate });
    });
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("peer-left", socket.id);
    });
    socket.on("disconnect", () => {
    });
  });
}

// src/routes/credits.ts
function requireUserId(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) throw new Error("missing_user_id");
  return userId;
}
function registerCreditRoutes(app2) {
  app2.get("/api/credits", async (req, res) => {
    try {
      const userId = requireUserId(req);
      const store = app2.get("dataStore");
      const user = await store.getOrCreateUser({ id: userId, email: `${userId}@example.com` });
      res.json({ credits: user.credits, user });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/credits/consume", async (req, res) => {
    try {
      const userId = requireUserId(req);
      const amount = Number(req.body?.amount || 0);
      if (!amount || amount <= 0) return res.status(400).json({ error: "invalid_amount" });
      const store = app2.get("dataStore");
      const user = await store.consumeCredits(userId, amount, "manual");
      res.json({ credits: user.credits });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/credits/add", async (req, res) => {
    try {
      const userId = requireUserId(req);
      const amount = Number(req.body?.amount || 0);
      if (!amount || amount <= 0) return res.status(400).json({ error: "invalid_amount" });
      const store = app2.get("dataStore");
      const user = await store.addCredits(userId, amount, { source: "admin" });
      res.json({ credits: user.credits });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/payments.ts
import Stripe from "stripe";
var stripeSecret = process.env.STRIPE_SECRET_KEY || "";
var stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-09-30.acacia" }) : null;
var CREDIT_PACKAGES = {
  small: { credits: 10, amountUsd: 5, name: "10 Kredi" },
  medium: { credits: 25, amountUsd: 10, name: "25 Kredi" },
  large: { credits: 50, amountUsd: 18, name: "50 Kredi" }
};
function requireUserId2(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) throw new Error("missing_user_id");
  return userId;
}
function registerPaymentRoutes(app2) {
  app2.post("/api/pay/create-session", async (req, res) => {
    try {
      if (!stripe) return res.status(400).json({ error: "stripe_not_configured" });
      const userId = requireUserId2(req);
      const pkgKey = String(req.body.packageKey);
      const pkg = CREDIT_PACKAGES[pkgKey];
      if (!pkg) return res.status(400).json({ error: "invalid_package" });
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: pkg.name },
              unit_amount: Math.round(pkg.amountUsd * 100)
            },
            quantity: 1
          }
        ],
        success_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/buy-credits?success=true&session_id={CHECKOUT_SESSION_ID}&uid=${encodeURIComponent(userId)}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/buy-credits?canceled=true`,
        metadata: { userId, credits: String(pkg.credits) }
      });
      res.json({ id: session.id, url: session.url });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/pay/success", async (req, res) => {
    try {
      if (!stripe) return res.status(400).json({ error: "stripe_not_configured" });
      const sessionId = String(req.body.sessionId || "");
      const userId = requireUserId2(req);
      if (!sessionId) return res.status(400).json({ error: "missing_session" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") return res.status(400).json({ error: "not_paid" });
      const credits = Number(session.metadata?.credits || 0) || 0;
      if (!credits) return res.status(400).json({ error: "missing_credits" });
      const store = app2.get("dataStore");
      const user = await store.addCredits(userId, credits, { source: "stripe", stripeSessionId: sessionId });
      res.json({ ok: true, credits: user.credits });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/notes.ts
function requireUserId3(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) throw new Error("missing_user_id");
  return userId;
}
function registerNoteRoutes(app2) {
  app2.post("/api/notes", async (req, res) => {
    try {
      const userId = requireUserId3(req);
      const { title, description, category, priceCredits, storagePath } = req.body || {};
      if (!title || !category || !storagePath) return res.status(400).json({ error: "invalid_note" });
      const store = app2.get("dataStore");
      const note = await store.createNote({ ownerUserId: userId, title, description, category, priceCredits: Number(priceCredits || 1), storagePath });
      res.json({ note });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/notes", async (req, res) => {
    try {
      const category = req.query.category;
      const order = req.query.order || "latest";
      const store = app2.get("dataStore");
      const notes = await store.listNotes({ category, order });
      res.json({ notes });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/notes/:id/purchase", async (req, res) => {
    try {
      const userId = requireUserId3(req);
      const noteId = req.params.id;
      const store = app2.get("dataStore");
      await store.consumeCredits(userId, 1, "note_purchase");
      const updated = await store.incrementNoteDownload(noteId);
      res.json({ ok: true, note: updated });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/teachers.ts
function registerTeacherRoutes(app2) {
  app2.get("/api/teachers", async (_req, res) => {
    try {
      const store = app2.get("dataStore");
      const teachers = await store.listTeachers();
      res.json({ teachers });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/bookings.ts
function requireUserId4(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) throw new Error("missing_user_id");
  return userId;
}
function registerBookingRoutes(app2) {
  app2.post("/api/bookings", async (req, res) => {
    try {
      const userId = requireUserId4(req);
      const { teacherId, startIso, endIso, hourlyCredits } = req.body || {};
      if (!teacherId || !startIso || !endIso) return res.status(400).json({ error: "invalid_booking" });
      const store = app2.get("dataStore");
      const credits = Number(hourlyCredits || 1);
      await store.consumeCredits(userId, credits, "teacher_booking");
      const booking = await store.createBooking({ teacherId, userId, startIso, endIso });
      res.json({ booking });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/bookings/:id/status", async (req, res) => {
    try {
      const status = String(req.body?.status || "pending");
      const store = app2.get("dataStore");
      const updated = await store.setBookingStatus(req.params.id, status);
      res.json({ booking: updated });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/admin.ts
function registerAdminRoutes(app2) {
  app2.get("/api/admin/stats", async (_req, res) => {
    try {
      const store = app2.get("dataStore");
      const snapshot = await store.stats();
      res.json(snapshot);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/routes/video.ts
function requireUserId5(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.userId;
  if (!userId) throw new Error("missing_user_id");
  return userId;
}
function registerVideoRoutes(app2) {
  app2.post("/api/video/start", async (req, res) => {
    try {
      const userId = requireUserId5(req);
      const store = app2.get("dataStore");
      const session = await store.createVideoSession(userId, 1);
      res.json({ session });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.post("/api/video/:id/end", async (req, res) => {
    try {
      const userId = requireUserId5(req);
      const store = app2.get("dataStore");
      const s = await store.endVideoSession(req.params.id);
      if (!s) return res.status(404).json({ error: "not_found" });
      await store.consumeCredits(userId, s.costCredits, "video_session");
      res.json({ session: s });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/video/history", async (req, res) => {
    try {
      const userId = requireUserId5(req);
      const store = app2.get("dataStore");
      const list = await store.listVideoSessions(userId);
      res.json({ sessions: list });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}

// src/store/datastore.ts
var MemoryStore = class {
  users = /* @__PURE__ */ new Map();
  sessions = /* @__PURE__ */ new Map();
  notes = /* @__PURE__ */ new Map();
  teachers = [
    { id: "t1", name: "Ay\u015Fe \xD6\u011Fretmen", subjects: ["Matematik", "Fizik"], hourlyCredits: 5, experienceYears: 6, rating: 4.7 },
    { id: "t2", name: "Mehmet Hoca", subjects: ["Kimya", "Biyoloji"], hourlyCredits: 4, experienceYears: 4, rating: 4.5 }
  ];
  bookings = /* @__PURE__ */ new Map();
  transactions = [];
  async getOrCreateUser(user) {
    const existing = this.users.get(user.id);
    if (existing) return existing;
    const created = { id: user.id, email: user.email, credits: 3, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.users.set(created.id, created);
    return created;
  }
  async setUserProfile(userId, profile) {
    const user = this.users.get(userId);
    if (!user) throw new Error("user_not_found");
    const updated = { ...user, ...profile };
    this.users.set(userId, updated);
    return updated;
  }
  async addCredits(userId, credits, meta) {
    const user = await this.getOrCreateUser({ id: userId, email: `${userId}@example.com` });
    user.credits += credits;
    this.users.set(userId, user);
    if (credits > 0) await this.recordTransaction({ userId, amountCredits: credits, source: meta?.source || "system", stripeSessionId: meta?.stripeSessionId });
    return user;
  }
  async consumeCredits(userId, credits) {
    const user = this.users.get(userId);
    if (!user) throw new Error("user_not_found");
    if (user.credits < credits) throw new Error("insufficient_credits");
    user.credits -= credits;
    this.users.set(userId, user);
    return user;
  }
  async getUserById(userId) {
    return this.users.get(userId);
  }
  async createVideoSession(creatorUserId, costCredits) {
    const id = `vs_${Math.random().toString(36).slice(2)}`;
    const session = { id, creatorUserId, startedAt: (/* @__PURE__ */ new Date()).toISOString(), costCredits };
    this.sessions.set(id, session);
    return session;
  }
  async endVideoSession(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return void 0;
    s.endedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.sessions.set(sessionId, s);
    return s;
  }
  async listVideoSessions(userId) {
    return Array.from(this.sessions.values()).filter((s) => s.creatorUserId === userId || s.peerUserId === userId);
  }
  async createNote(note) {
    const id = `note_${Math.random().toString(36).slice(2)}`;
    const created = { ...note, id, downloads: 0, rating: 0, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.notes.set(id, created);
    return created;
  }
  async listNotes(params) {
    let list = Array.from(this.notes.values());
    if (params?.category) list = list.filter((n) => n.category === params.category);
    if (params?.order === "popular") list = list.sort((a, b) => b.downloads - a.downloads);
    else list = list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }
  async incrementNoteDownload(noteId) {
    const note = this.notes.get(noteId);
    if (!note) return void 0;
    note.downloads += 1;
    this.notes.set(noteId, note);
    return note;
  }
  async listTeachers() {
    return this.teachers;
  }
  async createBooking(booking) {
    const id = `bk_${Math.random().toString(36).slice(2)}`;
    const created = { ...booking, id, status: "pending", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.bookings.set(id, created);
    return created;
  }
  async setBookingStatus(bookingId, status) {
    const b = this.bookings.get(bookingId);
    if (!b) return void 0;
    b.status = status;
    this.bookings.set(bookingId, b);
    return b;
  }
  async recordTransaction(tx) {
    const record = { ...tx, id: `tx_${Math.random().toString(36).slice(2)}`, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.transactions.push(record);
    return record;
  }
  async stats() {
    return {
      totalSessions: this.sessions.size,
      totalRevenueCredits: this.transactions.reduce((sum, t) => sum + t.amountCredits, 0),
      users: this.users.size,
      notes: this.notes.size,
      downloads: Array.from(this.notes.values()).reduce((sum, n) => sum + n.downloads, 0)
    };
  }
};
function getDataStore() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new MemoryStore();
  }
  console.warn("[datastore] DATABASE_URL provided but Postgres adapter not implemented. Using in-memory store.");
  return new MemoryStore();
}

// src/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var PORT = Number(process.env.PORT || 5174);
var CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
var app = express();
var server = http.createServer(app);
var io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});
var dataStore = getDataStore();
app.set("dataStore", dataStore);
registerCreditRoutes(app);
registerPaymentRoutes(app);
registerNoteRoutes(app);
registerTeacherRoutes(app);
registerBookingRoutes(app);
registerAdminRoutes(app);
registerVideoRoutes(app);
var clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"));
});
registerSignaling(io, dataStore);
server.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
