/**
 * CryptoUtils
 * 
 * Provides cryptographic primitives using the Web Crypto API.
 * Handles key generation, signing, verification, hashing, and encryption.
 */
class CryptoUtils {
    constructor() {
        this.algo = {
            signing: {
                name: 'ECDSA',
                namedCurve: 'P-256'
            },
            encryption: {
                name: 'AES-GCM',
                length: 256
            },
            hashing: 'SHA-256'
        };
    }

    /**
     * Generates a new ECDSA key pair for signing (Identity Key)
     * @returns {Promise<CryptoKeyPair>} The generated key pair
     */
    async generateSigningKeyPair() {
        return await window.crypto.subtle.generateKey(
            this.algo.signing,
            true, // extractable for backup
            ['sign', 'verify']
        );
    }

    /**
     * Generates a simple did:key from a public key
     * Note: This is a simplified implementation. A full implementation would utilize
     * multicodec prefixes. We'll use a hex representation of the raw public key for simplicity
     * in this demo, or we can try to be slightly more standard compliant if possible.
     * 
     * @param {CryptoKey} publicKey 
     * @returns {Promise<string>} The DID string (did:key:...)
     */
    async publicKeyToDID(publicKey) {
        const exported = await window.crypto.subtle.exportKey('raw', publicKey);
        const buffer = new Uint8Array(exported);

        // For distinctness in this demo, we'll prefix with a custom 'demo' multicodec if we wanted,
        // but let's just hex encode the raw P-256 key.
        // A real did:key for P-256 starts with zDna... (multibase base58btc)
        // containing multicodec prefix for p256-pub (0x1200).

        // Let's us a simple hex encoding for this demo to avoid external dependencies like bs58
        const hex = this.bufferToHex(buffer);
        return `did:key:z${hex}`; // 'z' usually denotes base58, but we'll use it as a placeholder here or just 'did:key:hex:'
    }

    /**
     * exports a key to JWK format
     */
    async exportKey(key) {
        return await window.crypto.subtle.exportKey('jwk', key);
    }

    /**
     * Imports a key from JWK format
     */
    async importSigningKey(jwk, type = 'private') {
        return await window.crypto.subtle.importKey(
            'jwk',
            jwk,
            this.algo.signing,
            true,
            type === 'private' ? ['sign'] : ['verify']
        );
    }

    /**
     * Signs data using a private key
     * @param {string|Object} data - Data to sign
     * @param {CryptoKey} privateKey 
     * @returns {Promise<string>} Hex encoded signature
     */
    async sign(data, privateKey) {
        const encoded = this.encodeData(data);
        const signature = await window.crypto.subtle.sign(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' }
            },
            privateKey,
            encoded
        );
        return this.bufferToHex(new Uint8Array(signature));
    }

    /**
     * Verifies a signature
     * @param {string|Object} data 
     * @param {string} signatureHex 
     * @param {CryptoKey} publicKey 
     * @returns {Promise<boolean>}
     */
    async verify(data, signatureHex, publicKey) {
        const encoded = this.encodeData(data);
        const signature = this.hexToBuffer(signatureHex);
        return await window.crypto.subtle.verify(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' }
            },
            publicKey,
            signature,
            encoded
        );
    }

    /**
     * Computes SHA-256 hash of data
     * @param {string|Object} data 
     * @returns {Promise<string>} Hex string of hash
     */
    async hash(data) {
        const encoded = this.encodeData(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
        return this.bufferToHex(new Uint8Array(hashBuffer));
    }

    /**
     * Generates a random salt
     */
    generateSalt(length = 16) {
        return window.crypto.getRandomValues(new Uint8Array(length));
    }

    /**
     * Derives an encryption key from a password/pin
     * @param {string} password 
     * @param {Uint8Array} salt 
     * @returns {Promise<CryptoKey>}
     */
    async deriveKeyFromPassword(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            this.algo.encryption,
            false, // Key itself not extractable
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypts data with AES-GCM
     * @param {Object|string} data 
     * @param {CryptoKey} key 
     * @returns {Promise<{iv: string, ciphertext: string}>}
     */
    async encrypt(data, key) {
        const encoded = this.encodeData(data);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encoded
        );

        return {
            iv: this.bufferToHex(iv),
            ciphertext: this.bufferToHex(new Uint8Array(ciphertext))
        };
    }

    /**
     * Decrypts data with AES-GCM
     * @param {Object} encryptedPackage - {iv, ciphertext} in hex
     * @param {CryptoKey} key 
     * @returns {Promise<Object|string>} Decoded data
     */
    async decrypt(encryptedPackage, key) {
        const iv = this.hexToBuffer(encryptedPackage.iv);
        const ciphertext = this.hexToBuffer(encryptedPackage.ciphertext);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        const decodedString = dec.decode(decrypted);
        try {
            return JSON.parse(decodedString);
        } catch (e) {
            return decodedString;
        }
    }

    // --- Helpers ---

    encodeData(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return new TextEncoder().encode(str);
    }

    bufferToHex(buffer) {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    hexToBuffer(hex) {
        const pairs = hex.match(/[\da-f]{2}/gi);
        if (!pairs) return new Uint8Array();
        return new Uint8Array(pairs.map(h => parseInt(h, 16)));
    }
}

// Export singleton
window.cryptoUtils = new CryptoUtils();
