const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadAllGuides } = require('../../utils/dataManager');
const config = require('../../config.js');

class GuideViewHandler {
    static async handleGuideSelect(interaction) {
        const { customId } = interaction;
        
        if (customId.startsWith('guide_')) {
            const [, className, guideType] = customId.split('_');
            
            try {
                const allGuides = await loadAllGuides(className, guideType);
                
                if (!allGuides || allGuides.length === 0) {
                    return await interaction.reply({
                        content: `❌ No guides found for ${className} ${guideType.toUpperCase()}.`,
                        ephemeral: true
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
                
                const embed = new EmbedBuilder()
                    .setTitle(`📚 ${className} ${guideType.toUpperCase()} Guides`)
                    .setDescription(`Select a spec below to view available guides.`)
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                    .setFooter({ text: `Total: ${allGuides.length} guide(s)` });
                
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error loading guides:', error);
                await interaction.reply({
                    content: '❌ An error occurred while loading guides.',
                    ephemeral: true
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
                        content: `❌ No ${selectedSpec} guides found for ${className} ${guideType.toUpperCase()}.`,
                        ephemeral: true
                    });
                }
                
                // Create select menu for individual guides
                const options = specGuides.map(guide => ({
                    label: `${guide.username}'s ${selectedSpec} Guide`,
                    description: guide.description ? guide.description.substring(0, 100) + '...' : 'No description',
                    value: `${guide.submittedById}`
                }));
                
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`view_guide_${className}_${guideType}_${selectedSpec}`)
                    .setPlaceholder('Select a guide to view')
                    .addOptions(options);
                
                const row = new ActionRowBuilder().addComponents(selectMenu);
                
                const embed = new EmbedBuilder()
                    .setTitle(`📖 ${className} ${guideType.toUpperCase()} - ${selectedSpec.charAt(0).toUpperCase() + selectedSpec.slice(1)}`)
                    .setDescription(`Select a guide below to view the full details.`)
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                    .setFooter({ text: `${specGuides.length} ${selectedSpec} guide(s) available` });
                
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error loading spec guides:', error);
                await interaction.reply({
                    content: '❌ An error occurred while loading guides.',
                    ephemeral: true
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
                        content: `❌ Guide not found.`,
                        ephemeral: true
                    });
                }
                
                // Create the main guide embed
                const embed = new EmbedBuilder()
                    .setTitle(`${className} ${guideType.toUpperCase()} - ${spec.charAt(0).toUpperCase() + spec.slice(1)}`)
                    .setDescription(guide.description)
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                    .addFields(
                        { name: '✅ Pros', value: guide.pros.length > 0 ? guide.pros.map(pro => `• ${pro}`).join('\n') : 'None listed', inline: true },
                        { name: '❌ Cons', value: guide.cons.length > 0 ? guide.cons.map(con => `• ${con}`).join('\n') : 'None listed', inline: true },
                        { name: '\u200B', value: '\u200B', inline: false },
                        { name: '💎 Crystals', value: guide.crystals.length > 0 ? guide.crystals.map(crystal => `• ${crystal}`).join('\n') : 'None listed', inline: true },
                        { name: '🔧 Addons', value: guide.addons.length > 0 ? guide.addons.map(addon => `• ${addon}`).join('\n') : 'None listed', inline: true },
                        { name: '\u200B', value: '\u200B', inline: false },
                        { name: '🏃 Movement/Mobility', value: guide.movement || 'Not specified', inline: false }
                    )
                    .setFooter({ text: `Submitted by ${guide.username} | ${new Date(guide.submittedAt).toLocaleDateString()}` })
                    .setTimestamp();
                
                // Add combos if they exist
                if (guide.combos && guide.combos.length > 0) {
                    embed.addFields({ name: '⚔️ Combos', value: guide.combos.map(combo => `• ${combo}`).join('\n'), inline: false });
                }
                
                // Add YouTube links if they exist
                if (guide.ytLinks && guide.ytLinks.length > 0) {
                    const ytLinksText = guide.ytLinks.map(link => `• ${link}`).join('\n');
                    embed.addFields({ name: '📺 YouTube Links', value: ytLinksText, inline: false });
                }
                
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error displaying guide:', error);
                await interaction.reply({
                    content: '❌ An error occurred while displaying the guide.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
}

module.exports = GuideViewHandler;
