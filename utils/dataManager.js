const { getDatabase } = require('./database');

/**
 * Saves guide data to MongoDB
 * @param {Object} guideData - The guide data to save
 * @returns {Promise<Object>} - Object with {success: boolean, wasUpdate: boolean}
 */
async function saveGuideData(guideData) {
    const { className, guideType, spec, submittedById } = guideData;
    
    try {
        const db = getDatabase();
        const guidesCollection = db.collection('guides');
        
        // Check if guide already exists
        const existingGuide = await guidesCollection.findOne({
            className: className.toLowerCase(),
            guideType,
            spec,
            submittedById
        });
        
        const wasUpdate = !!existingGuide;
        
        // Upsert the guide (update if exists, insert if not)
        await guidesCollection.updateOne(
            {
                className: className.toLowerCase(),
                guideType,
                spec,
                submittedById
            },
            {
                $set: {
                    ...guideData,
                    className: className.toLowerCase(),
                    updatedAt: new Date().toISOString()
                }
            },
            { upsert: true }
        );
        
        console.log(`Guide ${wasUpdate ? 'updated' : 'created'} successfully: ${className}/${guideType}/${spec}/${submittedById}`);
        return { success: true, wasUpdate };
        
    } catch (error) {
        console.error('Error saving guide data:', error);
        return { success: false, wasUpdate: false };
    }
}

/**
 * Loads all guides for a specific class and type across all specs
 * @param {string} className - Class name
 * @param {string} guideType - Guide type (pvp/pve)
 * @returns {Array} - Array of guide data objects from both succession and awakening
 */
async function loadAllGuidesForClassType(className, guideType) {
    try {
        const db = getDatabase();
        const guidesCollection = db.collection('guides');
        
        const guides = await guidesCollection.find({
            className: className.toLowerCase(),
            guideType
        }).toArray();
        
        return guides;
    } catch (error) {
        console.error('Error loading guides:', error);
        return [];
    }
}

/**
 * Loads all guides for a specific class, type, and spec
 * @param {string} className - Class name
 * @param {string} guideType - Guide type (pvp/pve)
 * @param {string} spec - Spec (succession/awakening)
 * @returns {Array} - Array of guide data objects
 */
async function loadAllGuides(className, guideType, spec) {
    try {
        const db = getDatabase();
        const guidesCollection = db.collection('guides');
        
        const guides = await guidesCollection.find({
            className: className.toLowerCase(),
            guideType,
            spec
        }).toArray();
        
        return guides;
    } catch (error) {
        console.error('Error loading guides:', error);
        return [];
    }
}

/**
 * Loads a specific guide by Discord ID
 * @param {string} className - Class name
 * @param {string} guideType - Guide type (pvp/pve)
 * @param {string} spec - Spec (succession/awakening)
 * @param {string} discordId - Discord user ID
 * @returns {Object|null} - Guide data or null if not found
 */
async function loadGuideByDiscordId(className, guideType, spec, discordId) {
    try {
        const db = getDatabase();
        const guidesCollection = db.collection('guides');
        
        const guide = await guidesCollection.findOne({
            className: className.toLowerCase(),
            guideType,
            spec,
            submittedById: discordId
        });
        
        return guide;
    } catch (error) {
        console.error('Error loading guide:', error);
        return null;
    }
}

/**
 * Deletes a guide
 * @param {string} className - Class name
 * @param {string} guideType - Guide type (pvp/pve)
 * @param {string} spec - Spec (succession/awakening)
 * @param {string} discordId - Discord user ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteGuide(className, guideType, spec, discordId) {
    try {
        const db = getDatabase();
        const guidesCollection = db.collection('guides');
        
        const result = await guidesCollection.deleteOne({
            className: className.toLowerCase(),
            guideType,
            spec,
            submittedById: discordId
        });
        
        if (result.deletedCount > 0) {
            console.log(`Guide deleted successfully: ${className}/${guideType}/${spec}/${discordId}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error deleting guide: ${error}`);
        throw error;
    }
}

module.exports = {
    saveGuideData,
    loadAllGuides,
    loadAllGuidesForClassType,
    loadGuideByDiscordId,
    deleteGuide
};
