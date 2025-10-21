const { getDatabase } = require('./database');

/**
 * Load server settings for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {object} - Server settings object
 */
async function loadServerSettings(guildId) {
    try {
        const db = getDatabase();
        const serverSettingsCollection = db.collection('serverSettings');
        
        const settings = await serverSettingsCollection.findOne({ guildId });
        
        if (settings) {
            return settings;
        }
        
        // Return default settings if not found
        return getDefaultSettings();
    } catch (error) {
        console.error('Error loading server settings:', error);
        return getDefaultSettings();
    }
}

/**
 * Save server settings for a guild
 * @param {string} guildId - Discord guild ID
 * @param {object} settings - Settings object to save
 */
async function saveServerSettings(guildId, settings) {
    try {
        const db = getDatabase();
        const serverSettingsCollection = db.collection('serverSettings');
        
        await serverSettingsCollection.updateOne(
            { guildId },
            { $set: { ...settings, guildId, updatedAt: new Date().toISOString() } },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error saving server settings:', error);
        throw error;
    }
}

/**
 * Get default server settings
 * @returns {object} - Default settings object
 */
function getDefaultSettings() {
    return {
        guideCreatorRoleIds: [],        // Array of role IDs that can create, edit, and delete their own guides
        guideAdminRoleIds: [],          // Array of role IDs that can edit/delete any guide created in this server
        allowedChannelIds: [],          // Channels where guide commands work (empty = all)
        requireApproval: false,         // Require moderator approval for new guides
        setupComplete: false,           // Track if initial setup is done
        setupBy: null,                  // User who completed setup
        setupAt: null                   // Timestamp of setup
    };
}

/**
 * Check if user has guide permissions in a guild
 * @param {GuildMember} member - Discord guild member
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<boolean>} - Whether user has permissions
 */
async function hasGuidePermission(member, guildId) {
    const settings = await loadServerSettings(guildId);
    
    // Check if user has any of the guide roles
    return member.roles.cache.some(role => 
        settings.guideCreatorRoleIds.includes(role.id) ||
        settings.guideAdminRoleIds.includes(role.id)
    );
}

/**
 * Check if user has guide admin permissions
 * @param {GuildMember} member - Discord guild member
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<boolean>} - Whether user is a guide admin
 */
async function isGuideAdmin(member, guildId) {
    const settings = await loadServerSettings(guildId);
    
    return member.roles.cache.some(role => 
        settings.guideAdminRoleIds.includes(role.id)
    );
}

module.exports = {
    loadServerSettings,
    saveServerSettings,
    getDefaultSettings,
    hasGuidePermission,
    isGuideAdmin
};
