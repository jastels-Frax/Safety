/* ============================================================
   fraxinusDB — shared IndexedDB module
   Exposed as window.FraxinusDB for use across all tab scripts.
   ============================================================ */

window.FraxinusDB = (function () {
  const DB_NAME    = 'fraxinusDB';
  const DB_VERSION = 1;
  const STORE      = 'submissions';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function initDB() {
    const db = await openDB();
    db.close();
  }

  async function saveSubmission(type, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const record = {
        id:      Date.now(),
        type,
        date:    new Date().toISOString(),
        project: data.project || '',
        data,
      };
      const req      = store.add(record);
      req.onsuccess  = () => { db.close(); resolve(record); };
      req.onerror    = e  => { db.close(); reject(e.target.error); };
    });
  }

  async function getSubmissions(type) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req   = store.getAll();
      req.onsuccess = e => {
        db.close();
        resolve(e.target.result.filter(r => r.type === type));
      };
      req.onerror = e => { db.close(); reject(e.target.error); };
    });
  }

  async function getAllSubmissions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req   = store.getAll();
      req.onsuccess = e => { db.close(); resolve(e.target.result); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    });
  }

  async function deleteSubmission(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req   = store.delete(id);
      req.onsuccess = ()  => { db.close(); resolve(); };
      req.onerror   = e   => { db.close(); reject(e.target.error); };
    });
  }

  return { initDB, saveSubmission, getSubmissions, getAllSubmissions, deleteSubmission };
})();
