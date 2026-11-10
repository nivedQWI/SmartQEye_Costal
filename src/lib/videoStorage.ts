// ============================================================
// SmartQEye Coastal — IndexedDB Persistent Video File Storage
// Stores uploaded MP4/WebM video files so they survive page navigation
// and page refreshes without blob URL expiration.
// ============================================================

const DB_NAME = 'sqeye_coastal_videos_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

// Active in-memory Object URLs: id -> objectUrl
const memoryUrls = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves an uploaded video file into IndexedDB and returns a stable Object URL.
 */
export async function saveUploadedVideo(id: string, file: File | Blob): Promise<string> {
  // 1. Create in-memory Object URL
  const existingUrl = memoryUrls.get(id);
  if (existingUrl) {
    try {
      URL.revokeObjectURL(existingUrl);
    } catch {}
  }

  const url = URL.createObjectURL(file);
  memoryUrls.set(id, url);

  // 2. Persist blob in IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[videoStorage] Failed to persist file in IndexedDB:', err);
  }

  return url;
}

/**
 * Resolves a valid Object URL for a given video/feed ID.
 * If the current URL is dead or on page reload, recovers the Blob from IndexedDB and creates a new Object URL.
 */
export async function resolveVideoUrl(id: string, currentUrl?: string): Promise<string | null> {
  // If it's a remote URL (not a blob), return it directly
  if (currentUrl && !currentUrl.startsWith('blob:')) {
    return currentUrl;
  }

  // Check active memory URL first
  const cached = memoryUrls.get(id);
  if (cached) {
    return cached;
  }

  // Retrieve from IndexedDB
  try {
    const db = await openDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      const freshUrl = URL.createObjectURL(blob);
      memoryUrls.set(id, freshUrl);
      return freshUrl;
    }
  } catch (err) {
    console.warn('[videoStorage] Failed to retrieve file from IndexedDB:', err);
  }

  return currentUrl ?? null;
}

/**
 * Removes video from memory and IndexedDB.
 */
export async function removeUploadedVideo(id: string): Promise<void> {
  const url = memoryUrls.get(id);
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
    memoryUrls.delete(id);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (err) {
    console.warn('[videoStorage] Failed to delete file from IndexedDB:', err);
  }
}
