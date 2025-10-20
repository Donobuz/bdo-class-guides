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
                .setDescription('Configure guide roles')
                .addRoleOption(option =>
                    option
                        .setName('creator')
                        .setDescription('Role that can create, edit, and delete their own guides')
                        .setRequired(false))
                .addRoleOption(option =>
                    option
                        .setName('admin')
                        .setDescription('Role that can edit/delete any guide created in this server')
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
    const creatorRole = interaction.options.getRole('creator');
    const adminRole = interaction.options.getRole('admin');

    // Check if at least one role is provided
    if (!creatorRole && !adminRole) {
        return await interaction.reply({
            content: 'Please specify at least one role to configure.',
            flags: MessageFlags.Ephemeral
        });
    }

    // Load current settings
    const settings = await loadServerSettings(guildId);

    // Update roles
    if (creatorRole) settings.guideCreatorRoleId = creatorRole.id;
    if (adminRole) settings.guideAdminRoleId = adminRole.id;

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

    if (creatorRole) {
        embed.addFields({ 
            name: 'Guide Creator Role', 
            value: `<@&${creatorRole.id}>`,
            inline: true 
        });
    }

    if (adminRole) {
        embed.addFields({ 
            name: 'Guide Admin Role', 
            value: `<@&${adminRole.id}>`,
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
        .setTitle('⚙️ Guide System Settings')
        .setDescription('Current configuration for the guide system')
        .setColor(0x3498db)
        .setTimestamp();

    // Role settings
    const creatorRole = settings.guideCreatorRoleId 
        ? `<@&${settings.guideCreatorRoleId}>` 
        : 'Not set';
    const adminRole = settings.guideAdminRoleId 
        ? `<@&${settings.guideAdminRoleId}>` 
        : 'Not set';

    embed.addFields(
        { name: 'Guide Creator Role', value: creatorRole, inline: true },
        { name: 'Guide Admin Role', value: adminRole, inline: true }
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

async function handleReset(interaction, guildId) {
    const { getDefaultSettings } = require('../utils/serverSettings');
    const defaultSettings = getDefaultSettings();
    
    await saveServerSettings(guildId, defaultSettings);

    const embed = new EmbedBuilder()
        .setTitle('🔄 Settings Reset')
        .setDescription('All guide system settings have been reset to defaults.')
        .setColor(0xFF9800)
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
