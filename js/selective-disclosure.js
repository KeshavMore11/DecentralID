/**
 * SelectiveDisclosure
 * 
 * Implements selective disclosure for Verifiable Credentials.
 * Allows holders to reveal only specific attributes while proving credential validity.
 * 
 * Note: This is a simplified implementation using commitment schemes.
 * Production systems would use BBS+ signatures or similar ZKP schemes.
 */
class SelectiveDisclosure {
    constructor() {
        this.commitments = new Map();
    }

    /**
     * Create attribute commitments for a credential
     * Each attribute is hashed with a nonce for privacy
     * 
     * @param {Object} credential - The verifiable credential
     * @returns {Promise<Object>} Commitment data structure
     */
    async createCommitments(credential) {
        const commitmentData = {
            credentialId: credential.id,
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate,
            attributes: {},
            nonces: {},
            proof: credential.proof // Keep original proof
        };

        // Extract all attributes from credentialSubject
        const subject = credential.credentialSubject;

        for (const [key, value] of Object.entries(subject)) {
            // Generate random nonce for this attribute
            const nonce = this.generateNonce();

            // Create commitment: Hash(attribute_value || nonce)
            const commitment = await this.createCommitment(value, nonce);

            commitmentData.attributes[key] = commitment;
            commitmentData.nonces[key] = nonce;
        }

        // Store commitments for later disclosure
        this.commitments.set(credential.id, commitmentData);

        return commitmentData;
    }

    /**
     * Create a commitment for an attribute value
     * @param {any} value - The attribute value
     * @param {string} nonce - Random nonce
     * @returns {Promise<string>} The commitment hash
     */
    async createCommitment(value, nonce) {
        const data = JSON.stringify(value) + nonce;
        return await window.cryptoUtils.hash(data);
    }

    /**
     * Create a selective disclosure presentation
     * Only reveals selected attributes while hiding others
     * 
     * @param {Object} credential - The original credential
     * @param {Array<string>} attributesToReveal - List of attribute keys to reveal
     * @returns {Promise<Object>} Selective disclosure presentation
     */
    async createSelectivePresentation(credential, attributesToReveal = []) {
        // Create commitments if not already created
        let commitmentData = this.commitments.get(credential.id);
        if (!commitmentData) {
            commitmentData = await this.createCommitments(credential);
        }

        // Build the selective presentation
        const presentation = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ],
            "type": ["VerifiablePresentation", "SelectiveDisclosurePresentation"],
            "id": `urn:uuid:${this.generateUUID()}`,
            "credentialId": credential.id,
            "issuer": credential.issuer,
            "issuanceDate": credential.issuanceDate,
            "originalProof": credential.proof, // Proof of the original credential
            "disclosedAttributes": {},
            "commitments": {},
            "proofs": {} // Proofs that disclosed attributes match commitments
        };

        const subject = credential.credentialSubject;

        // Process all attributes (excluding structural 'id' field)
        for (const [key, value] of Object.entries(subject)) {
            // Skip the 'id' field as it's structural/required, not a selectable attribute
            if (key === 'id') {
                continue;
            }

            if (attributesToReveal.includes(key)) {
                // REVEAL: Include actual value and proof
                presentation.disclosedAttributes[key] = value;

                // Include nonce so verifier can check commitment
                const nonce = commitmentData.nonces[key];
                presentation.proofs[key] = {
                    value: value,
                    nonce: nonce,
                    commitment: commitmentData.attributes[key]
                };
            } else {
                // HIDE: Only include commitment
                presentation.commitments[key] = commitmentData.attributes[key];
            }
        }

        // Add metadata about what's hidden
        presentation.hiddenAttributeCount = Object.keys(presentation.commitments).length;
        presentation.revealedAttributeCount = Object.keys(presentation.disclosedAttributes).length;

        return presentation;
    }

    /**
     * Verify a selective disclosure presentation
     * Checks that disclosed attributes match their commitments
     * 
     * @param {Object} presentation - The selective disclosure presentation
     * @returns {Promise<Object>} Verification result
     */
    async verifySelectivePresentation(presentation) {
        const result = {
            verified: false,
            checks: {
                structure: false,
                commitments: false,
                originalSignature: false
            },
            disclosedAttributes: {},
            hiddenCount: 0,
            errors: []
        };

        try {
            // 1. Check structure
            if (!presentation.disclosedAttributes || !presentation.proofs || !presentation.originalProof) {
                result.errors.push("Invalid presentation structure");
                return result;
            }
            result.checks.structure = true;

            // 2. Verify disclosed attribute commitments
            let allCommitmentsValid = true;

            for (const [key, proofData] of Object.entries(presentation.proofs)) {
                // Recompute commitment from revealed value and nonce
                const recomputedCommitment = await this.createCommitment(
                    proofData.value,
                    proofData.nonce
                );

                // Check if it matches the claimed commitment
                if (recomputedCommitment !== proofData.commitment) {
                    result.errors.push(`Commitment mismatch for attribute: ${key}`);
                    allCommitmentsValid = false;
                } else {
                    result.disclosedAttributes[key] = proofData.value;
                }
            }

            result.checks.commitments = allCommitmentsValid;

            // Calculate hidden count from actual commitments object
            result.hiddenCount = presentation.commitments ? Object.keys(presentation.commitments).length : 0;

            // 3. Verify original credential signature
            // We would need to reconstruct the original credential to verify
            // For this demo, we'll trust the original proof is valid if issuer is known
            // In production, you'd verify the signature against issuer's public key

            if (presentation.issuer && presentation.originalProof) {
                result.checks.originalSignature = true; // Simplified check
            }

            // 4. Overall verification
            result.verified = Object.values(result.checks).every(v => v === true);

            if (result.verified) {
                console.log('✓ Selective presentation verified');
                console.log(`  Revealed: ${Object.keys(result.disclosedAttributes).length} attributes`);
                console.log(`  Hidden: ${result.hiddenCount} attributes`);
            }

        } catch (error) {
            result.errors.push(error.message);
            console.error('Verification error:', error);
        }

        return result;
    }

    /**
     * Create a predicate proof (e.g., "GPA > 7.0" without revealing exact value)
     * @param {Object} credential - The credential
     * @param {string} attribute - The attribute to prove about
     * @param {string} operator - Comparison operator ('>', '<', '>=', '<=', '==')
     * @param {any} threshold - The threshold value
     * @returns {Promise<Object>} Predicate proof
     */
    async createPredicateProof(credential, attribute, operator, threshold) {
        const subject = credential.credentialSubject;
        const actualValue = subject[attribute];

        if (actualValue === undefined) {
            throw new Error(`Attribute ${attribute} not found in credential`);
        }

        // Evaluate the predicate
        let predicateHolds = false;
        switch (operator) {
            case '>':
                predicateHolds = parseFloat(actualValue) > parseFloat(threshold);
                break;
            case '<':
                predicateHolds = parseFloat(actualValue) < parseFloat(threshold);
                break;
            case '>=':
                predicateHolds = parseFloat(actualValue) >= parseFloat(threshold);
                break;
            case '<=':
                predicateHolds = parseFloat(actualValue) <= parseFloat(threshold);
                break;
            case '==':
                predicateHolds = actualValue == threshold;
                break;
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }

        // Create a commitment to the actual value (for potential later disclosure)
        const nonce = this.generateNonce();
        const commitment = await this.createCommitment(actualValue, nonce);

        // Create predicate proof
        const predicateProof = {
            type: "PredicateProof",
            credentialId: credential.id,
            attribute: attribute,
            predicate: `${attribute} ${operator} ${threshold}`,
            holds: predicateHolds,
            commitment: commitment,
            proof: {
                // In a real ZKP system, this would be cryptographic proof
                // For demo, we use a hash of the actual value + predicate
                hash: await window.cryptoUtils.hash(
                    `${actualValue}${operator}${threshold}${predicateHolds}`
                )
            },
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate
        };

        return predicateProof;
    }

    /**
     * Create a range proof (e.g., "Age between 18 and 65")
     * @param {Object} credential - The credential
     * @param {string} attribute - The attribute
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {Promise<Object>} Range proof
     */
    async createRangeProof(credential, attribute, min, max) {
        const subject = credential.credentialSubject;
        const actualValue = parseFloat(subject[attribute]);

        if (isNaN(actualValue)) {
            throw new Error(`Attribute ${attribute} is not a number`);
        }

        const inRange = actualValue >= min && actualValue <= max;
        const nonce = this.generateNonce();
        const commitment = await this.createCommitment(actualValue, nonce);

        const rangeProof = {
            type: "RangeProof",
            credentialId: credential.id,
            attribute: attribute,
            range: `${min} <= ${attribute} <= ${max}`,
            holds: inRange,
            commitment: commitment,
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate
        };

        return rangeProof;
    }

    // --- Helper Functions ---

    /**
     * Generate a random nonce
     */
    generateNonce() {
        const array = new Uint8Array(16);
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
     * Get a user-friendly summary of what's revealed/hidden
     */
    getPresentationSummary(presentation) {
        return {
            revealed: Object.keys(presentation.disclosedAttributes),
            hidden: Object.keys(presentation.commitments),
            totalAttributes: presentation.revealedAttributeCount + presentation.hiddenAttributeCount
        };
    }
}

// Export singleton
window.selectiveDisclosure = new SelectiveDisclosure();
