/**
 * DIDManager
 * 
 * Manages Decentralized Identifiers (DIDs).
 * Supports did:key method.
 * Handles key management.
 */
class DIDManager {
    constructor() {
        this.activeDID = null;
    }

    /**
     * Initialize - load active DID if exists
     */
    async init() {
        const dids = await window.storageManager.getAll('dids');
        if (dids && dids.length > 0) {
            this.activeDID = dids[0];
            console.log('DID loaded:', this.activeDID.id);
        }
    }

    /**
     * Creates a new DID
     * @param {string} alias - A human readable alias
     */
    async createDID(alias = 'New Identity') {
        // 1. Generate Key Pair
        const keyPair = await window.cryptoUtils.generateSigningKeyPair();

        // 2. Derive DID from Public Key
        const didString = await window.cryptoUtils.publicKeyToDID(keyPair.publicKey);

        // 3. Export Keys
        const privateKeyJwk = await window.cryptoUtils.exportKey(keyPair.privateKey);
        const publicKeyJwk = await window.cryptoUtils.exportKey(keyPair.publicKey);

        const didRecord = {
            id: didString,
            alias: alias,
            keys: {
                private: privateKeyJwk,
                public: publicKeyJwk
            },
            created: new Date().toISOString()
        };

        // 4. Store
        await window.storageManager.save('dids', didRecord);

        this.activeDID = didRecord;
        console.log('DID Created:', didString);
        return didRecord;
    }

    /**
     * Export wallet
     * Returns a JSON string of all DIDs and Credentials
     */
    async exportWallet() {
        const dids = await window.storageManager.getAll('dids');
        const credentials = await window.storageManager.getAll('credentials');

        const backup = {
            version: 1,
            date: new Date().toISOString(),
            dids: dids,
            credentials: credentials
        };

        return JSON.stringify(backup, null, 2);
    }

    /**
     * Import wallet
     * @param {string} jsonString 
     */
    async importWallet(jsonString) {
        try {
            const backup = JSON.parse(jsonString);

            // Validate basic structure
            if (!backup.dids || !backup.credentials) {
                throw new Error("Invalid wallet backup format");
            }

            // Restore DIDs
            for (const did of backup.dids) {
                await window.storageManager.save('dids', did);
            }

            // Restore Credentials
            for (const cred of backup.credentials) {
                await window.storageManager.save('credentials', cred);
            }

            // Refresh init
            await this.init();
            return true;
        } catch (error) {
            throw new Error("Import failed: " + error.message);
        }
    }

    /**
     * Resolves a DID to a DID Document
     * @param {string} did 
     */
    async resolve(did) {
        if (!did.startsWith('did:key:')) {
            throw new Error(`Unsupported DID method: ${did}`);
        }

        const didDoc = {
            "@context": "https://www.w3.org/ns/did/v1",
            "id": did,
            "verificationMethod": [{
                "id": `${did}#owner`,
                "type": "EcdsaSecp256r1VerificationKey2019", // Standard for P-256
                "controller": did,
            }],
            "authentication": [`${did}#owner`],
            "assertionMethod": [`${did}#owner`]
        };

        return didDoc;
    }

    /**
     * Get the private key for the active DID
     * @returns {Promise<CryptoKey>}
     */
    async getPrivateKey() {
        if (!this.activeDID) throw new Error("No active DID");

        if (this.activeDID.keys.private) {
            return await window.cryptoUtils.importSigningKey(this.activeDID.keys.private, 'private');
        }

        throw new Error("Private key unavailable");
    }

    /**
     * Get the public key for the active DID
     */
    async getPublicKey() {
        if (!this.activeDID) throw new Error("No active DID");
        return await window.cryptoUtils.importSigningKey(this.activeDID.keys.public, 'public');
    }

    /**
     * List all local DIDs
     */
    async listDIDs() {
        return await window.storageManager.getAll('dids');
    }

    /**
     * Delete the active DID and all associated credentials
     */
    async deleteDID() {
        if (!this.activeDID) {
            throw new Error("No active DID to delete");
        }

        // Delete the DID from storage
        await window.storageManager.delete('dids', this.activeDID.id);

        // Delete all credentials
        const credentials = await window.storageManager.getAll('credentials');
        for (const cred of credentials) {
            await window.storageManager.delete('credentials', cred.id);
        }

        // Clear active DID
        this.activeDID = null;

        // Check if there are any remaining DIDs and load the first one
        const remainingDIDs = await window.storageManager.getAll('dids');
        if (remainingDIDs && remainingDIDs.length > 0) {
            this.activeDID = remainingDIDs[0];
            console.log('Loaded remaining DID:', this.activeDID.id);
        }

        console.log('DID and all credentials deleted');
        return this.activeDID !== null; // Return true if there are remaining DIDs
    }

    // Legacy stubs to prevent crashing if something else calls them
    async unlock() { return true; }
    lock() { }
    get isLocked() { return false; }
}

// Export singleton
window.didManager = new DIDManager();
