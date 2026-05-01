import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Open or create database
const db = SQLite.openDatabase('ruralconnect.db');

/**
 * Initialize database with all required tables
 */
export const initializeDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      // Users table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          points INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => console.log('Users table created'),
        (_, error) => {
          console.error('Error creating users table:', error);
          return false;
        }
      );

      // Locations table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          status TEXT DEFAULT 'not_visited',
          images TEXT,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          syncedAt DATETIME,
          isSynced INTEGER DEFAULT 0,
          FOREIGN KEY(userId) REFERENCES users(id)
        );`,
        [],
        () => console.log('Locations table created'),
        (_, error) => {
          console.error('Error creating locations table:', error);
          return false;
        }
      );

      // Visit history table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS visit_history (
          id TEXT PRIMARY KEY,
          locationId TEXT NOT NULL,
          volunteerId TEXT NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          images TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          isSynced INTEGER DEFAULT 0,
          FOREIGN KEY(locationId) REFERENCES locations(id),
          FOREIGN KEY(volunteerId) REFERENCES users(id)
        );`,
        [],
        () => console.log('Visit history table created'),
        (_, error) => {
          console.error('Error creating visit history table:', error);
          return false;
        }
      );

      // Sync queue table (for offline operations)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );`,
        [],
        () => console.log('Sync queue table created'),
        (_, error) => {
          console.error('Error creating sync queue table:', error);
          return false;
        }
      );

      // Analytics table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS analytics (
          id TEXT PRIMARY KEY,
          userId TEXT,
          action TEXT NOT NULL,
          data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id)
        );`,
        [],
        () => console.log('Analytics table created'),
        (_, error) => {
          console.error('Error creating analytics table:', error);
          return false;
        }
      );

      // Create indexes for better query performance
      tx.executeSql(
        `CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);`,
        [],
        () => console.log('Index created on locations.status'),
        (_, error) => {
          console.error('Error creating index:', error);
          return false;
        }
      );

      tx.executeSql(
        `CREATE INDEX IF NOT EXISTS idx_locations_userId ON locations(userId);`,
        [],
        () => console.log('Index created on locations.userId'),
        (_, error) => {
          console.error('Error creating index:', error);
          return false;
        }
      );
    }, reject, () => resolve());
  });
};

/**
 * Execute a SELECT query
 */
export const executeQuery = (
  sql: string,
  params: any[] = []
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result.rows._array),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Execute an INSERT/UPDATE/DELETE query
 */
export const executeUpdate = (
  sql: string,
  params: any[] = []
): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Get all locations
 */
export const getAllLocations = async () => {
  return executeQuery('SELECT * FROM locations ORDER BY createdAt DESC');
};

/**
 * Get location by ID
 */
export const getLocationById = async (id: string) => {
  const results = await executeQuery(
    'SELECT * FROM locations WHERE id = ?',
    [id]
  );
  return results[0] || null;
};

/**
 * Get locations by status
 */
export const getLocationsByStatus = async (status: string) => {
  return executeQuery(
    'SELECT * FROM locations WHERE status = ? ORDER BY createdAt DESC',
    [status]
  );
};

/**
 * Get locations by user
 */
export const getLocationsByUser = async (userId: string) => {
  return executeQuery(
    'SELECT * FROM locations WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
};

/**
 * Insert a new location
 */
export const insertLocation = async (location: any) => {
  const sql = `
    INSERT INTO locations (
      id, userId, latitude, longitude, title, description, 
      category, status, images, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeUpdate(sql, [
    location.id,
    location.userId,
    location.latitude,
    location.longitude,
    location.title,
    location.description,
    location.category,
    location.status || 'not_visited',
    location.images ? JSON.stringify(location.images) : null,
    location.notes,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

/**
 * Update location status
 */
export const updateLocationStatus = async (
  locationId: string,
  status: string
) => {
  const sql = `
    UPDATE locations 
    SET status = ?, updatedAt = ?
    WHERE id = ?
  `;
  return executeUpdate(sql, [status, new Date().toISOString(), locationId]);
};

/**
 * Insert visit history
 */
export const insertVisitHistory = async (visit: any) => {
  const sql = `
    INSERT INTO visit_history (
      id, locationId, volunteerId, status, notes, images, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  return executeUpdate(sql, [
    visit.id,
    visit.locationId,
    visit.volunteerId,
    visit.status,
    visit.notes,
    visit.images ? JSON.stringify(visit.images) : null,
    new Date().toISOString(),
  ]);
};

/**
 * Get visit history for a location
 */
export const getVisitHistory = async (locationId: string) => {
  return executeQuery(
    'SELECT * FROM visit_history WHERE locationId = ? ORDER BY timestamp DESC',
    [locationId]
  );
};

/**
 * Get unsync'd items
 */
export const getUnsyncedItems = async () => {
  return executeQuery(
    'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY timestamp ASC'
  );
};

/**
 * Add to sync queue
 */
export const addToSyncQueue = async (
  action: string,
  tableName: string,
  data: any
) => {
  const id = `sync_${Date.now()}_${Math.random()}`;
  const sql = `
    INSERT INTO sync_queue (id, action, table_name, data, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `;
  return executeUpdate(sql, [
    id,
    action,
    tableName,
    JSON.stringify(data),
    new Date().toISOString(),
  ]);
};

/**
 * Mark sync queue item as synced
 */
export const markSyncQueueAsSynced = async (id: string) => {
  const sql = 'UPDATE sync_queue SET synced = 1 WHERE id = ?';
  return executeUpdate(sql, [id]);
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  const results = await executeQuery(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return results[0] || null;
};

/**
 * Insert user
 */
export const insertUser = async (user: any) => {
  const sql = `
    INSERT INTO users (id, name, email, password, role, points, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  return executeUpdate(sql, [
    user.id,
    user.name,
    user.email,
    user.password,
    user.role || 'user',
    user.points || 0,
    new Date().toISOString(),
  ]);
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string) => {
  const results = await executeQuery('SELECT * FROM users WHERE id = ?', [id]);
  return results[0] || null;
};

/**
 * Update user points
 */
export const updateUserPoints = async (userId: string, points: number) => {
  const sql = 'UPDATE users SET points = points + ? WHERE id = ?';
  return executeUpdate(sql, [points, userId]);
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (limit: number = 10) => {
  return executeQuery(
    'SELECT id, name, points FROM users ORDER BY points DESC LIMIT ?',
    [limit]
  );
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = async () => {
  const totalLocations = await executeQuery(
    'SELECT COUNT(*) as count FROM locations'
  );
  const completedLocations = await executeQuery(
    'SELECT COUNT(*) as count FROM locations WHERE status = ?',
    ['completed']
  );
  const inProgressLocations = await executeQuery(
    'SELECT COUNT(*) as count FROM locations WHERE status = ?',
    ['in_progress']
  );
  const notVisitedLocations = await executeQuery(
    'SELECT COUNT(*) as count FROM locations WHERE status = ?',
    ['not_visited']
  );

  return {
    total: totalLocations[0]?.count || 0,
    completed: completedLocations[0]?.count || 0,
    inProgress: inProgressLocations[0]?.count || 0,
    notVisited: notVisitedLocations[0]?.count || 0,
  };
};

export default db;
