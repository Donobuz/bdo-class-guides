const { MongoClient } = require('mongodb');

let client;
let db;

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
    if (db) {
        return db;
    }

    try {
        // Support both Railway's MONGO_URL and custom MONGODB_URI
        const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
        
        if (!uri) {
            throw new Error('MONGO_URL or MONGODB_URI environment variable is not set');
        }

        // MongoDB client options with TLS/SSL configuration for Railway compatibility
        const options = {
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            serverSelectionTimeoutMS: 10000,
        };

        client = new MongoClient(uri, options);
        await client.connect();
        
        db = client.db('bdo-class-guides');
        
        console.log('Successfully connected to MongoDB');
        
        // Create indexes for better query performance
        await createIndexes();
        
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

/**
 * Create indexes for collections
 */
async function createIndexes() {
    try {
        const guidesCollection = db.collection('guides');
        const serverSettingsCollection = db.collection('serverSettings');
        
        // Create compound index for guides queries
        await guidesCollection.createIndex({ className: 1, guideType: 1, spec: 1 });
        await guidesCollection.createIndex({ submittedById: 1 });
        await guidesCollection.createIndex({ guildId: 1 });
        
        // Create index for server settings
        await serverSettingsCollection.createIndex({ guildId: 1 }, { unique: true });
        
        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
async function closeDatabaseConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('Database connection closed');
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    closeDatabaseConnection
};
