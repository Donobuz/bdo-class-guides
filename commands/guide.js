const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createGuideSelectionEmbed } = require('../utils/embedBuilder');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { isAscensionClass } = require('../utils/classUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide')
        .setDescription('View class guides for Black Desert Online')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('PvP or PvE guide')
                .setRequired(true)
                .addChoices(
                    { name: 'PvP', value: 'pvp' },
                    { name: 'PvE', value: 'pve' }
                ))
        .addStringOption(option =>
            option.setName('class')
                .setDescription('The class you want to learn about')
                .setRequired(true)
                .setAutocomplete(true)),

    async execute(interaction) {
        const guideType = interaction.options.getString('type');
        const className = interaction.options.getString('class');
        
        // Load all guides for this class and type
        const allGuides = await loadAllGuidesForClassType(className, guideType);
        
        if (!allGuides || allGuides.length === 0) {
            return await interaction.reply({
                content: `Sorry, no ${guideType.toUpperCase()} guides found for ${className}. Try creating one with \`/create-guide\`!`,
                ephemeral: true
            });
        }
        
        // Check if this is an ascension class
        const isAscension = isAscensionClass(className);
        
        // Group guides by spec
        const specGroups = {
            succession: allGuides.filter(guide => guide.spec === 'succession'),
            awakening: allGuides.filter(guide => guide.spec === 'awakening')
        };
        
        // For ascension classes with only one guide, show it directly
        if (isAscension && allGuides.length === 1) {
            const { createSavedGuideEmbed } = require('../utils/embedBuilder');
            const guide = allGuides[0];
            const embed = createSavedGuideEmbed(guide);
            
            return await interaction.reply({
                embeds: [embed]
            });
        }
        
        // Create guide selection embed
        const embed = createGuideSelectionEmbed(className, guideType);
        
        const buttons = [];
        
        // Only show buttons for specs that have guides
        if (specGroups.succession.length > 0) {
            const successionButton = new ButtonBuilder()
                .setCustomId(`select_guides_${className}_${guideType}_succession`)
                .setLabel(`Succession (${specGroups.succession.length})`)
                .setStyle(ButtonStyle.Primary);
            buttons.push(successionButton);
        }
        
        if (specGroups.awakening.length > 0) {
            const awakeningButton = new ButtonBuilder()
                .setCustomId(`select_guides_${className}_${guideType}_awakening`)
                .setLabel(`Awakening (${specGroups.awakening.length})`)
                .setStyle(ButtonStyle.Secondary);
            buttons.push(awakeningButton);
        }
        
        if (buttons.length === 0) {
            return await interaction.reply({
                content: `No guides available for ${className} ${guideType.toUpperCase()}.`,
                ephemeral: true
            });
        }
        
        const row = new ActionRowBuilder().addComponents(buttons);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
};