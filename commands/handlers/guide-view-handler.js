const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { loadAllGuides } = require('../../utils/dataManager');
const { createGuideTitle, formatSpecForDisplay, getTotalSteps, getStepName } = require('../../utils/classUtils');
const { createSavedGuideEmbed, createGuideSelectionEmbed } = require('../../utils/embedBuilder');
const config = require('../../config.js');

// Updated: 2025-10-20 16:30
class GuideViewHandler {
    static async handleGuideSelect(interaction) {
        const { customId } = interaction;
        
        if (customId.startsWith('guide_')) {
            const [, className, guideType] = customId.split('_');
            
            try {
                const allGuides = await loadAllGuides(className, guideType);
                
                if (!allGuides || allGuides.length === 0) {
                    return await interaction.reply({
                        content: `No guides found for ${className} ${guideType.toUpperCase()}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Create select menu for guide types
                const options = [];
                const guideCounts = {};
                
                // Count guides by spec
                allGuides.forEach(guide => {
                    if (!guideCounts[guide.spec]) {
                        guideCounts[guide.spec] = 0;
                    }
                    guideCounts[guide.spec]++;
                });
                
                // Create options for each spec that has guides
                Object.keys(guideCounts).forEach(spec => {
                    options.push({
                        label: `${spec.charAt(0).toUpperCase() + spec.slice(1)} (${guideCounts[spec]} guide${guideCounts[spec] > 1 ? 's' : ''})`,
                        description: `View ${spec} guides`,
                        value: spec
                    });
                });
                
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`select_guides_${className}_${guideType}`)
                    .setPlaceholder('Select a spec to view guides')
                    .addOptions(options);
                
                const row = new ActionRowBuilder().addComponents(selectMenu);
                
                const embeds = createGuideSelectionEmbed(
                    `${className} ${guideType.toUpperCase()} Guides`,
                    'Select a spec below to view available guides.',
                    `Total: ${allGuides.length} guide(s)`,
                    className
                );
                
                await interaction.reply({
                    embeds: embeds,
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error loading guides:', error);
                await interaction.reply({
                    content: 'An error occurred while loading guides.',
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleSpecSelect(interaction) {
        const { customId } = interaction;
        
        if (customId.startsWith('select_guides_')) {
            const [, , className, guideType] = customId.split('_');
            const selectedSpec = interaction.values[0];
            
            try {
                const allGuides = await loadAllGuides(className, guideType);
                const specGuides = allGuides.filter(guide => guide.spec === selectedSpec);
                
                if (specGuides.length === 0) {
                    return await interaction.reply({
                        content: `No ${selectedSpec} guides found for ${className} ${guideType.toUpperCase()}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Create select menu for individual guides
                const options = specGuides.map(guide => ({
                    label: `${guide.submittedBy || guide.username || 'Unknown'}'s ${selectedSpec} Guide`,
                    description: guide.description ? guide.description.substring(0, 100) + '...' : 'No description',
                    value: `${guide.submittedById}`
                }));
                
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`view_guide_${className}_${guideType}_${selectedSpec}`)
                    .setPlaceholder('Select a guide to view')
                    .addOptions(options);
                
                const row = new ActionRowBuilder().addComponents(selectMenu);
                
                const embeds = createGuideSelectionEmbed(
                    `${className} ${guideType.toUpperCase()} - ${formatSpecForDisplay(className, selectedSpec) || 'Guides'}`,
                    'Select a guide below to view the full details.',
                    `${specGuides.length} ${selectedSpec} guide(s) available`,
                    className
                );
                
                await interaction.reply({
                    embeds: embeds,
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error loading spec guides:', error);
                await interaction.reply({
                    content: 'An error occurred while loading guides.',
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleGuideView(interaction) {
        const { customId } = interaction;
        
        if (customId.startsWith('view_guide_')) {
            const [, , className, guideType, spec] = customId.split('_');
            const selectedUserId = interaction.values[0];
            
            try {
                const allGuides = await loadAllGuides(className, guideType);
                const guide = allGuides.find(g => g.submittedById === selectedUserId && g.spec === spec);
                
                if (!guide) {
                    return await interaction.reply({
                        content: `Guide not found.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                console.log('Displaying guide:', {
                    className,
                    guideType,
                    spec,
                    submittedBy: guide.submittedBy,
                    username: guide.username,
                    hasVideo: !!guide.movementVideo,
                    videoUrl: guide.movementVideo,
                    hasCrystals: !!guide.crystalsImgur,
                    hasAddons: !!guide.addonsImgur
                });
                
                // Use embedBuilder to create guide embeds
                const embeds = createSavedGuideEmbed(guide);
                
                // Add quick edit buttons if this is the user's own guide
                const components = [];
                if (interaction.user.id === selectedUserId) {
                    const totalSteps = getTotalSteps(guideType);
                    const buttons = [];
                    
                    // Create a button for each step (max 5 buttons per row)
                    for (let step = 1; step <= totalSteps && step <= 5; step++) {
                        const stepName = getStepName(guideType, step);
                        buttons.push(
                            new ButtonBuilder()
                                .setCustomId(`quick_edit_step${step}_${className}_${guideType}_${spec}_${selectedUserId}`)
                                .setLabel(`Edit: ${stepName}`)
                                .setStyle(ButtonStyle.Secondary)
                                );
                    }
                    
                    if (buttons.length > 0) {
                        components.push(new ActionRowBuilder().addComponents(buttons));
                    }
                }
                
                await interaction.reply({
                    embeds: embeds,
                    components,
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error displaying guide:', error);
                await interaction.reply({
                    content: 'An error occurred while displaying the guide.',
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }
}

module.exports = GuideViewHandler;
