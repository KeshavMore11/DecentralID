const { connectDB, closeDB } = require('../config/database');
const User = require('../models/User');

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // Connect to database
        await connectDB();

        // Create demo university user
        const universityEmail = 'admin@university.edu';
        const existingUniversity = await User.findUniversityByEmail(universityEmail);

        if (!existingUniversity) {
            await User.createUniversity(universityEmail, 'password', 'Demo University');
            console.log('✓ Created demo university user:', universityEmail);
        } else {
            console.log('• University user already exists:', universityEmail);
        }

        // Create demo verifier user
        const verifierOrgId = 'org_demo';
        const existingVerifier = await User.findVerifierByOrgId(verifierOrgId);

        if (!existingVerifier) {
            await User.createVerifier(verifierOrgId, 'demo_key', 'Demo Organization');
            console.log('✓ Created demo verifier user:', verifierOrgId);
        } else {
            console.log('• Verifier user already exists:', verifierOrgId);
        }

        console.log('\n✓ Database seeding completed!');
        console.log('\nDemo Credentials:');
        console.log('University: admin@university.edu / password');
        console.log('Verifier: org_demo / demo_key');

    } catch (error) {
        console.error('✗ Seeding error:', error);
    } finally {
        await closeDB();
        process.exit(0);
    }
}

seedDatabase();
