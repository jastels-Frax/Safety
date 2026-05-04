/* ============================================================
   db.js — IndexedDB for Hepatica survey records and drafts
   ============================================================ */

window.HepaticaDB = (function () {
  'use strict';

  const DB_NAME    = 'hepaticaSurveyDB';
  const DB_VERSION = 1;
  const SURVEYS    = 'surveys';
  const DRAFTS     = 'drafts';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SURVEYS)) {
          const s = db.createObjectStore(SURVEYS, { keyPath: 'id' });
          s.createIndex('by_year',  'year',    { unique: false });
          s.createIndex('by_patch', 'patch',   { unique: false });
          s.createIndex('by_date',  'date',    { unique: false });
        }
        if (!db.objectStoreNames.contains(DRAFTS)) {
          db.createObjectStore(DRAFTS, { keyPath: 'key' });
        }
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  function tx(db, stores, mode, fn) {
    return new Promise((resolve, reject) => {
      const t  = db.transaction(stores, mode);
      const st = Array.isArray(stores) ? stores.map(s => t.objectStore(s)) : t.objectStore(stores);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
      fn(st, resolve);
    });
  }

  async function saveSurvey(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(SURVEYS, 'readwrite');
      t.objectStore(SURVEYS).put(record);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    });
  }

  async function getAllSurveys() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t   = db.transaction(SURVEYS, 'readonly');
      const req = t.objectStore(SURVEYS).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    });
  }

  async function deleteSurvey(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(SURVEYS, 'readwrite');
      t.objectStore(SURVEYS).delete(id);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    });
  }

  async function saveDraft(key, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(DRAFTS, 'readwrite');
      t.objectStore(DRAFTS).put({ key, data, savedAt: new Date().toISOString() });
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    });
  }

  async function getDraft(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t   = db.transaction(DRAFTS, 'readonly');
      const req = t.objectStore(DRAFTS).get(key);
      req.onsuccess = () => { db.close(); resolve(req.result ? req.result.data : null); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    });
  }

  async function clearDraft(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(DRAFTS, 'readwrite');
      t.objectStore(DRAFTS).delete(key);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    });
  }

  async function getAllDraftKeys() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t   = db.transaction(DRAFTS, 'readonly');
      const req = t.objectStore(DRAFTS).getAll();
      req.onsuccess = () => { db.close(); resolve((req.result || []).map(r => r.key)); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    });
  }

  return { saveSurvey, getAllSurveys, deleteSurvey, saveDraft, getDraft, clearDraft, getAllDraftKeys };
})();
