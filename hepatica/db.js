/* ============================================================
   db.js — IndexedDB for Hepatica surveys, patch records,
           photo-points, and drafts
   ============================================================ */

window.HepaticaDB = (function () {
  'use strict';

  const DB_NAME    = 'hepaticaSurveyDB';
  const DB_VERSION = 2;   // v2: adds patchRecords + photoPoints stores
  const SURVEYS    = 'surveys';
  const PATCHES    = 'patchRecords';
  const PHOTOS     = 'photoPoints';
  const DRAFTS     = 'drafts';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SURVEYS)) {
          const s = db.createObjectStore(SURVEYS, { keyPath: 'id' });
          s.createIndex('by_year',  'year',  { unique: false });
          s.createIndex('by_patch', 'patch', { unique: false });
          s.createIndex('by_date',  'date',  { unique: false });
        }
        if (!db.objectStoreNames.contains(PATCHES)) {
          const p = db.createObjectStore(PATCHES, { keyPath: 'id' });
          p.createIndex('by_year',  'year',  { unique: false });
          p.createIndex('by_patch', 'patch', { unique: false });
        }
        if (!db.objectStoreNames.contains(PHOTOS)) {
          const ph = db.createObjectStore(PHOTOS, { keyPath: 'id' });
          ph.createIndex('by_patch', 'patch', { unique: false });
        }
        if (!db.objectStoreNames.contains(DRAFTS)) {
          db.createObjectStore(DRAFTS, { keyPath: 'key' });
        }
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  function storeGetAll(storeName) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t   = db.transaction(storeName, 'readonly');
      const req = t.objectStore(storeName).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    }));
  }

  function storeSave(storeName, record) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, 'readwrite');
      t.objectStore(storeName).put(record);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    }));
  }

  function storeDel(storeName, id) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, 'readwrite');
      t.objectStore(storeName).delete(id);
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror    = e => { db.close(); reject(e.target.error); };
    }));
  }

  async function saveDraft(key, data) {
    return storeSave(DRAFTS, { key, data, savedAt: new Date().toISOString() });
  }

  function getDraft(key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t   = db.transaction(DRAFTS, 'readonly');
      const req = t.objectStore(DRAFTS).get(key);
      req.onsuccess = () => { db.close(); resolve(req.result ? req.result.data : null); };
      req.onerror   = e => { db.close(); reject(e.target.error); };
    }));
  }

  function clearDraft(key) {
    return storeDel(DRAFTS, key);
  }

  return {
    saveSurvey:         r  => storeSave(SURVEYS, r),
    getAllSurveys:       () => storeGetAll(SURVEYS),
    deleteSurvey:       id => storeDel(SURVEYS, id),

    savePatchRecord:    r  => storeSave(PATCHES, r),
    getAllPatchRecords:  () => storeGetAll(PATCHES),
    deletePatchRecord:  id => storeDel(PATCHES, id),

    savePhotoPoint:     r  => storeSave(PHOTOS, r),
    getAllPhotoPoints:   () => storeGetAll(PHOTOS),
    deletePhotoPoint:   id => storeDel(PHOTOS, id),

    saveDraft, getDraft, clearDraft,
  };
})();
