/**
 * Web-compatible database layer using localStorage.
 *
 * DB_VERSION is bumped whenever the schema or seed policy changes.
 * If the stored version doesn't match, localStorage is wiped so
 * no stale demo data survives across deploys.
 */

const STORAGE_KEY = 'ruralconnect_db';
const VERSION_KEY = 'ruralconnect_db_version';
const DB_VERSION = '4'; // bump this to force a clean slate

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const loadStore = (): Record<string, any[]> => {
  try {
    // Wipe if version mismatch (removes old demo data)
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== DB_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, DB_VERSION);
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStore = (s: Record<string, any[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('Storage save error', e);
  }
};

let store = loadStore();

const getTable = (name: string): any[] => store[name] ?? [];
const setTable = (name: string, rows: any[]) => {
  store[name] = rows;
  saveStore(store);
};

// ─── Init ─────────────────────────────────────────────────────────────────────
export const initializeDatabase = async () => {
  if (!store['users'])         setTable('users', []);
  if (!store['locations'])     setTable('locations', []);
  if (!store['visit_history']) setTable('visit_history', []);
  if (!store['sync_queue'])    setTable('sync_queue', []);
  if (!store['analytics'])     setTable('analytics', []);
  if (!store['messages'])      setTable('messages', []);

  await seedDefaultAccounts();
};

/**
 * Creates the three built-in accounts if they don't already exist.
 * These are real system accounts — not demo data.
 * Locations are NEVER pre-seeded; only users mark real locations.
 */
const seedDefaultAccounts = async () => {
  const defaults = [
    {
      id: 'sys_admin_001',
      name: 'Admin',
      email: 'admin@ruralconnect.com',
      password: 'Admin@123',
      role: 'admin',
      points: 0,
    },
    {
      id: 'sys_volunteer_001',
      name: 'Volunteer',
      email: 'volunteer@ruralconnect.com',
      password: 'Volunteer@123',
      role: 'volunteer',
      points: 0,
    },
    {
      id: 'sys_user_001',
      name: 'User',
      email: 'user@ruralconnect.com',
      password: 'User@123',
      role: 'user',
      points: 0,
    },
  ];

  const users = getTable('users');
  for (const account of defaults) {
    const exists = users.find((u) => u.email === account.email);
    if (!exists) {
      users.push(account);
    }
  }
  setTable('users', users);
};

// ─── Stubs kept for type-compatibility ────────────────────────────────────────
export const executeQuery  = async (_sql: string, _p: any[] = []): Promise<any[]> => [];
export const executeUpdate = async (_sql: string, _p: any[] = []): Promise<any>   => {};

// ─── Locations ────────────────────────────────────────────────────────────────
export const getAllLocations = async () =>
  [...getTable('locations')].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

export const getLocationById = async (id: string) =>
  getTable('locations').find((l) => l.id === id) ?? null;

export const getLocationsByStatus = async (status: string) =>
  getTable('locations').filter((l) => l.status === status);

export const getLocationsByUser = async (userId: string) =>
  getTable('locations').filter((l) => l.userId === userId);

export const insertLocation = async (location: any) => {
  const rows = getTable('locations');
  rows.unshift(location);
  setTable('locations', rows);
};

export const updateLocationStatus = async (locationId: string, status: string) => {
  const rows = getTable('locations').map((l) =>
    l.id === locationId
      ? { ...l, status, updatedAt: new Date().toISOString() }
      : l
  );
  setTable('locations', rows);
};

// ─── Visit history ────────────────────────────────────────────────────────────
export const insertVisitHistory = async (visit: any) => {
  const rows = getTable('visit_history');
  // Ensure images are stored as a JSON string array
  const record = {
    ...visit,
    images: Array.isArray(visit.images)
      ? JSON.stringify(visit.images)
      : visit.images ?? '[]',
  };
  rows.unshift(record);
  setTable('visit_history', rows);
};

export const getVisitHistory = async (locationId: string) =>
  getTable('visit_history')
    .filter((v) => v.locationId === locationId)
    .map((v) => ({
      ...v,
      // Always return images as a parsed array
      images: (() => {
        try {
          if (Array.isArray(v.images)) return v.images;
          return JSON.parse(v.images || '[]');
        } catch {
          return [];
        }
      })(),
    }));

// ─── Sync queue ───────────────────────────────────────────────────────────────
export const getUnsyncedItems = async () =>
  getTable('sync_queue').filter((i) => !i.synced);

export const addToSyncQueue = async (action: string, tableName: string, data: any) => {
  const rows = getTable('sync_queue');
  rows.push({
    id: `sq_${Date.now()}`,
    action,
    table_name: tableName,
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
    synced: 0,
  });
  setTable('sync_queue', rows);
};

export const markSyncQueueAsSynced = async (id: string) => {
  const rows = getTable('sync_queue').map((i) =>
    i.id === id ? { ...i, synced: 1 } : i
  );
  setTable('sync_queue', rows);
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUserByEmail = async (email: string) =>
  getTable('users').find((u) => u.email === email.toLowerCase().trim()) ?? null;

export const insertUser = async (user: any) => {
  const rows = getTable('users');
  rows.push({ ...user, email: user.email.toLowerCase().trim() });
  setTable('users', rows);
};

export const getUserById = async (id: string) =>
  getTable('users').find((u) => u.id === id) ?? null;

export const updateUserPoints = async (userId: string, points: number) => {
  const rows = getTable('users').map((u) => {
    // Admin never earns points — enforce at DB level
    if (u.id === userId && u.role !== 'admin') {
      return { ...u, points: (u.points || 0) + points };
    }
    return u;
  });
  setTable('users', rows);
};

export const getAllUsers = async () => getTable('users');

// ─── Leaderboard ──────────────────────────────────────────────────────────────
/**
 * Returns only non-admin users who have earned at least 1 point,
 * sorted by points descending.
 */
export const getLeaderboard = async (limit = 10) =>
  [...getTable('users')]
    .filter((u) => u.role !== 'admin' && (u.points || 0) > 0)   // exclude admins & zero-point users
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, limit)
    .map(({ id, name, role, points }) => ({
      id,
      name,
      role: role ?? 'user',
      points: points || 0,
    }));

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = async () => {
  const locs = getTable('locations');
  return {
    total:      locs.length,
    completed:  locs.filter((l) => l.status === 'completed').length,
    inProgress: locs.filter((l) => l.status === 'in_progress').length,
    notVisited: locs.filter((l) => l.status === 'not_visited').length,
  };
};

/**
 * Returns analytics summary for a specific user (used for admin's own locations).
 */
export const getAnalyticsSummaryByUser = async (userId: string) => {
  const locs = getTable('locations').filter((l) => l.userId === userId);
  return {
    total:      locs.length,
    completed:  locs.filter((l) => l.status === 'completed').length,
    inProgress: locs.filter((l) => l.status === 'in_progress').length,
    notVisited: locs.filter((l) => l.status === 'not_visited').length,
  };
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
/**
 * Chat message shape:
 *  id          – unique id
 *  senderId    – who sent it
 *  senderName  – display name
 *  senderRole  – 'user' | 'volunteer' | 'admin'
 *  receiverId  – always the admin id for outbound; sender id for admin replies
 *  threadId    – userId of the non-admin participant (groups the conversation)
 *  text        – message body
 *  timestamp   – ISO string
 *  isRead      – boolean (admin has read it)
 */

export const sendMessage = async (msg: {
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  threadId: string;
  text: string;
}) => {
  const rows = getTable('messages');
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...msg,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  rows.push(newMsg);
  setTable('messages', rows);
  return newMsg;
};

/** All messages in a thread (conversation between admin and one user) */
export const getThreadMessages = async (threadId: string) =>
  [...getTable('messages')]
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

/** All distinct threads (for admin inbox) */
export const getAllThreads = async () => {
  const messages = getTable('messages');
  const users    = getTable('users');

  // Group by threadId, pick latest message per thread
  const threadMap: Record<string, any> = {};
  messages.forEach((m) => {
    if (
      !threadMap[m.threadId] ||
      new Date(m.timestamp) > new Date(threadMap[m.threadId].lastTimestamp)
    ) {
      threadMap[m.threadId] = {
        threadId:      m.threadId,
        lastMessage:   m.text,
        lastTimestamp: m.timestamp,
        unreadCount:   0,
      };
    }
    if (!m.isRead && m.senderRole !== 'admin') {
      threadMap[m.threadId].unreadCount =
        (threadMap[m.threadId].unreadCount || 0) + 1;
    }
  });

  // Attach sender info
  return Object.values(threadMap)
    .map((t) => {
      const sender = users.find((u: any) => u.id === t.threadId);
      return {
        ...t,
        senderName: sender?.name ?? 'Unknown',
        senderRole: sender?.role ?? 'user',
        senderEmail: sender?.email ?? '',
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
};

/** Mark all messages in a thread as read */
export const markThreadAsRead = async (threadId: string) => {
  const rows = getTable('messages').map((m) =>
    m.threadId === threadId ? { ...m, isRead: true } : m
  );
  setTable('messages', rows);
};

/** Total unread count for admin */
export const getUnreadCount = async () =>
  getTable('messages').filter((m) => !m.isRead && m.senderRole !== 'admin').length;

/**
 * Returns the leaderboard rank of a specific user.
 * Returns null if the user has 0 points (not on leaderboard).
 */
export const getLeaderboardRank = async (userId: string): Promise<number | null> => {
  const ranked = [...getTable('users')]
    .filter((u) => u.role !== 'admin' && (u.points || 0) > 0)
    .sort((a, b) => (b.points || 0) - (a.points || 0));
  const idx = ranked.findIndex((u) => u.id === userId);
  return idx === -1 ? null : idx + 1;
};

export default {};
