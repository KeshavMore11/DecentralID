/**
 * StorageManager
 * 
 * Handles local data persistence using IndexedDB.
 * Manages encrypted storage of items.
 */
class StorageManager {
    constructor() {
        this.dbName = 'SSIWalletDB';
        this.version = 1;
        this.db = null;
        this.encryptionKey = null; // CryptoKey
        this.isReady = false;
    }

    /**
     * Initialize the storage
     * @param {string} password - User pin/password for encryption (optional)
     */
    async init(password = null) {
        if (password) {
            await this.setupEncryption(password);
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject("Database error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                console.log("Storage initialized");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store DIDs
                if (!db.objectStoreNames.contains('dids')) {
                    const didStore = db.createObjectStore('dids', { keyPath: 'id' });
                    didStore.createIndex('alias', 'alias', { unique: false });
                }

                // Store Credentials
                if (!db.objectStoreNames.contains('credentials')) {
                    const credStore = db.createObjectStore('credentials', { keyPath: 'id' });
                    credStore.createIndex('issuer', 'issuer', { unique: false });
                    credStore.createIndex('type', 'type', { unique: false });
                    credStore.createIndex('issuanceDate', 'issuanceDate', { unique: false });
                }

                // App Settings & Keys (Encrypted blobs)
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async setupEncryption(password) {
        // In a real app, we'd store the salt in localStorage or DB to re-derive the key
        let saltHex = localStorage.getItem('wallet_salt');
        let salt;

        if (!saltHex) {
            salt = window.cryptoUtils.generateSalt();
            localStorage.setItem('wallet_salt', window.cryptoUtils.bufferToHex(salt));
        } else {
            salt = window.cryptoUtils.hexToBuffer(saltHex);
        }

        this.encryptionKey = await window.cryptoUtils.deriveKeyFromPassword(password, salt);
    }

    /**
     * Generic save
     * @param {string} storeName 
     * @param {Object} data 
     */
    async save(storeName, data) {
        if (!this.db) await this.init();

        // If we have an encryption key and this is sensitive, encrypt it?
        // For now, let's assume we store objects plainly unless specified otherwise,
        // or we can wrap the whole object payload.
        // Let's stick to saving plain objects for the MVP structure, 
        // managing encryption at the manager layer (e.g. CredentialManager encrypts before saving).

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic get
     */
    async get(storeName, key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton
window.storageManager = new StorageManager();
