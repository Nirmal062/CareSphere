/**
 * CareSphere Mobile Offline SQLite & AsyncStorage Database Engine.
 *
 * Implements atomic staging, transaction-safe schema upgrades,
 * fast indexed queries, and multi-platform fallback (iOS/Android SQLite + Web AsyncStorage).
 */
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ProtocolDocument, ProtocolSection } from '../types';

const DB_NAME = 'caresphere_offline.db';
const ASYNC_STORAGE_PROTOCOLS_KEY = 'caresphere_offline_protocols_v1';
const ASYNC_STORAGE_VERSION_KEY = 'caresphere_offline_version_v1';
const ASYNC_STORAGE_MANIFEST_KEY = 'caresphere_offline_manifest_v1';

let dbInstance: any = null;

export async function getDatabase(): Promise<any> {
  if (Platform.OS === 'web') {
    return null; // Uses AsyncStorage fallback on web
  }
  if (!dbInstance) {
    try {
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    } catch (e) {
      console.warn('[DB] SQLite openDatabaseAsync failed, will use fallback:', e);
      return null;
    }
  }
  return dbInstance;
}

/**
 * Initialize SQLite tables and indexes.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS protocols (
      section_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      full_title TEXT NOT NULL,
      doc_filename TEXT NOT NULL,
      doc_title TEXT NOT NULL,
      target_timeline TEXT,
      clinical_actions TEXT,
      mandatory_tests TEXT,
      prescribed_meds TEXT,
      danger_signs_alert TEXT,
      official_source TEXT,
      content TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS protocols_staging (
      section_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      full_title TEXT NOT NULL,
      doc_filename TEXT NOT NULL,
      doc_title TEXT NOT NULL,
      target_timeline TEXT,
      clinical_actions TEXT,
      mandatory_tests TEXT,
      prescribed_meds TEXT,
      danger_signs_alert TEXT,
      official_source TEXT,
      content TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_protocols_doc ON protocols(doc_filename);
    CREATE INDEX IF NOT EXISTS idx_protocols_title ON protocols(title);
  `);
}

/**
 * Get current installed protocol version.
 */
export async function getInstalledVersion(): Promise<string> {
  const db = await getDatabase();
  if (db) {
    try {
      const row: any = await db.getFirstAsync(
        "SELECT value FROM sync_metadata WHERE key = 'installed_version'"
      );
      if (row?.value) {
        return row.value;
      }
    } catch (e) {
      console.warn('[DB] Error querying sync_metadata:', e);
    }
  }

  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_VERSION_KEY);
  return stored || '1.0.4';
}

/**
 * Get count of active stored protocol sections.
 */
export async function getProtocolsCount(): Promise<number> {
  const db = await getDatabase();
  if (db) {
    try {
      const row: any = await db.getFirstAsync('SELECT count(*) as count FROM protocols');
      if (row && typeof row.count === 'number' && row.count > 0) {
        return row.count;
      }
    } catch (e) {
      console.warn('[DB] Error counting protocols in SQLite:', e);
    }
  }

  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_PROTOCOLS_KEY);
  if (stored) {
    try {
      const docs: ProtocolDocument[] = JSON.parse(stored);
      return docs.reduce((acc, d) => acc + (d.sections?.length || 0), 0);
    } catch {
      return 107;
    }
  }
  return 107;
}

/**
 * Atomically unpack and swap new protocols into local SQLite database.
 * If validation fails or an error occurs, the existing working database is untouched.
 */
export async function atomicStageAndSwapProtocols(
  version: string,
  sha256: string,
  documents: ProtocolDocument[]
): Promise<boolean> {
  const allSections: ProtocolSection[] = [];
  for (const doc of documents) {
    for (const sec of doc.sections || []) {
      allSections.push({
        ...sec,
        doc_filename: doc.filename,
        doc_title: doc.title
      });
    }
  }

  if (allSections.length === 0) {
    throw new Error('Cannot swap empty protocols package');
  }

  const now = Date.now();
  const db = await getDatabase();

  if (db) {
    try {
      // 1. Clear staging table
      await db.execAsync('DELETE FROM protocols_staging;');

      // 2. Insert into staging
      for (const s of allSections) {
        await db.runAsync(
          `INSERT OR REPLACE INTO protocols_staging (
            section_id, title, full_title, doc_filename, doc_title,
            target_timeline, clinical_actions, mandatory_tests,
            prescribed_meds, danger_signs_alert, official_source, content, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.section_id,
            s.title,
            s.full_title,
            s.doc_filename,
            s.doc_title,
            s.target_timeline || '',
            JSON.stringify(s.clinical_actions || []),
            JSON.stringify(s.mandatory_tests || []),
            JSON.stringify(s.prescribed_meds || []),
            s.danger_signs_alert || '',
            s.official_source || '',
            s.content,
            now
          ]
        );
      }

      // 3. Verify staging record count matches
      const stagingCountRow: any = await db.getFirstAsync(
        'SELECT count(*) as count FROM protocols_staging'
      );
      if (!stagingCountRow || stagingCountRow.count !== allSections.length) {
        throw new Error(
          `Staging validation failed: Expected ${allSections.length} sections, got ${stagingCountRow?.count}`
        );
      }

      // 4. Atomic transaction swap
      await db.withTransactionAsync(async () => {
        await db.execAsync('DELETE FROM protocols;');
        await db.execAsync('INSERT INTO protocols SELECT * FROM protocols_staging;');
        await db.execAsync('DELETE FROM protocols_staging;');
        await db.runAsync(
          "INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES ('installed_version', ?, ?)",
          [version, now]
        );
        await db.runAsync(
          "INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES ('sha256_checksum', ?, ?)",
          [sha256, now]
        );
        await db.runAsync(
          "INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES ('total_sections', ?, ?)",
          [String(allSections.length), now]
        );
      });
      console.log(`[DB] Successfully swapped SQLite protocols table to v${version} (${allSections.length} sections)`);
    } catch (err) {
      console.error('[DB] Atomic swap failed in SQLite, falling back to AsyncStorage:', err);
      // Clean staging
      try {
        await db.execAsync('DELETE FROM protocols_staging;');
      } catch {}
      throw err;
    }
  }

  // Also persist to AsyncStorage for cross-platform access & web fallback
  await AsyncStorage.setItem(ASYNC_STORAGE_PROTOCOLS_KEY, JSON.stringify(documents));
  await AsyncStorage.setItem(ASYNC_STORAGE_VERSION_KEY, version);
  await AsyncStorage.setItem(
    ASYNC_STORAGE_MANIFEST_KEY,
    JSON.stringify({
      version,
      sha256,
      total_sections: allSections.length,
      updated_at: now
    })
  );

  return true;
}

/**
 * Get all protocol sections from database.
 */
export async function getAllProtocolSections(): Promise<ProtocolSection[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const rows: any[] = await db.getAllAsync(
        'SELECT * FROM protocols ORDER BY doc_filename, section_id'
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          section_id: r.section_id,
          title: r.title,
          full_title: r.full_title,
          doc_filename: r.doc_filename,
          doc_title: r.doc_title,
          target_timeline: r.target_timeline,
          clinical_actions: r.clinical_actions ? JSON.parse(r.clinical_actions) : [],
          mandatory_tests: r.mandatory_tests ? JSON.parse(r.mandatory_tests) : [],
          prescribed_meds: r.prescribed_meds ? JSON.parse(r.prescribed_meds) : [],
          danger_signs_alert: r.danger_signs_alert,
          official_source: r.official_source,
          content: r.content
        }));
      }
    } catch (e) {
      console.warn('[DB] Error querying all protocols from SQLite:', e);
    }
  }

  // Fallback to AsyncStorage
  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_PROTOCOLS_KEY);
  if (stored) {
    const docs: ProtocolDocument[] = JSON.parse(stored);
    const secs: ProtocolSection[] = [];
    for (const d of docs) {
      for (const s of d.sections || []) {
        secs.push({ ...s, doc_filename: d.filename, doc_title: d.title });
      }
    }
    return secs;
  }

  // Fallback to bundled json
  const bundled = require('../data/protocols.json');
  const docs: ProtocolDocument[] = Array.isArray(bundled) ? bundled : bundled.default || [];
  const secs: ProtocolSection[] = [];
  for (const d of docs) {
    for (const s of d.sections || []) {
      secs.push({ ...s, doc_filename: d.filename, doc_title: d.title });
    }
  }
  return secs;
}

/**
 * Retrieve a specific protocol section by ID (e.g. 'ANC-1.2').
 */
export async function getProtocolSectionById(
  sectionId: string
): Promise<ProtocolSection | null> {
  const db = await getDatabase();
  if (db) {
    try {
      const r: any = await db.getFirstAsync(
        'SELECT * FROM protocols WHERE section_id = ?',
        [sectionId.toUpperCase().trim()]
      );
      if (r) {
        return {
          section_id: r.section_id,
          title: r.title,
          full_title: r.full_title,
          doc_filename: r.doc_filename,
          doc_title: r.doc_title,
          target_timeline: r.target_timeline,
          clinical_actions: r.clinical_actions ? JSON.parse(r.clinical_actions) : [],
          mandatory_tests: r.mandatory_tests ? JSON.parse(r.mandatory_tests) : [],
          prescribed_meds: r.prescribed_meds ? JSON.parse(r.prescribed_meds) : [],
          danger_signs_alert: r.danger_signs_alert,
          official_source: r.official_source,
          content: r.content
        };
      }
    } catch (e) {
      console.warn('[DB] Error querying section by ID:', e);
    }
  }

  const all = await getAllProtocolSections();
  return all.find((s) => s.section_id === sectionId.toUpperCase().trim()) || null;
}
