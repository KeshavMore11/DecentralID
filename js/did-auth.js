/**
 * DIDAuth
 * 
 * Implements DID-based authentication (passwordless).
 * Uses challenge-response mechanism with cryptographic signatures.
 */
class DIDAuth {
    constructor() {
        this.sessions = new Map();
        this.challenges = new Map();
        this.sessionTimeout = 3600000; // 1 hour in milliseconds
    }

    /**
     * Generate an authentication challenge for a user
     * @param {string} purpose - Purpose of authentication (e.g., 'login', 'transaction')
     * @returns {Object} Challenge object
     */
    generateChallenge(purpose = 'authentication') {
        const challengeId = this.generateUUID();
        const nonce = this.generateNonce();
        const timestamp = Date.now();

        const challenge = {
            id: challengeId,
            nonce: nonce,
            purpose: purpose,
            timestamp: timestamp,
            expiresAt: timestamp + 300000, // 5 minutes
            domain: window.location.hostname || 'ssi-wallet'
        };

        // Store challenge temporarily
        this.challenges.set(challengeId, challenge);

        // Auto-cleanup expired challenge
        setTimeout(() => {
            this.challenges.delete(challengeId);
        }, 300000);

        console.log('Challenge generated:', challengeId);
        return challenge;
    }

    /**
     * Sign an authentication challenge with user's DID
     * @param {Object} challenge - The challenge to sign
     * @param {string} userDID - User's DID (optional, uses active DID if not provided)
     * @returns {Promise<Object>} Signed authentication response
     */
    async signChallenge(challenge, userDID = null) {
        if (!userDID) {
            userDID = window.didManager.activeDID?.id;
        }

        if (!userDID) {
            throw new Error("No DID available for signing");
        }

        // Check if challenge is expired
        if (Date.now() > challenge.expiresAt) {
            throw new Error("Challenge has expired");
        }

        // Create authentication token
        const authToken = {
            challenge: challenge.id,
            did: userDID,
            timestamp: Date.now(),
            purpose: challenge.purpose
        };

        // Sign the challenge data
        const privateKey = await window.didManager.getPrivateKey();
        const challengeData = JSON.stringify({
            challengeId: challenge.id,
            nonce: challenge.nonce,
            did: userDID,
            purpose: challenge.purpose
        });

        const signature = await window.cryptoUtils.sign(challengeData, privateKey);

        const authResponse = {
            ...authToken,
            signature: signature,
            signedData: challengeData
        };

        console.log('Challenge signed by:', userDID);
        return authResponse;
    }

    /**
     * Verify an authentication response
     * @param {Object} authResponse - The signed authentication response
     * @returns {Promise<Object>} Verification result with session token if successful
     */
    async verifyAuthResponse(authResponse) {
        const result = {
            verified: false,
            did: null,
            session: null,
            errors: []
        };

        try {
            // 1. Check if challenge exists and is valid
            const challenge = this.challenges.get(authResponse.challenge);
            if (!challenge) {
                result.errors.push("Challenge not found or expired");
                return result;
            }

            // 2. Check if challenge has expired
            if (Date.now() > challenge.expiresAt) {
                result.errors.push("Challenge has expired");
                this.challenges.delete(authResponse.challenge);
                return result;
            }

            // 3. Resolve DID and get public key
            const userDID = authResponse.did;
            const didRecord = await window.storageManager.get('dids', userDID);

            if (!didRecord) {
                result.errors.push("DID not found");
                return result;
            }

            const publicKey = await window.cryptoUtils.importSigningKey(
                didRecord.keys.public,
                'public'
            );

            // 4. Verify signature
            const isValid = await window.cryptoUtils.verify(
                authResponse.signedData,
                authResponse.signature,
                publicKey
            );

            if (!isValid) {
                result.errors.push("Invalid signature");
                return result;
            }

            // 5. Create session
            const session = await this.createSession(userDID, challenge.purpose);

            result.verified = true;
            result.did = userDID;
            result.session = session;

            // Clean up used challenge
            this.challenges.delete(authResponse.challenge);

            console.log('✓ Authentication successful for:', userDID);

        } catch (error) {
            result.errors.push(error.message);
            console.error('Authentication verification error:', error);
        }

        return result;
    }

    /**
     * Create an authenticated session
     * @param {string} userDID - User's DID
     * @param {string} purpose - Session purpose
     * @returns {Promise<Object>} Session object
     */
    async createSession(userDID, purpose = 'general') {
        const sessionId = this.generateUUID();
        const now = Date.now();

        const session = {
            id: sessionId,
            did: userDID,
            purpose: purpose,
            createdAt: now,
            expiresAt: now + this.sessionTimeout,
            lastActivity: now
        };

        // Store session
        this.sessions.set(sessionId, session);

        // Store in sessionStorage for persistence across page reloads
        sessionStorage.setItem('activeSession', JSON.stringify(session));

        // Auto-cleanup expired session
        setTimeout(() => {
            this.endSession(sessionId);
        }, this.sessionTimeout);

        console.log('Session created:', sessionId);
        return session;
    }

    /**
     * Validate an existing session
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Session object if valid, null otherwise
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            // Try to load from sessionStorage
            const storedSession = sessionStorage.getItem('activeSession');
            if (storedSession) {
                const parsed = JSON.parse(storedSession);
                if (parsed.id === sessionId && Date.now() < parsed.expiresAt) {
                    this.sessions.set(sessionId, parsed);
                    return parsed;
                }
            }
            return null;
        }

        // Check expiration
        if (Date.now() > session.expiresAt) {
            this.endSession(sessionId);
            return null;
        }

        // Update last activity
        session.lastActivity = Date.now();
        return session;
    }

    /**
     * Get the currently active session
     * @returns {Object|null} Active session or null
     */
    getActiveSession() {
        const storedSession = sessionStorage.getItem('activeSession');
        if (!storedSession) return null;

        const session = JSON.parse(storedSession);
        return this.validateSession(session.id);
    }

    /**
     * End a session (logout)
     * @param {string} sessionId - Session ID
     */
    endSession(sessionId) {
        this.sessions.delete(sessionId);

        // Clear from sessionStorage
        const activeSession = sessionStorage.getItem('activeSession');
        if (activeSession) {
            const parsed = JSON.parse(activeSession);
            if (parsed.id === sessionId) {
                sessionStorage.removeItem('activeSession');
            }
        }

        console.log('Session ended:', sessionId);
    }

    /**
     * Logout current user
     */
    logout() {
        const session = this.getActiveSession();
        if (session) {
            this.endSession(session.id);
        }
        sessionStorage.clear();
        console.log('User logged out');
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const session = this.getActiveSession();
        return session !== null;
    }

    /**
     * Get authenticated user's DID
     * @returns {string|null}
     */
    getAuthenticatedDID() {
        const session = this.getActiveSession();
        return session ? session.did : null;
    }

    // --- Helper Functions ---

    /**
     * Generate a random nonce
     */
    generateNonce() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate a UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create a login flow (convenience method)
     * @returns {Promise<Object>} Authentication result
     */
    async login() {
        // 1. Generate challenge
        const challenge = this.generateChallenge('login');

        // 2. Sign with user's DID
        const authResponse = await this.signChallenge(challenge);

        // 3. Verify and create session
        const result = await this.verifyAuthResponse(authResponse);

        return result;
    }
}

// Export singleton
window.didAuth = new DIDAuth();
