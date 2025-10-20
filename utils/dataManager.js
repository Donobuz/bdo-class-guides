const fs = require('fs').promises;
const path = require('path');

/**
 * Saves guide data to the correct file system structure
 * @param {Object} guideData - The guide data to save
 * @returns {Promise<Object>} - Object with {success: boolean, wasUpdate: boolean}
 */
async function saveGuideData(guideData) {
    const { className, guideType, spec, submittedById } = guideData;
    
    // Create the directory structure: guides/className/guideType/spec/
    const guidesDir = path.join(__dirname, '..', 'guides', className.toLowerCase(), guideType, spec);
    
    try {
        // Create all directories
        await fs.mkdir(guidesDir, { recursive: true });
        
        // Check if guide already exists
        const guideFile = path.join(guidesDir, `${submittedById}.json`);
        const exists = await fs.access(guideFile).then(() => true).catch(() => false);
        
        // Save the guide data as userId.json
        await fs.writeFile(guideFile, JSON.stringify(guideData, null, 2));
        
        console.log(`Guide ${exists ? 'updated' : 'created'} successfully: ${guideFile}`);
        return { success: true, wasUpdate: exists };
        
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
    const guides = [];
    
    // Load succession guides
    const successionGuides = await loadAllGuides(className, guideType, 'succession');
    guides.push(...successionGuides);
    
    // Load awakening guides
    const awakeningGuides = await loadAllGuides(className, guideType, 'awakening');
    guides.push(...awakeningGuides);
    
    return guides;
}

/**
 * Loads all guides for a specific class, type, and spec
 * @param {string} className - Class name
 * @param {string} guideType - Guide type (pvp/pve)
 * @param {string} spec - Spec (succession/awakening)
 * @returns {Array} - Array of guide data objects
 */
async function loadAllGuides(className, guideType, spec) {
    const guidesDir = path.join(__dirname, '..', 'guides', className.toLowerCase(), guideType, spec);
    const guides = [];
    
    try {
        // Check if directory exists
        try {
            await fs.access(guidesDir);
        } catch {
            return guides; // Directory doesn't exist
        }
        
        // Read all files in directory
        const files = await fs.readdir(guidesDir);
        const guideFiles = files.filter(f => f.endsWith('.json'));
        
        // Load each guide file
        for (const guideFile of guideFiles) {
            const guideFilePath = path.join(guidesDir, guideFile);
            try {
                const guideData = JSON.parse(await fs.readFile(guideFilePath, 'utf8'));
                guides.push(guideData);
            } catch (error) {
                console.error(`Error reading guide file ${guideFilePath}:`, error);
            }
        }
        
        return guides;
    } catch (error) {
        console.log(`Error loading guides from ${guidesDir}:`, error);
        return guides;
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
    const guideFilePath = path.join(__dirname, '..', 'guides', className.toLowerCase(), guideType, spec, `${discordId}.json`);
    
    try {
        const data = await fs.readFile(guideFilePath, 'utf8');
        const guide = JSON.parse(data);
        return guide;
    } catch (error) {
        console.log(`Guide not found: guides/${className.toLowerCase()}/${guideType}/${spec}/${discordId}.json`);
        return null;
    }
}

module.exports = {
    saveGuideData,
    loadAllGuides,
    loadAllGuidesForClassType,
    loadGuideByDiscordId
};
