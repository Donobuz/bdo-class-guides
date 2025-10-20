const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { hasGuidePermission, isSetupComplete, getPermissionErrorMessage } = require('../utils/permissions');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { createGuideSelectionEmbed } = require('../utils/embedBuilder');
const { isAscensionClass, getPrimarySpec } = require('../utils/classUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide-create')
        .setDescription('Submit a new class guide for Black Desert Online')
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
        // Check if setup is complete
        const setupComplete = await isSetupComplete(interaction.guild.id);
        if (!setupComplete) {
            const errorMsg = await getPermissionErrorMessage(interaction.guild.id);
            return await interaction.reply({
                content: errorMsg,
                flags: MessageFlags.Ephemeral
            });
        }
        
        // Check if user has permission to submit guides
        const hasPermission = await hasGuidePermission(interaction.member);
        if (!hasPermission) {
            const errorMsg = await getPermissionErrorMessage(interaction.guild.id);
            return await interaction.reply({
                content: errorMsg,
                flags: MessageFlags.Ephemeral
            });
        }

        const guideType = interaction.options.getString('type');
        const className = interaction.options.getString('class');
        const userId = interaction.user.id;
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        // Check if this is an ascension class
        const isAscension = isAscensionClass(className);
        const primarySpec = getPrimarySpec(className);
        
        // For ascension classes: check if user has a guide, then either edit or create
        if (isAscension) {
            try {
                const existingGuides = await loadAllGuidesForClassType(className, guideType);
                const userGuide = existingGuides.find(guide => guide.submittedById === userId && guide.spec === 'awakening');
                
                if (userGuide) {
                    // User already has a guide - redirect to edit
                    const GuideEditHandler = require('./handlers/guide-edit-handler');
                    return await GuideEditHandler.startEditing(interaction, className, guideType, 'awakening', userId);
                }
                
                // No existing guide - create new one
                const GuideCreateHandler = require('./handlers/guide-create-handler');
                return await GuideCreateHandler.showStepModal(interaction, className, guideType, 'awakening', 1);
                
            } catch (error) {
                console.error('Error in ascension class guide creation:', error);
                return await interaction.reply({
                    content: 'There was an error setting up the guide. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
        
        // Create guide selection for non-ascension classes
        const embed = createGuideSelectionEmbed(className, guideType);
        
        // Create buttons for succession and awakening
        const primaryButton = new ButtonBuilder()
            .setCustomId(`guide_${className}_${guideType}_${primarySpec}`)
            .setLabel(primarySpec.charAt(0).toUpperCase() + primarySpec.slice(1))
            .setStyle(ButtonStyle.Primary);

        const awakeningButton = new ButtonBuilder()
            .setCustomId(`guide_${className}_${guideType}_awakening`)
            .setLabel('Awakening')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(primaryButton, awakeningButton);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    },
};
