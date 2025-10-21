const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { checkGuideManagementPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide-edit')
        .setDescription('Edit an existing guide')
        .addStringOption(option =>
            option.setName('class')
                .setDescription('Select a class')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Guide type')
                .setRequired(true)
                .addChoices(
                    { name: 'PvP', value: 'pvp' },
                    { name: 'PvE', value: 'pve' }
                )),

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
        
        // Load all guides for the selected class and type
        const allGuides = await loadAllGuidesForClassType(className, guideType);
        
        if (!allGuides || allGuides.length === 0) {
            return interaction.reply({
                content: `No guides found for ${className} ${guideType.toUpperCase()}.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // If user is admin OR guide moderator, show all guides for selection
        if (canManageAllGuides) {
            // Transform guides into user guides format
            const userGuides = allGuides.map(guide => ({
                userId: guide.submittedById,
                username: guide.username || 'Unknown User',
                spec: guide.spec,
                guide: guide
            }));
            
            // Create a select menu for users
            const userOptions = userGuides.map(userGuide => {
                let desc = 'No description';
                if (userGuide.guide.description) {
                    const descStr = String(userGuide.guide.description);
                    desc = descStr.length > 97 ? descStr.substring(0, 97) + '...' : descStr;
                }
                return {
                    label: `${userGuide.username} (${userGuide.spec.charAt(0).toUpperCase() + userGuide.spec.slice(1)})`,
                    description: desc,
                    value: `${userGuide.userId}_${userGuide.spec}`
                };
            });
            
            const userSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`edit_user_select_${className.toLowerCase()}_${guideType}`)
                .setPlaceholder('Select a guide to edit')
                .addOptions(userOptions.slice(0, 25)); // Discord limit of 25 options
            
            const row = new ActionRowBuilder().addComponents(userSelectMenu);
            
            const embed = new EmbedBuilder()
                .setTitle(`📝 Edit ${className} ${guideType.toUpperCase()} Guide`)
                .setDescription(`Select a guide to edit from the dropdown below.`)
                .setColor(0x3498DB)
                .setFooter({ text: `Found ${userGuides.length} guide(s)` });
            
            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        } else {
            // Regular user - find their own guide (should only be one per class/type)
            const userGuides = allGuides.filter(guide => guide.submittedById === userId);
            
            if (userGuides.length === 0) {
                return interaction.reply({
                    content: `You don't have any ${className} ${guideType.toUpperCase()} guides to edit.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Regular users can only have one guide per class/type, so directly start editing
            const guide = userGuides[0];
            const GuideEditHandler = require('./handlers/guide-edit-handler');
            return await GuideEditHandler.startEditing(interaction, className, guideType, guide.spec, userId);
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        
        // List of all BDO classes
        const classes = [
            'Guardian', 'Warrior', 'Ninja', 'Kunoichi', 'Sorceress', 'Wizard', 'Witch',
            'Ranger', 'Berserker', 'Tamer', 'Valkyrie', 'Musa', 'Maehwa', 'Dark Knight',
            'Striker', 'Mystic', 'Lahn', 'Archer', 'Shai', 'Hashashin', 'Nova', 'Sage',
            'Corsair', 'Drakania', 'Scholar', 'Wukong', 'Deadeye'
        ];
        
        const filtered = classes.filter(choice => 
            choice.toLowerCase().includes(focusedValue.toLowerCase())
        );
        
        await interaction.respond(
            filtered.slice(0, 25).map(choice => ({ name: choice, value: choice }))
        );
    }
};
