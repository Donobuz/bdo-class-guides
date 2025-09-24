const config = require('../config.js');

/**
 * Checks if a user has permission to submit guides
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean} - Whether the user has permission
 */
function hasGuidePermission(member) {
    const { allowedPermissions, allowedRoles, allowedUsers } = config.permissions;
    
    // Check if user ID is in allowed users list
    if (allowedUsers.includes(member.user.id)) {
        return true;
    }
    
    // Check if user has any of the allowed permissions
    for (const permission of allowedPermissions) {
        if (member.permissions.has(permission)) {
            return true;
        }
    }
    
    // Check if user has any of the allowed roles
    for (const roleName of allowedRoles) {
        if (member.roles.cache.some(role => role.name === roleName)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Gets a formatted permission error message
 * @returns {string} - Formatted error message
 */
function getPermissionErrorMessage() {
    const { allowedPermissions, allowedRoles } = config.permissions;
    
    let message = '❌ **Permission Denied**\n\nYou need one of the following to submit guides:\n\n';
    
    if (allowedPermissions.length > 0) {
        message += '**Permissions:**\n';
        message += allowedPermissions.map(perm => `• ${perm}`).join('\n') + '\n\n';
    }
    
    if (allowedRoles.length > 0) {
        message += '**Roles:**\n';
        message += allowedRoles.map(role => `• ${role}`).join('\n') + '\n\n';
    }
    
    message += 'Contact a server admin to get the appropriate role or permission.';
    
    return message;
}

module.exports = {
    hasGuidePermission,
    getPermissionErrorMessage
};
