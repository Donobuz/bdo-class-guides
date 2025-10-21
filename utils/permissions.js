const { PermissionFlagsBits } = require('discord.js');
const { loadServerSettings } = require('./serverSettings');

/**
 * Bot owner user IDs that have full cross-server control
 * Can edit and delete ANY guide regardless of server origin
 * Add your Discord user ID here
 */
const BOT_OWNER_IDS = [
  "143215050444767232", // Groveybear
];

/**
 * Checks if a user is a bot owner
 * @param {string} userId - Discord user ID
 * @returns {boolean} - Whether the user is a bot owner
 */
function isBotOwner(userId) {
    return BOT_OWNER_IDS.includes(userId);
}

/**
 * Checks if a user has permission to create guides
 * @param {GuildMember} member - Discord guild member
 * @returns {Promise<boolean>} - Whether the user has permission
 */
async function hasGuidePermission(member) {
    const guildId = member.guild.id;
    const settings = await loadServerSettings(guildId);
    
    // Check if setup is complete
    if (!settings.setupComplete) {
        return false;
    }
    
    // Check if user has any of the guide roles
    return member.roles.cache.some(role => 
        settings.guideCreatorRoleIds.includes(role.id) ||
        settings.guideAdminRoleIds.includes(role.id)
    );
}

/**
 * Checks if user has guide admin permissions
 * @param {GuildMember} member - Discord guild member
 * @returns {Promise<boolean>} - Whether user is a guide admin
 */
async function isGuideAdmin(member) {
    const guildId = member.guild.id;
    const settings = await loadServerSettings(guildId);
    
    if (!settings.setupComplete) {
        return false;
    }
    
    return member.roles.cache.some(role => 
        settings.guideAdminRoleIds.includes(role.id)
    );
}

/**
 * Checks if server setup is complete
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<boolean>} - Whether setup is complete
 */
async function isSetupComplete(guildId) {
    const settings = await loadServerSettings(guildId);
    return settings.setupComplete;
}

/**
 * Gets a formatted permission error message
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<string>} - Formatted error message
 */
async function getPermissionErrorMessage(guildId) {
    const settings = await loadServerSettings(guildId);
    
    if (!settings.setupComplete) {
        return '**Guide System Not Configured**\n\n' +
               'The guide system has not been set up on this server yet.\n' +
               'Please ask a server administrator to run `/guides-setup roles` to configure the guide roles.';
    }
    
    let message = '**Permission Denied**\n\nYou need one of the following roles to use guide commands:\n\n';
    
    if (settings.guideCreatorRoleIds && settings.guideCreatorRoleIds.length > 0) {
        message += '**Guide Creator Roles** (Can create, edit, and delete own guides):\n';
        settings.guideCreatorRoleIds.forEach(roleId => {
            message += `• <@&${roleId}>\n`;
        });
    }
    
    if (settings.guideAdminRoleIds && settings.guideAdminRoleIds.length > 0) {
        message += '\n**Guide Admin Roles** (Can edit/delete any guide created in this server):\n';
        settings.guideAdminRoleIds.forEach(roleId => {
            message += `• <@&${roleId}>\n`;
        });
    }
    
    message += '\nContact a server admin to get the appropriate role.';
    
    return message;
}

/**
 * Checks if a user can edit or delete a specific guide
 * @param {GuildMember} member - Discord guild member
 * @param {Object} guide - The guide object to check permissions for
 * @param {string} guide.submittedById - User ID who created the guide
 * @param {string} guide.guildId - Guild ID where guide was created
 * @param {string} guide.guildName - Name of guild where guide was created
 * @returns {Promise<Object>} - Object with {allowed: boolean, errorMessage: string}
 */
async function canModifyGuide(member, guide) {
    const userId = member.user.id;
    const guildId = member.guild.id;
    
    // Check 1: User is the guide creator (can modify from any server)
    const isOwner = userId === guide.submittedById;
    if (isOwner) {
        return { allowed: true };
    }
    
    // Check 2: User is a bot owner (can modify from any server)
    const isBotOwnerUser = isBotOwner(userId);
    if (isBotOwnerUser) {
        return { allowed: true };
    }
    
    // Check 3: User has guide admin role AND guide was created in this server
    const hasAdminRole = await isGuideAdmin(member);
    
    if (!hasAdminRole) {
        return {
            allowed: false,
            errorMessage: '**Permission Denied**\n\nYou can only modify your own guides.'
        };
    }
    
    const isSameGuild = guide.guildId === guildId;
    if (!isSameGuild) {
        return {
            allowed: false,
            errorMessage: `**Permission Denied**\n\nThis guide was created in **${guide.guildName || 'another server'}**.\n\nYou can only modify guides that were created in this server.`
        };
    }
    
    // User is guide admin and guide is from this server
    return { allowed: true };
}

module.exports = {
    hasGuidePermission,
    isGuideAdmin,
    isSetupComplete,
    getPermissionErrorMessage,
    isBotOwner,
    canModifyGuide,
    BOT_OWNER_IDS
};
