const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { hasGuidePermission, checkPermissions } = require('../utils/permissions');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { createGuideSelectionEmbed } = require('../utils/embedBuilder');
const { isAscensionClass, getPrimarySpec, createGuideTitle } = require('../utils/classUtils');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-guide')
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
        // Check if user has permission to submit guides
        if (!hasGuidePermission(interaction.member)) {
            return await interaction.reply({
                content: 'You do not have permission to submit guides. Please contact an administrator.',
                ephemeral: true
            });
        }

        const guideType = interaction.options.getString('type');
        const className = interaction.options.getString('class');
        const userId = interaction.user.id;
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        // Check if regular member (non-admin) already has a guide for this class/type
        if (!isAdmin) {
            try {
                const existingGuides = await loadAllGuidesForClassType(className, guideType);
                const userGuides = existingGuides.filter(guide => guide.submittedById === userId);
                
                if (userGuides.length > 0) {
                    const existingSpecs = userGuides.map(g => 
                        g.spec.charAt(0).toUpperCase() + g.spec.slice(1)
                    ).join(', ');
                    
                    return await interaction.reply({
                        content: `❌ You already have a ${className} ${guideType.toUpperCase()} guide (${existingSpecs}). Regular members can only have one guide per class/type combination. Contact an administrator if you need to edit your existing guide.`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error checking existing guides:', error);
                // Continue with creation if there's an error checking (fail gracefully)
            }
        }
        
        // Check if this is an ascension class
        const isAscension = isAscensionClass(className);
        const primarySpec = getPrimarySpec(className);
        
        // For ascension classes: go straight to guide creation modal
        if (isAscension) {
            try {
                const totalSteps = guideType === 'pvp' ? '4' : '2';
                const modal = new ModalBuilder()
                    .setCustomId(`submit_guide_step1_${className}_${guideType}_awakening`)
                    .setTitle(`${createGuideTitle(className, guideType, 'awakening')} - Step 1/${totalSteps}`);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Guide Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Describe your build and playstyle...')
                    .setRequired(true)
                    .setMaxLength(1000);

                const prosInput = new TextInputBuilder()
                    .setCustomId('pros')
                    .setLabel('Pros (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('High damage\nGood mobility\nStrong in 1v1...')
                    .setRequired(true)
                    .setMaxLength(500);

                const consInput = new TextInputBuilder()
                    .setCustomId('cons')
                    .setLabel('Cons (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Resource management\nVulnerable to grabs\nHigh skill requirement...')
                    .setRequired(true)
                    .setMaxLength(500);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(descriptionInput),
                    new ActionRowBuilder().addComponents(prosInput),
                    new ActionRowBuilder().addComponents(consInput)
                );

                return await interaction.showModal(modal);
            } catch (error) {
                console.error('Error showing modal for ascension class:', error);
                return await interaction.reply({
                    content: 'There was an error setting up the guide creation. Please try again.',
                    ephemeral: true
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
            ephemeral: true
        });
    },
};
