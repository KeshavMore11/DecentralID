const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

let db = null;
let client = null;

async function connectDB() {
    try {
        if (db) {
            return db;
        }

        const uri = process.env.MONGODB_URI;

        if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
            throw new Error('Please configure your MongoDB Atlas connection string in .env file');
        }

        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        await client.db("admin").command({ ping: 1 });

        db = client.db('ssi_auth');
        console.log('✓ Successfully connected to MongoDB Atlas!');

        // Create indexes for unique fields
        await db.collection('universities').createIndex({ email: 1 }, { unique: true });
        await db.collection('verifiers').createIndex({ orgId: 1 }, { unique: true });

        return db;
    } catch (error) {
        console.error('✗ MongoDB connection error:', error.message);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('✓ MongoDB connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };
