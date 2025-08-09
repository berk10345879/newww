import { Pool } from 'pg';

export type User = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  credits: number;
  createdAt: string;
  lastLoginAt?: string;
};

export type VideoSession = {
  id: string;
  creatorUserId: string;
  peerUserId?: string;
  startedAt: string;
  endedAt?: string;
  costCredits: number;
};

export type Note = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  category: string;
  priceCredits: number;
  storagePath: string;
  downloads: number;
  rating: number;
  createdAt: string;
};

export type Teacher = {
  id: string;
  name: string;
  subjects: string[];
  hourlyCredits: number;
  experienceYears: number;
  rating: number;
};

export type Booking = {
  id: string;
  teacherId: string;
  userId: string;
  startIso: string;
  endIso: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  amountCredits: number;
  source: 'stripe' | 'admin' | 'system';
  createdAt: string;
  stripeSessionId?: string;
};

export interface DataStore {
  getOrCreateUser(user: Pick<User, 'id' | 'email'>): Promise<User>;
  setUserProfile(userId: string, profile: Partial<User>): Promise<User>;
  addCredits(userId: string, credits: number, meta?: Partial<Transaction>): Promise<User>;
  consumeCredits(userId: string, credits: number, reason?: string): Promise<User>;
  getUserById(userId: string): Promise<User | undefined>;

  createVideoSession(creatorUserId: string, costCredits: number): Promise<VideoSession>;
  endVideoSession(sessionId: string): Promise<VideoSession | undefined>;
  listVideoSessions(userId: string): Promise<VideoSession[]>;

  createNote(note: Omit<Note, 'id' | 'downloads' | 'rating' | 'createdAt'>): Promise<Note>;
  listNotes(params?: { category?: string; order?: 'popular' | 'latest' }): Promise<Note[]>;
  incrementNoteDownload(noteId: string): Promise<Note | undefined>;

  listTeachers(): Promise<Teacher[]>;
  createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<Booking>;
  setBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking | undefined>;

  recordTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  stats(): Promise<{ totalSessions: number; totalRevenueCredits: number; users: number; notes: number; downloads: number }>; 
}

class MemoryStore implements DataStore {
  private users = new Map<string, User>();
  private sessions = new Map<string, VideoSession>();
  private notes = new Map<string, Note>();
  private teachers: Teacher[] = [
    { id: 't1', name: 'Ayşe Öğretmen', subjects: ['Matematik', 'Fizik'], hourlyCredits: 5, experienceYears: 6, rating: 4.7 },
    { id: 't2', name: 'Mehmet Hoca', subjects: ['Kimya', 'Biyoloji'], hourlyCredits: 4, experienceYears: 4, rating: 4.5 }
  ];
  private bookings = new Map<string, Booking>();
  private transactions: Transaction[] = [];

  async getOrCreateUser(user: Pick<User, 'id' | 'email'>): Promise<User> {
    const existing = this.users.get(user.id);
    if (existing) return existing;
    const created: User = { id: user.id, email: user.email, credits: 3, createdAt: new Date().toISOString() };
    this.users.set(created.id, created);
    return created;
  }

  async setUserProfile(userId: string, profile: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('user_not_found');
    const updated = { ...user, ...profile } as User;
    this.users.set(userId, updated);
    return updated;
  }

  async addCredits(userId: string, credits: number, meta?: Partial<Transaction>): Promise<User> {
    const user = await this.getOrCreateUser({ id: userId, email: `${userId}@example.com` });
    user.credits += credits;
    this.users.set(userId, user);
    if (credits > 0) await this.recordTransaction({ userId, amountCredits: credits, source: meta?.source || 'system', stripeSessionId: meta?.stripeSessionId });
    return user;
  }

  async consumeCredits(userId: string, credits: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('user_not_found');
    if (user.credits < credits) throw new Error('insufficient_credits');
    user.credits -= credits;
    this.users.set(userId, user);
    return user;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async createVideoSession(creatorUserId: string, costCredits: number): Promise<VideoSession> {
    const id = `vs_${Math.random().toString(36).slice(2)}`;
    const session: VideoSession = { id, creatorUserId, startedAt: new Date().toISOString(), costCredits };
    this.sessions.set(id, session);
    return session;
  }

  async endVideoSession(sessionId: string): Promise<VideoSession | undefined> {
    const s = this.sessions.get(sessionId);
    if (!s) return undefined;
    s.endedAt = new Date().toISOString();
    this.sessions.set(sessionId, s);
    return s;
  }

  async listVideoSessions(userId: string): Promise<VideoSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.creatorUserId === userId || s.peerUserId === userId);
  }

  async createNote(note: Omit<Note, 'id' | 'downloads' | 'rating' | 'createdAt'>): Promise<Note> {
    const id = `note_${Math.random().toString(36).slice(2)}`;
    const created: Note = { ...note, id, downloads: 0, rating: 0, createdAt: new Date().toISOString() };
    this.notes.set(id, created);
    return created;
  }

  async listNotes(params?: { category?: string; order?: 'popular' | 'latest' }): Promise<Note[]> {
    let list = Array.from(this.notes.values());
    if (params?.category) list = list.filter(n => n.category === params.category);
    if (params?.order === 'popular') list = list.sort((a, b) => b.downloads - a.downloads);
    else list = list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }

  async incrementNoteDownload(noteId: string): Promise<Note | undefined> {
    const note = this.notes.get(noteId);
    if (!note) return undefined;
    note.downloads += 1;
    this.notes.set(noteId, note);
    return note;
  }

  async listTeachers(): Promise<Teacher[]> {
    return this.teachers;
  }

  async createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<Booking> {
    const id = `bk_${Math.random().toString(36).slice(2)}`;
    const created: Booking = { ...booking, id, status: 'pending', createdAt: new Date().toISOString() };
    this.bookings.set(id, created);
    return created;
  }

  async setBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking | undefined> {
    const b = this.bookings.get(bookingId);
    if (!b) return undefined;
    b.status = status;
    this.bookings.set(bookingId, b);
    return b;
  }

  async recordTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const record: Transaction = { ...tx, id: `tx_${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() };
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
}

export function getDataStore(): DataStore {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new MemoryStore();
  }
  // Placeholder: a real Postgres implementation can be added here. For now, fallback to memory.
  // eslint-disable-next-line no-console
  console.warn('[datastore] DATABASE_URL provided but Postgres adapter not implemented. Using in-memory store.');
  return new MemoryStore();
}