const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { checkGuideManagementPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide-delete')
        .setDescription('Delete guides')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Guide type')
                .setRequired(true)
                .addChoices(
                    { name: 'PvP', value: 'pvp' },
                    { name: 'PvE', value: 'pve' }
                ))
        .addStringOption(option =>
            option.setName('class')
                .setDescription('Select a class')
                .setRequired(true)
                .setAutocomplete(true)),

    async execute(interaction) {
        // Check permissions
        const permissionCheck = await checkGuideManagementPermission(interaction);
        if (!permissionCheck.canProceed) {
            return await interaction.reply({
                content: permissionCheck.errorMessage,
                flags: MessageFlags.Ephemeral
            });
        }

        const { canManageAllGuides } = permissionCheck;
        const className = interaction.options.getString('class');
        const guideType = interaction.options.getString('type');
        const userId = interaction.user.id;

        try {
            // Load all guides for this class and type
            const guides = await loadAllGuidesForClassType(className, guideType);

            if (!guides || guides.length === 0) {
                return await interaction.reply({
                    content: `No ${guideType.toUpperCase()} guides found for ${className}.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // If user is admin OR guide moderator, show all guides for selection
            if (canManageAllGuides) {
                // Group guides by user
                const guidesByUser = {};
                guides.forEach(guide => {
                    const guideUserId = guide.submittedById;
                    const userName = guide.submittedBy || guide.username || 'Unknown User';
                    const key = `${guideUserId}_${userName}`;
                    
                    if (!guidesByUser[key]) {
                        guidesByUser[key] = [];
                    }
                    guidesByUser[key].push(guide);
                });

                // Create select menu options for each user
                const options = [];
                Object.entries(guidesByUser).forEach(([userKey, userGuides]) => {
                    const [guideUserId, userName] = userKey.split('_');
                    const specs = userGuides.map(g => g.spec).join(', ');
                    
                    options.push({
                        label: `${userName} (${userGuides.length} guide${userGuides.length > 1 ? 's' : ''})`,
                        description: `Specs: ${specs}`,
                        value: userKey
                    });
                });

                // Limit to 25 options (Discord limit)
                if (options.length > 25) {
                    options.splice(25);
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`delete_user_select_${className}_${guideType}`)
                    .setPlaceholder('Select a user whose guides you want to delete')
                    .addOptions(options);

                const cancelButton = new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary);

                const menuRow = new ActionRowBuilder().addComponents(selectMenu);
                const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

                const embed = new EmbedBuilder()
                    .setTitle(`Delete ${className.charAt(0).toUpperCase() + className.slice(1)} ${guideType.toUpperCase()} Guides`)
                    .setDescription(`Found ${guides.length} guide(s) from ${options.length} user(s).\n\nSelect a user to view their guides for deletion.`)
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed],
                    components: [menuRow, buttonRow],
                    flags: MessageFlags.Ephemeral
                });
            } else {
                // Regular user - find their own guide (should only be one per class/type)
                const userGuides = guides.filter(guide => guide.submittedById === userId);
                
                if (userGuides.length === 0) {
                    return interaction.reply({
                        content: `You don't have any ${className} ${guideType.toUpperCase()} guides to delete.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Regular users can only have one guide per class/type, so directly show it for deletion
                const guide = userGuides[0];
                const GuideDeleteHandler = require('./handlers/guide-delete-handler');
                return await GuideDeleteHandler.showSingleGuideDelete(interaction, className, guideType, guide, userId);
            }
        } catch (error) {
            console.error('Error loading guides for deletion:', error);
            await interaction.reply({
                content: 'An error occurred while loading guides.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
