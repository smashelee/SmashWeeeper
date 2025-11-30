interface Settings {
  id: number;
  key: string;
  value: string;
  updatedAt: number;
}

class Database {
  private dbName = 'SmashWeeeperDB';
  private dbVersion = 5;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  private hasIndex(store: IDBObjectStore, indexName: string): boolean {
    try {
      return store.indexNames.contains(indexName);
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion || 0;
        
        if (oldVersion < 5) {
          if (db.objectStoreNames.contains('users')) {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
              db.deleteObjectStore('users');
            }
          }
        }

        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
          settingsStore.createIndex('key', 'key', { unique: true });
        }
      };
    });

    return this.initPromise;
  }

  async getSetting(key: string): Promise<string | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      if (this.hasIndex(store, 'key')) {
        const index = store.index('key');
        const request = index.get(key);

        request.onsuccess = () => {
          resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
      } else {
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (cursor.value.key === key) {
              resolve(cursor.value.value);
            } else {
              cursor.continue();
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const getExisting = () => {
        if (this.hasIndex(store, 'key')) {
          const index = store.index('key');
          const request = index.get(key);

          request.onsuccess = () => {
            if (request.result) {
              const existing = request.result;
              existing.value = value;
              existing.updatedAt = Date.now();
              const updateRequest = store.put(existing);
              updateRequest.onsuccess = () => resolve();
              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              const newSetting: Omit<Settings, 'id'> = {
                key,
                value,
                updatedAt: Date.now(),
              };
              const addRequest = store.add(newSetting);
              addRequest.onsuccess = () => resolve();
              addRequest.onerror = () => reject(addRequest.error);
            }
          };
          request.onerror = () => reject(request.error);
        } else {
          const request = store.openCursor();
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              if (cursor.value.key === key) {
                const existing = cursor.value;
                existing.value = value;
                existing.updatedAt = Date.now();
                const updateRequest = store.put(existing);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
              } else {
                cursor.continue();
              }
            } else {
              const newSetting: Omit<Settings, 'id'> = {
                key,
                value,
                updatedAt: Date.now(),
              };
              const addRequest = store.add(newSetting);
              addRequest.onsuccess = () => resolve();
              addRequest.onerror = () => reject(addRequest.error);
            }
          };
          request.onerror = () => reject(request.error);
        }
      };
      
      getExisting();
    });
  }


  async exportDatabase(): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const data: any = {
      settings: [],
      version: this.dbVersion,
      exportDate: Date.now()
    };

    return new Promise((resolve, reject) => {
      const settingsTransaction = this.db!.transaction(['settings'], 'readonly');
      const settingsStore = settingsTransaction.objectStore('settings');
      const settingsRequest = settingsStore.getAll();

      settingsRequest.onsuccess = () => {
        data.settings = settingsRequest.result;
        resolve(JSON.stringify(data, null, 2));
      };
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
  }

  async importDatabase(jsonData: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const data = JSON.parse(jsonData);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const settingsStore = transaction.objectStore('settings');

      if (data.settings) {
        let settingsProcessed = 0;
        data.settings.forEach((setting: Settings) => {
          const request = settingsStore.put(setting);
          request.onsuccess = () => {
            settingsProcessed++;
            if (settingsProcessed === data.settings.length) {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        resolve();
      }
    });
  }
}

async function hashPassword(password: string): Promise<string> {
  if (!crypto || !crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

export const db = new Database();
export type { Settings };