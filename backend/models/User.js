const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

class User {
    /**
     * Create a new university user
     */
    static async createUniversity(email, password, universityName) {
        const db = getDB();
        const hashedPassword = await bcrypt.hash(password, 10);

        const university = {
            email,
            password: hashedPassword,
            universityName,
            role: 'university',
            createdAt: new Date()
        };

        const result = await db.collection('universities').insertOne(university);
        return result;
    }

    /**
     * Create a new verifier user
     */
    static async createVerifier(orgId, password, organizationName) {
        const db = getDB();
        const hashedPassword = await bcrypt.hash(password, 10);

        const verifier = {
            orgId,
            password: hashedPassword,
            organizationName,
            role: 'verifier',
            createdAt: new Date()
        };

        const result = await db.collection('verifiers').insertOne(verifier);
        return result;
    }

    /**
     * Find university by email
     */
    static async findUniversityByEmail(email) {
        const db = getDB();
        return await db.collection('universities').findOne({ email });
    }

    /**
     * Find verifier by organization ID
     */
    static async findVerifierByOrgId(orgId) {
        const db = getDB();
        return await db.collection('verifiers').findOne({ orgId });
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Get all universities (for admin purposes)
     */
    static async getAllUniversities() {
        const db = getDB();
        return await db.collection('universities').find({}).project({ password: 0 }).toArray();
    }

    /**
     * Get all verifiers (for admin purposes)
     */
    static async getAllVerifiers() {
        const db = getDB();
        return await db.collection('verifiers').find({}).project({ password: 0 }).toArray();
    }
}

module.exports = User;
