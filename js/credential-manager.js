/**
 * CredentialManager
 * 
 * Manages Verifiable Credentials following W3C VC Data Model.
 * Handles issuance, storage, verification, and presentation of academic credentials.
 */
class CredentialManager {
    constructor() {
        this.credentials = [];
    }

    /**
     * Initialize - load all stored credentials
     */
    async init() {
        const stored = await window.storageManager.getAll('credentials');
        if (stored && stored.length > 0) {
            this.credentials = stored;
            console.log(`Loaded ${stored.length} credential(s)`);
        }
    }

    /**
     * Issue a new Verifiable Credential (Academic)
     * @param {Object} credentialData - The credential subject data
     * @param {string} credentialData.studentDID - DID of the student
     * @param {string} credentialData.studentName - Name of the student
     * @param {Array} credentialData.courses - Array of course objects
     * @param {string} credentialData.institution - Name of the institution
     * @param {string} credentialData.degree - Degree program
     * @returns {Promise<Object>} The signed verifiable credential
     */
    async issueCredential(credentialData) {
        // 1. Get issuer's DID and keys
        const issuerDID = window.didManager.activeDID?.id;
        if (!issuerDID) {
            throw new Error("No active DID for issuer");
        }

        // 2. Validate that student DID exists
        const studentDIDExists = await window.storageManager.get('dids', credentialData.studentDID);
        if (!studentDIDExists) {
            throw new Error(`Cannot issue credential: Student DID '${credentialData.studentDID}' does not exist in the system. Please verify the DID is correct.`);
        }

        // 3. Create credential ID
        const credentialId = `urn:uuid:${this.generateUUID()}`;

        // 4. Build the credential following W3C VC Data Model
        const credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "id": credentialId,
            "type": ["VerifiableCredential", "AcademicCredential"],
            "issuer": issuerDID,
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                "id": credentialData.studentDID,
                "name": credentialData.studentName,
                "institution": credentialData.institution,
                "degree": credentialData.degree,
                "courses": credentialData.courses, // Array of {courseName, grade, credits, year}
                "gpa": this.calculateGPA(credentialData.courses),
                "gpaScale": 10
            }
        };

        // 5. Sign the credential
        const privateKey = await window.didManager.getPrivateKey();
        const proof = await this.createProof(credential, privateKey, issuerDID);

        // 6. Add proof to credential
        const verifiableCredential = {
            ...credential,
            proof: proof
        };

        // 7. Store the credential
        await window.storageManager.save('credentials', verifiableCredential);
        this.credentials.push(verifiableCredential);

        console.log('Credential issued:', credentialId);
        return verifiableCredential;
    }

    /**
     * Create a cryptographic proof for the credential
     * @param {Object} credential - The credential to sign
     * @param {CryptoKey} privateKey - Issuer's private key
     * @param {string} issuerDID - Issuer's DID
     * @returns {Promise<Object>} The proof object
     */
    async createProof(credential, privateKey, issuerDID) {
        // Create a canonical representation for signing
        const credentialCopy = { ...credential };
        delete credentialCopy.proof; // Remove proof if it exists

        // Canonicalize (in production, use proper JSON-LD canonicalization)
        const canonicalData = JSON.stringify(credentialCopy);

        // Sign the data
        const signature = await window.cryptoUtils.sign(canonicalData, privateKey);

        // Return proof object
        return {
            "type": "EcdsaSecp256r1Signature2019",
            "created": new Date().toISOString(),
            "verificationMethod": `${issuerDID}#owner`,
            "proofPurpose": "assertionMethod",
            "signature": signature
        };
    }

    /**
     * Verify a Verifiable Credential
     * @param {Object} credential - The credential to verify
     * @returns {Promise<Object>} Verification result with status and details
     */
    async verifyCredential(credential) {
        const result = {
            verified: false,
            checks: {
                structure: false,
                signature: false,
                expiration: true, // We don't have expiration in our simple model
                revocation: true  // We don't have revocation yet
            },
            issuer: null,
            errors: []
        };

        try {
            // 1. Check structure
            if (!credential.proof || !credential.credentialSubject || !credential.issuer) {
                result.errors.push("Invalid credential structure");
                return result;
            }
            result.checks.structure = true;
            result.issuer = credential.issuer;

            // 2. Resolve issuer DID to get public key
            const issuerDIDDoc = await window.didManager.resolve(credential.issuer);

            // For our demo, we need to get the public key from local storage
            // In production, we'd extract it from the DID string for did:key
            const issuerRecord = await window.storageManager.get('dids', credential.issuer);
            if (!issuerRecord) {
                result.errors.push("Issuer DID not found locally. Cannot verify.");
                return result;
            }

            const publicKey = await window.cryptoUtils.importSigningKey(
                issuerRecord.keys.public,
                'public'
            );

            // 3. Verify signature
            const credentialCopy = { ...credential };
            delete credentialCopy.proof;
            const canonicalData = JSON.stringify(credentialCopy);

            const isValid = await window.cryptoUtils.verify(
                canonicalData,
                credential.proof.signature,
                publicKey
            );

            result.checks.signature = isValid;

            // 4. Overall verification
            result.verified = Object.values(result.checks).every(v => v === true);

            if (result.verified) {
                console.log('✓ Credential verified successfully');
            } else {
                result.errors.push("Signature verification failed");
            }

        } catch (error) {
            result.errors.push(error.message);
            console.error('Verification error:', error);
        }

        return result;
    }

    /**
     * Create a Verifiable Presentation (for sharing credentials)
     * @param {Array<string>} credentialIds - IDs of credentials to include
     * @param {string} holderDID - DID of the holder
     * @returns {Promise<Object>} The signed verifiable presentation
     */
    async createPresentation(credentialIds, holderDID = null) {
        if (!holderDID) {
            holderDID = window.didManager.activeDID?.id;
        }

        if (!holderDID) {
            throw new Error("No holder DID specified");
        }

        // Get the credentials
        const credentials = this.credentials.filter(c => credentialIds.includes(c.id));

        if (credentials.length === 0) {
            throw new Error("No credentials found with the specified IDs");
        }

        // Build presentation
        const presentation = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ],
            "type": ["VerifiablePresentation"],
            "id": `urn:uuid:${this.generateUUID()}`,
            "holder": holderDID,
            "verifiableCredential": credentials,
            "created": new Date().toISOString()
        };

        // Sign the presentation
        const privateKey = await window.didManager.getPrivateKey();
        const proof = await this.createProof(presentation, privateKey, holderDID);

        const verifiablePresentation = {
            ...presentation,
            proof: proof
        };

        console.log('Presentation created');
        return verifiablePresentation;
    }

    /**
     * Get all credentials for the current user
     */
    async getMyCredentials() {
        const myDID = window.didManager.activeDID?.id;
        if (!myDID) return [];

        return this.credentials.filter(
            c => c.credentialSubject.id === myDID || c.issuer === myDID
        );
    }

    /**
     * Get a specific credential by ID
     */
    getCredential(id) {
        return this.credentials.find(c => c.id === id);
    }

    /**
     * Delete a credential
     */
    async deleteCredential(id) {
        await window.storageManager.delete('credentials', id);
        this.credentials = this.credentials.filter(c => c.id !== id);
        console.log('Credential deleted:', id);
    }

    // --- Helper Functions ---

    // 10-point grading scale (edit as per the university's scheme)
    static GRADE_POINTS = {
        'O': 10, 'A+': 9, 'A': 8, 'B+': 7,
        'B': 6, 'C': 5, 'P': 4, 'F': 0
    };

    /**
     * Calculate CGPA (out of 10) = Σ(grade point × credits) / Σ(credits)
     */
    calculateGPA(courses) {
        if (!courses || courses.length === 0) return '0.00';

        let totalPoints = 0;
        let totalCredits = 0;

        for (const course of courses) {
            const name = course.courseName || course.name || 'course';
            const grade = String(course.grade || '').trim().toUpperCase();
            const credits = parseFloat(course.credits);

            if (!(grade in CredentialManager.GRADE_POINTS)) {
                throw new Error(`Invalid grade "${course.grade}" for ${name}. Use: O, A+, A, B+, B, C, P, F`);
            }
            if (!(credits > 0)) {
                throw new Error(`Invalid credits for ${name}`);
            }

            totalPoints += CredentialManager.GRADE_POINTS[grade] * credits;
            totalCredits += credits;
        }

        return (totalPoints / totalCredits).toFixed(2);
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
}

// Export singleton
window.credentialManager = new CredentialManager();
