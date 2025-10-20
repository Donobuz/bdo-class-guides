const fs = require('fs').promises;
const path = require('path');

const SETTINGS_DIR = path.join(__dirname, '../server-settings');
const SETTINGS_FILE = 'settings.json';

/**
 * Ensure settings directory exists
 */
async function ensureSettingsDir() {
    try {
        await fs.access(SETTINGS_DIR);
    } catch {
        await fs.mkdir(SETTINGS_DIR, { recursive: true });
    }
}

/**
 * Get settings file path for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {string} - Path to settings file
 */
function getSettingsPath(guildId) {
    return path.join(SETTINGS_DIR, `${guildId}.json`);
}

/**
 * Load server settings for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {object} - Server settings object
 */
async function loadServerSettings(guildId) {
    await ensureSettingsDir();
    const settingsPath = getSettingsPath(guildId);
    
    try {
        const data = await fs.readFile(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return default settings if file doesn't exist
        return getDefaultSettings();
    }
}

/**
 * Save server settings for a guild
 * @param {string} guildId - Discord guild ID
 * @param {object} settings - Settings object to save
 */
async function saveServerSettings(guildId, settings) {
    await ensureSettingsDir();
    const settingsPath = getSettingsPath(guildId);
    
    await fs.writeFile(
        settingsPath,
        JSON.stringify(settings, null, 2),
        'utf8'
    );
}

/**
 * Get default server settings
 * @returns {object} - Default settings object
 */
function getDefaultSettings() {
    return {
        guideCreatorRoleId: null,       // Role ID that can create, edit, and delete their own guides
        guideAdminRoleId: null,         // Role ID that can edit/delete any guide created in this server
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
        role.id === settings.guideCreatorRoleId ||
        role.id === settings.guideAdminRoleId
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
        role.id === settings.guideAdminRoleId
    );
}

module.exports = {
    loadServerSettings,
    saveServerSettings,
    getDefaultSettings,
    hasGuidePermission,
    isGuideAdmin
};
