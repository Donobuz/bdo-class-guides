const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadAllGuidesForClassType } = require('../../utils/dataManager');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');

class GuideDeleteHandler {
    static async handleDeleteUserSelect(interaction) {
        if (interaction.customId.startsWith('delete_user_select_')) {
            const [, , , className, guideType] = interaction.customId.split('_');
            const selectedUserKey = interaction.values[0];
            const [userId, userName] = selectedUserKey.split('_');
            
            try {
                // Load guides for this specific user
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const userGuides = allGuides.filter(guide => guide.submittedById === userId);
                
                if (userGuides.length === 0) {
                    return await interaction.reply({
                        content: `❌ No guides found for user ${userName}.`,
                        ephemeral: true
                    });
                }
                
                if (userGuides.length === 1) {
                    // If only one guide, show delete confirmation directly
                    const guide = userGuides[0];
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🗑️ Confirm Guide Deletion`)
                        .setDescription(`Are you sure you want to delete this guide?`)
                        .addFields(
                            { name: 'User', value: guide.username, inline: true },
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true },
                            { name: 'Spec', value: guide.spec.charAt(0).toUpperCase() + guide.spec.slice(1), inline: true },
                            { name: 'Description', value: guide.description.substring(0, 200) + '...', inline: false }
                        )
                        .setColor(config.colors.error)
                        .setFooter({ text: 'This action cannot be undone!' });
                    
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(`confirm_delete_guide_${className}_${guideType}_${guide.spec}_${userId}`)
                        .setLabel('Delete Guide')
                        .setStyle(ButtonStyle.Danger);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
                    
                    await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                } else {
                    // Multiple guides, show selection menu
                    const guideOptions = userGuides.map(guide => ({
                        label: `${guide.spec.charAt(0).toUpperCase() + guide.spec.slice(1)} Guide`,
                        description: guide.description ? guide.description.substring(0, 100) + '...' : 'No description',
                        value: `${guide.spec}`
                    }));
                    
                    // Add option to delete all guides
                    guideOptions.push({
                        label: '🗑️ Delete ALL guides by this user',
                        description: `Delete all ${userGuides.length} guides by ${userName}`,
                        value: 'DELETE_ALL'
                    });
                    
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`delete_guide_select_${className}_${guideType}_${userId}_${userName}`)
                        .setPlaceholder('Select which guide to delete')
                        .addOptions(guideOptions);
                    
                    const row = new ActionRowBuilder().addComponents(selectMenu);
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🗑️ Select Guide to Delete`)
                        .setDescription(`${userName} has ${userGuides.length} guides. Select which one to delete:`)
                        .setColor(config.colors.warning)
                        .setFooter({ text: 'Select a specific guide or delete all guides by this user' });
                    
                    await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error in delete user selection:', error);
                await interaction.reply({
                    content: '❌ An error occurred while loading user guides.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleDeleteGuideSelect(interaction) {
        if (interaction.customId.startsWith('delete_guide_select_')) {
            const [, , , className, guideType, userId, userName] = interaction.customId.split('_');
            const selectedValue = interaction.values[0];
            
            try {
                if (selectedValue === 'DELETE_ALL') {
                    // Show confirmation for deleting all guides
                    const embed = new EmbedBuilder()
                        .setTitle(`⚠️ Confirm Delete ALL Guides`)
                        .setDescription(`Are you sure you want to delete ALL guides by ${userName}?`)
                        .addFields(
                            { name: 'User', value: userName, inline: true },
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true }
                        )
                        .setColor(config.colors.error)
                        .setFooter({ text: 'This will delete ALL guides by this user and cannot be undone!' });
                    
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(`delete_all_user_guides_${className}_${guideType}_${userId}_${userName}`)
                        .setLabel('Delete ALL Guides')
                        .setStyle(ButtonStyle.Danger);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
                    
                    await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                } else {
                    // Show confirmation for deleting specific guide
                    const spec = selectedValue;
                    
                    const allGuides = await loadAllGuidesForClassType(className, guideType);
                    const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                    
                    if (!guide) {
                        return await interaction.reply({
                            content: `❌ Guide not found.`,
                            ephemeral: true
                        });
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🗑️ Confirm Guide Deletion`)
                        .setDescription(`Are you sure you want to delete this guide?`)
                        .addFields(
                            { name: 'User', value: guide.username, inline: true },
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true },
                            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true },
                            { name: 'Description', value: guide.description.substring(0, 200) + '...', inline: false }
                        )
                        .setColor(config.colors.error)
                        .setFooter({ text: 'This action cannot be undone!' });
                    
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(`confirm_delete_guide_${className}_${guideType}_${spec}_${userId}`)
                        .setLabel('Delete Guide')
                        .setStyle(ButtonStyle.Danger);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
                    
                    await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error in delete guide selection:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing the deletion.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleConfirmDelete(interaction) {
        if (interaction.customId.startsWith('confirm_delete_guide_')) {
            const [, , , className, guideType, spec, userId] = interaction.customId.split('_');
            
            try {
                // Delete the specific guide file
                const guidesDir = path.join(__dirname, '../../guides', className.toLowerCase(), guideType, spec);
                const guideFile = path.join(guidesDir, `${userId}.json`);
                
                if (fs.existsSync(guideFile)) {
                    fs.unlinkSync(guideFile);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Guide Deleted Successfully')
                        .setDescription(`The ${className} ${guideType.toUpperCase()} ${spec} guide has been deleted.`)
                        .setColor(config.colors.success)
                        .setTimestamp();
                    
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Guide file not found.',
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error deleting guide:', error);
                await interaction.reply({
                    content: '❌ An error occurred while deleting the guide.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleDeleteAllUserGuides(interaction) {
        if (interaction.customId.startsWith('delete_all_user_guides_')) {
            const [, , , , className, guideType, userId, userName] = interaction.customId.split('_');
            
            try {
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const userGuides = allGuides.filter(guide => guide.submittedById === userId);
                
                if (userGuides.length === 0) {
                    return await interaction.reply({
                        content: `❌ No guides found for user ${userName}.`,
                        ephemeral: true
                    });
                }
                
                let deletedCount = 0;
                
                for (const guide of userGuides) {
                    try {
                        const guidesDir = path.join(__dirname, '../../guides', className.toLowerCase(), guideType, guide.spec);
                        const guideFile = path.join(guidesDir, `${userId}.json`);
                        
                        if (fs.existsSync(guideFile)) {
                            fs.unlinkSync(guideFile);
                            deletedCount++;
                        }
                    } catch (error) {
                        console.error(`Error deleting guide file for ${guide.spec}:`, error);
                    }
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ Guides Deleted Successfully')
                    .setDescription(`Deleted ${deletedCount} guide(s) by ${userName} for ${className} ${guideType.toUpperCase()}.`)
                    .setColor(config.colors.success)
                    .setTimestamp();
                
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error deleting all user guides:', error);
                await interaction.reply({
                    content: '❌ An error occurred while deleting the guides.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    static async showSingleGuideDelete(interaction, className, guideType, guide, userId) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(`🗑️ Confirm Guide Deletion`)
                .setDescription(`Are you sure you want to delete your guide?`)
                .addFields(
                    { name: 'Class', value: className, inline: true },
                    { name: 'Type', value: guideType.toUpperCase(), inline: true },
                    { name: 'Spec', value: guide.spec.charAt(0).toUpperCase() + guide.spec.slice(1), inline: true },
                    { name: 'Description', value: guide.description ? guide.description.substring(0, 200) + '...' : 'No description', inline: false }
                )
                .setColor(config.colors.error)
                .setFooter({ text: 'This action cannot be undone!' });
            
            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirm_delete_guide_${className}_${guideType}_${guide.spec}_${userId}`)
                .setLabel('Delete My Guide')
                .setStyle(ButtonStyle.Danger);
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            
            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error showing single guide delete:', error);
                await interaction.reply({
                content: '❌ An error occurred while preparing the guide for deletion.',
                ephemeral: true
            });
        }
    }
}module.exports = GuideDeleteHandler;
