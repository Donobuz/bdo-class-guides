const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadServerSettings, saveServerSettings } = require('../utils/serverSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guides-setup')
        .setDescription('Configure guide system permissions and settings (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Configure guide roles (adds to existing roles)')
                .addRoleOption(option =>
                    option
                        .setName('creator1')
                        .setDescription('Guide Creator role (can create, edit, delete own guides)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('creator2')
                        .setDescription('Additional Guide Creator role')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('creator3')
                        .setDescription('Additional Guide Creator role')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('admin1')
                        .setDescription('Guide Admin role (can edit/delete guides from this server)')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('admin2')
                        .setDescription('Additional Guide Admin role')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('admin3')
                        .setDescription('Additional Guide Admin role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove guide roles')
                .addRoleOption(option =>
                    option
                        .setName('role1')
                        .setDescription('Role to remove from guide permissions')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('role2')
                        .setDescription('Additional role to remove')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('role3')
                        .setDescription('Additional role to remove')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current guide system settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all guide settings to default')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'roles') {
                await handleRoleSetup(interaction, guildId);
            } else if (subcommand === 'remove') {
                await handleRoleRemove(interaction, guildId);
            } else if (subcommand === 'view') {
                await handleViewSettings(interaction, guildId);
            } else if (subcommand === 'reset') {
                await handleReset(interaction, guildId);
            }
        } catch (error) {
            console.error('Error in guides-setup:', error);
            await interaction.reply({
                content: 'An error occurred while updating settings.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

async function handleRoleSetup(interaction, guildId) {
    // Collect all provided roles
    const creatorRoles = [
        interaction.options.getRole('creator1'),
        interaction.options.getRole('creator2'),
        interaction.options.getRole('creator3')
    ].filter(role => role !== null);
    
    const adminRoles = [
        interaction.options.getRole('admin1'),
        interaction.options.getRole('admin2'),
        interaction.options.getRole('admin3')
    ].filter(role => role !== null);

    // Check if at least one role is provided
    if (creatorRoles.length === 0 && adminRoles.length === 0) {
        return await interaction.reply({
            content: 'Please specify at least one role to configure.',
            flags: MessageFlags.Ephemeral
        });
    }

    // Load current settings
    const settings = await loadServerSettings(guildId);

    // Check limits before adding
    if (creatorRoles.length > 0) {
        const newCreatorIds = creatorRoles.map(r => r.id);
        const combinedCreatorIds = [...new Set([...settings.guideCreatorRoleIds, ...newCreatorIds])];
        
        if (combinedCreatorIds.length > 3) {
            return await interaction.reply({
                content: `Cannot add roles. Maximum of 3 Guide Creator roles allowed. You currently have ${settings.guideCreatorRoleIds.length} role(s) configured. Remove some roles first with \`/guides-setup remove\`.`,
                flags: MessageFlags.Ephemeral
            });
        }
        
        settings.guideCreatorRoleIds = combinedCreatorIds;
    }
    
    if (adminRoles.length > 0) {
        const newAdminIds = adminRoles.map(r => r.id);
        const combinedAdminIds = [...new Set([...settings.guideAdminRoleIds, ...newAdminIds])];
        
        if (combinedAdminIds.length > 3) {
            return await interaction.reply({
                content: `Cannot add roles. Maximum of 3 Guide Admin roles allowed. You currently have ${settings.guideAdminRoleIds.length} role(s) configured. Remove some roles first with \`/guides-setup remove\`.`,
                flags: MessageFlags.Ephemeral
            });
        }
        
        settings.guideAdminRoleIds = combinedAdminIds;
    }

    // Mark setup as complete
    if (!settings.setupComplete) {
        settings.setupComplete = true;
        settings.setupBy = interaction.user.id;
        settings.setupAt = new Date().toISOString();
    }

    // Save settings
    await saveServerSettings(guildId, settings);

    // Build response embed
    const embed = new EmbedBuilder()
        .setTitle('Guide Roles Updated')
        .setDescription('Guide system roles have been configured successfully!')
        .setColor(0x00FF00)
        .setTimestamp();

    if (creatorRoles.length > 0) {
        embed.addFields({ 
            name: 'Added Guide Creator Roles', 
            value: creatorRoles.map(r => `<@&${r.id}>`).join('\n'),
            inline: true 
        });
    }

    if (adminRoles.length > 0) {
        embed.addFields({ 
            name: 'Added Guide Admin Roles', 
            value: adminRoles.map(r => `<@&${r.id}>`).join('\n'),
            inline: true 
        });
    }

    embed.addFields({
        name: 'Role Permissions',
        value: 
            '**Guide Creator:** Can create, edit, and delete their own guides\n' +
            '**Guide Admin:** Can edit and delete any guide created in this server',
        inline: false
    });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleViewSettings(interaction, guildId) {
    const settings = await loadServerSettings(guildId);

    const embed = new EmbedBuilder()
        .setTitle('Guide System Settings')
        .setDescription('Current configuration for the guide system')
        .setColor(0x3498db)
        .setTimestamp();

    // Role settings
    const creatorRoles = settings.guideCreatorRoleIds && settings.guideCreatorRoleIds.length > 0
        ? settings.guideCreatorRoleIds.map(id => `<@&${id}>`).join('\n')
        : 'Not set';
    const adminRoles = settings.guideAdminRoleIds && settings.guideAdminRoleIds.length > 0
        ? settings.guideAdminRoleIds.map(id => `<@&${id}>`).join('\n')
        : 'Not set';

    embed.addFields(
        { name: 'Guide Creator Roles', value: creatorRoles, inline: true },
        { name: 'Guide Admin Roles', value: adminRoles, inline: true }
    );

    // Setup info
    if (settings.setupComplete) {
        embed.addFields({
            name: 'Setup Status',
            value: `Completed by <@${settings.setupBy}>\n${new Date(settings.setupAt).toLocaleString()}`,
            inline: false
        });
    } else {
        embed.addFields({
            name: 'Setup Status',
            value: 'Not yet configured. Run `/guides-setup roles` to configure.',
            inline: false
        });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleRoleRemove(interaction, guildId) {
    // Collect all provided roles to remove
    const rolesToRemove = [
        interaction.options.getRole('role1'),
        interaction.options.getRole('role2'),
        interaction.options.getRole('role3')
    ].filter(role => role !== null);

    if (rolesToRemove.length === 0) {
        return await interaction.reply({
            content: 'Please specify at least one role to remove.',
            flags: MessageFlags.Ephemeral
        });
    }

    // Load current settings
    const settings = await loadServerSettings(guildId);
    const roleIdsToRemove = rolesToRemove.map(r => r.id);
    
    // Remove from both arrays
    const removedFromCreator = settings.guideCreatorRoleIds.filter(id => roleIdsToRemove.includes(id));
    const removedFromAdmin = settings.guideAdminRoleIds.filter(id => roleIdsToRemove.includes(id));
    
    settings.guideCreatorRoleIds = settings.guideCreatorRoleIds.filter(id => !roleIdsToRemove.includes(id));
    settings.guideAdminRoleIds = settings.guideAdminRoleIds.filter(id => !roleIdsToRemove.includes(id));
    
    // Save settings
    await saveServerSettings(guildId, settings);

    // Build response
    const embed = new EmbedBuilder()
        .setTitle('Guide Roles Removed')
        .setDescription('The specified roles have been removed from guide permissions.')
        .setColor(0xFF9800)
        .setTimestamp();

    if (removedFromCreator.length > 0) {
        embed.addFields({
            name: 'Removed from Guide Creator',
            value: removedFromCreator.map(id => `<@&${id}>`).join('\n'),
            inline: true
        });
    }

    if (removedFromAdmin.length > 0) {
        embed.addFields({
            name: 'Removed from Guide Admin',
            value: removedFromAdmin.map(id => `<@&${id}>`).join('\n'),
            inline: true
        });
    }

    if (removedFromCreator.length === 0 && removedFromAdmin.length === 0) {
        embed.setDescription('None of the specified roles were configured for guide permissions.');
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function handleReset(interaction, guildId) {
    const { getDefaultSettings } = require('../utils/serverSettings');
    const defaultSettings = getDefaultSettings();
    
    await saveServerSettings(guildId, defaultSettings);

    const embed = new EmbedBuilder()
        .setTitle('Settings Reset')
        .setDescription('All guide system settings have been reset to defaults.')
        .setColor(0xFF9800)
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
