/**
 * IndexedDB Offline Storage Utility for Frontline Health-Worker Companion
 * Stores household register expansions and completed visit logs locally.
 */

const DB_NAME = 'CareSphereOfflineDB';
const DB_VERSION = 1;
const STORE_REGISTER = 'household_register';
const STORE_COMPLETED = 'completed_visits';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_REGISTER)) {
        db.createObjectStore(STORE_REGISTER, { keyPath: 'member_id' });
      }
      if (!db.objectStoreNames.contains(STORE_COMPLETED)) {
        db.createObjectStore(STORE_COMPLETED, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRegisteredMemberToDB(member: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_REGISTER, 'readwrite');
    tx.objectStore(STORE_REGISTER).put(member);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
    // Fallback
    try {
      const existing = JSON.parse(localStorage.getItem('caresphere_indexeddb_members') || '[]');
      existing.unshift(member);
      localStorage.setItem('caresphere_indexeddb_members', JSON.stringify(existing));
    } catch {}
  }
}

export async function getAllRegisteredMembersFromDB(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_REGISTER, 'readonly');
    const store = tx.objectStore(STORE_REGISTER);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    try {
      return JSON.parse(localStorage.getItem('caresphere_indexeddb_members') || '[]');
    } catch {
      return [];
    }
  }
}

export async function saveCompletedVisitLogToDB(record: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_COMPLETED, 'readwrite');
    tx.objectStore(STORE_COMPLETED).put(record);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (err) {
    console.warn('IndexedDB completed visit log failed:', err);
  }
}
