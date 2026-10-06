const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Validation middleware
const validateUniversityLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const validateVerifierLogin = [
    body('orgId').notEmpty().withMessage('Organization ID is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const validateUniversityRegister = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('universityName').notEmpty().withMessage('University name is required')
];

const validateVerifierRegister = [
    body('orgId').notEmpty().withMessage('Organization ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('organizationName').notEmpty().withMessage('Organization name is required')
];

// University Login
router.post('/university/login', validateUniversityLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find university user
        const university = await User.findUniversityByEmail(email);
        if (!university) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, university.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken({
            id: university._id,
            email: university.email,
            role: 'university',
            universityName: university.universityName
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                email: university.email,
                universityName: university.universityName,
                role: 'university'
            }
        });
    } catch (error) {
        console.error('University login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Verifier Login
router.post('/verifier/login', validateVerifierLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { orgId, password } = req.body;

        // Find verifier user
        const verifier = await User.findVerifierByOrgId(orgId);
        if (!verifier) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, verifier.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken({
            id: verifier._id,
            orgId: verifier.orgId,
            role: 'verifier',
            organizationName: verifier.organizationName
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                orgId: verifier.orgId,
                organizationName: verifier.organizationName,
                role: 'verifier'
            }
        });
    } catch (error) {
        console.error('Verifier login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// University Registration
router.post('/university/register', validateUniversityRegister, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, universityName } = req.body;

        // Check if university already exists
        const existingUniversity = await User.findUniversityByEmail(email);
        if (existingUniversity) {
            return res.status(400).json({ error: 'University with this email already exists' });
        }

        // Create new university
        await User.createUniversity(email, password, universityName);

        res.status(201).json({
            success: true,
            message: 'University registered successfully'
        });
    } catch (error) {
        console.error('University registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Verifier Registration
router.post('/verifier/register', validateVerifierRegister, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { orgId, password, organizationName } = req.body;

        // Check if verifier already exists
        const existingVerifier = await User.findVerifierByOrgId(orgId);
        if (existingVerifier) {
            return res.status(400).json({ error: 'Organization with this ID already exists' });
        }

        // Create new verifier
        await User.createVerifier(orgId, password, organizationName);

        res.status(201).json({
            success: true,
            message: 'Verifier registered successfully'
        });
    } catch (error) {
        console.error('Verifier registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

module.exports = router;
