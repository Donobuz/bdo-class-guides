const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createGuideSelectionEmbed } = require('../utils/embedBuilder');
const { loadAllGuidesForClassType } = require('../utils/dataManager');
const { isAscensionClass, createGuideTitle } = require('../utils/classUtils');
const config = require('../config.js');

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
        
        // For ascension classes with only one guide, show it directly using the same logic as guide view handler
        if (isAscension && allGuides.length === 1) {
            const { EmbedBuilder } = require('discord.js');
            const guide = allGuides[0];
            
            // Create the main guide embed using the same logic as guide view handler
            const embed = new EmbedBuilder()
                .setTitle(createGuideTitle(className, guideType, guide.spec))
                .setDescription(guide.description)
                .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                .addFields(
                    { name: 'Pros', value: guide.pros.length > 0 ? guide.pros.map(pro => `• ${pro}`).join('\n') : 'None listed', inline: true },
                    { name: 'Cons', value: guide.cons.length > 0 ? guide.cons.map(con => `• ${con}`).join('\n') : 'None listed', inline: true },
                    { name: '\u200B', value: '\u200B', inline: false }
                )
                .setFooter({ text: `Submitted by ${guide.username} | ${new Date(guide.submittedAt).toLocaleDateString()}` })
                .setTimestamp();
            
            if (guideType === 'pvp') {
                // PvP Guide Fields
                
                // Addons & Crystals
                if (guide.addonsImgur) {
                    embed.addFields({ name: 'Addons', value: `[View Addons Image](${guide.addonsImgur})`, inline: true });
                    if (guide.addonReasoning) {
                        embed.addFields({ name: 'Addon Reasoning', value: guide.addonReasoning.substring(0, 1024), inline: true });
                    }
                }
                
                if (guide.crystalsImgur) {
                    embed.addFields({ name: 'Crystals', value: `[View Crystals Image](${guide.crystalsImgur})`, inline: true });
                    if (guide.crystalInfo) {
                        embed.addFields({ name: 'Crystal Info', value: guide.crystalInfo.substring(0, 1024), inline: true });
                    }
                }
                
                embed.addFields({ name: '\u200B', value: '\u200B', inline: false });
                
                // Artifacts & Lightstones
                if (guide.artifactsImgur) {
                    embed.addFields({ name: 'Artifacts', value: `[View Artifacts Image](${guide.artifactsImgur})`, inline: true });
                }
                
                if (guide.lightstoneImgur) {
                    embed.addFields({ name: 'Lightstones', value: `[View Lightstone Set](${guide.lightstoneImgur})`, inline: true });
                }
                
                if (guide.reasoning) {
                    embed.addFields({ name: 'Reasoning', value: guide.reasoning.substring(0, 1024), inline: false });
                }
                
                embed.addFields({ name: '\u200B', value: '\u200B', inline: false });
                
                // Movement & Combat
                if (guide.movementExample) {
                    embed.addFields({ name: 'Movement', value: guide.movementExample.substring(0, 1024), inline: false });
                    if (guide.movementVideo) {
                        embed.addFields({ name: 'Movement Video', value: `[View Movement Video](${guide.movementVideo})`, inline: true });
                    }
                }
                
                if (guide.pvpCombo) {
                    embed.addFields({ name: 'PvP Combos', value: guide.pvpCombo.substring(0, 1024), inline: false });
                    if (guide.combatVideo) {
                        embed.addFields({ name: 'Combat Video', value: `[View Combat Video](${guide.combatVideo})`, inline: true });
                    }
                }
                
            } else {
                // PvE Guide Fields (original format)
                embed.addFields(
                    { name: 'Crystals', value: guide.crystals?.length > 0 ? guide.crystals.map(crystal => `• ${crystal}`).join('\n') : 'None listed', inline: true },
                    { name: 'Addons', value: guide.addons?.length > 0 ? guide.addons.map(addon => `• ${addon}`).join('\n') : 'None listed', inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: 'Movement/Mobility', value: guide.movement || 'Not specified', inline: false }
                );
                
                // Add combos if they exist
                if (guide.combos && guide.combos.length > 0) {
                    embed.addFields({ name: 'Combos', value: guide.combos.map(combo => `• ${combo}`).join('\n'), inline: false });
                }
                
                // Add YouTube links if they exist
                if (guide.ytLinks && guide.ytLinks.length > 0) {
                    const ytLinksText = guide.ytLinks.map(link => `• ${link}`).join('\n');
                    embed.addFields({ name: 'YouTube Links', value: ytLinksText, inline: false });
                }
            }
            
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