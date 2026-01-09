/**
 * Global Cache Manager
 * Sistema di cache globale per dati applicazione
 */

class GlobalCache {
  constructor() {
    this.dbName = 'PtProGlobalCache';
    this.version = 1;
    this.db = null;
    this.memoryCache = new Map();
  }

  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store per cache generica
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry');
        }
        
        // Store per metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async getCacheStats() {
    try {
      await this.init();
      
      const transaction = this.db.transaction(['cache', 'metadata'], 'readonly');
      const cacheStore = transaction.objectStore('cache');
      
      return new Promise((resolve) => {
        const countRequest = cacheStore.count();
        
        countRequest.onsuccess = () => {
          resolve({
            entries: countRequest.result,
            memoryEntries: this.memoryCache.size,
            dbName: this.dbName,
            version: this.version
          });
        };
        
        countRequest.onerror = () => {
          resolve({
            entries: 0,
            memoryEntries: this.memoryCache.size,
            dbName: this.dbName,
            version: this.version,
            error: true
          });
        };
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        entries: 0,
        memoryEntries: this.memoryCache.size,
        error: error.message
      };
    }
  }

  async clearAllCache() {
    try {
      // Pulisci memory cache
      this.memoryCache.clear();
      
      // Pulisci IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['cache', 'metadata'], 'readwrite');
        const cacheStore = transaction.objectStore('cache');
        const metadataStore = transaction.objectStore('metadata');
        
        await Promise.all([
          new Promise((resolve) => {
            const req = cacheStore.clear();
            req.onsuccess = resolve;
            req.onerror = resolve;
          }),
          new Promise((resolve) => {
            const req = metadataStore.clear();
            req.onsuccess = resolve;
            req.onerror = resolve;
          })
        ]);
      }
      
      console.log('🗑️ Cache globale pulita');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  async set(key, value, ttlMs = 5 * 60 * 1000) {
    try {
      const expiry = Date.now() + ttlMs;
      
      // Salva in memory
      this.memoryCache.set(key, { value, expiry });
      
      // Salva in IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.put({ key, value, expiry });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  async get(key) {
    try {
      // Prima controlla memory cache
      const memCached = this.memoryCache.get(key);
      if (memCached && memCached.expiry > Date.now()) {
        return memCached.value;
      }
      
      // Poi controlla IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        
        return new Promise((resolve) => {
          const request = store.get(key);
          
          request.onsuccess = () => {
            const result = request.result;
            if (result && result.expiry > Date.now()) {
              // Salva in memory per accesso rapido
              this.memoryCache.set(key, { value: result.value, expiry: result.expiry });
              resolve(result.value);
            } else {
              resolve(null);
            }
          };
          
          request.onerror = () => resolve(null);
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async delete(key) {
    try {
      this.memoryCache.delete(key);
      
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.delete(key);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }
}

// Singleton instance
const globalCache = new GlobalCache();
export default globalCache;
