const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { loadAllGuidesForClassType } = require('../../utils/dataManager');
const { createConfirmDeleteEmbed, createDeleteSuccessEmbed, createGuideListEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { canModifyGuide } = require('../../utils/permissions');
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
                        content: `No guides found for user ${userName}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                if (userGuides.length === 1) {
                    // If only one guide, show delete confirmation directly
                    const guide = userGuides[0];
                    
                    const embed = createConfirmDeleteEmbed(guide, 'This action cannot be undone!');
                    
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
                        flags: MessageFlags.Ephemeral
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
                        label: 'Delete ALL guides by this user',
                        description: `Delete all ${userGuides.length} guides by ${userName}`,
                        value: 'DELETE_ALL'
                    });
                    
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`delete_guide_select_${className}_${guideType}_${userId}_${userName}`)
                        .setPlaceholder('Select which guide to delete')
                        .addOptions(guideOptions);
                    
                    const goBackButton = new ButtonBuilder()
                        .setCustomId(`back_to_user_select_${className}_${guideType}`)
                        .setLabel('Go Back')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const menuRow = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(goBackButton, cancelButton);
                    
                    const embed = createGuideListEmbed(
                        `Select Guide to Delete`,
                        `${userName} has ${userGuides.length} guides. Select which one to delete:`,
                        'Select a specific guide or delete all guides by this user'
                    );
                    
                    await interaction.update({
                        embeds: [embed],
                        components: [menuRow, buttonRow],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
            } catch (error) {
                console.error('Error in delete user selection:', error);
                await interaction.reply({
                    content: 'An error occurred while loading user guides.',
                    flags: MessageFlags.Ephemeral
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
                    // Get all user guides to display the specs
                    const allGuides = await loadAllGuidesForClassType(className, guideType);
                    const userGuides = allGuides.filter(guide => guide.submittedById === userId);
                    
                    // Get unique specs
                    const specs = [...new Set(userGuides.map(g => g.spec))];
                    const specsDisplay = specs
                        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(' | ');
                    
                    // Show confirmation for deleting all guides - create a temporary guide object for the embed
                    const tempGuide = {
                        submittedBy: userName,
                        className: className,
                        guideType: guideType,
                        spec: specsDisplay,
                        description: `This will delete ALL guides by this user`
                    };
                    
                    const embed = createConfirmDeleteEmbed(tempGuide, 'This will delete ALL guides by this user and cannot be undone!');
                    
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(`delete_all_user_guides_${className}_${guideType}_${userId}_${userName}`)
                        .setLabel('Delete ALL Guides')
                        .setStyle(ButtonStyle.Danger);
                    
                    const goBackButton = new ButtonBuilder()
                        .setCustomId(`back_to_guide_select_${className}_${guideType}_${userId}_${userName}`)
                        .setLabel('Go Back')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const row = new ActionRowBuilder().addComponents(confirmButton, goBackButton, cancelButton);
                    
                    await interaction.update({
                        embeds: [embed],
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    // Show confirmation for deleting specific guide
                    const spec = selectedValue;
                    
                    const allGuides = await loadAllGuidesForClassType(className, guideType);
                    const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                    
                    if (!guide) {
                        return await interaction.reply({
                            content: `Guide not found.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    const embed = createConfirmDeleteEmbed(guide, 'This action cannot be undone!');
                    
                    const confirmButton = new ButtonBuilder()
                        .setCustomId(`confirm_delete_guide_${className}_${guideType}_${spec}_${userId}`)
                        .setLabel('Delete Guide')
                        .setStyle(ButtonStyle.Danger);
                    
                    const goBackButton = new ButtonBuilder()
                        .setCustomId(`back_to_guide_select_${className}_${guideType}_${userId}_${userName}`)
                        .setLabel('Go Back')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_delete')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary);
                    
                    const row = new ActionRowBuilder().addComponents(confirmButton, goBackButton, cancelButton);
                    
                    await interaction.update({
                        embeds: [embed],
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
            } catch (error) {
                console.error('Error in delete guide selection:', error);
                await interaction.reply({
                    content: 'An error occurred while processing the deletion.',
                    flags: MessageFlags.Ephemeral
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
                // Load the guide to check permissions
                const guidesDir = path.join(__dirname, '../../guides', className.toLowerCase(), guideType, spec);
                const guideFile = path.join(guidesDir, `${userId}.json`);
                
                if (!fs.existsSync(guideFile)) {
                    return await interaction.update({
                        content: 'Guide file not found.',
                        embeds: [],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Load guide data to check permissions
                const guideData = JSON.parse(fs.readFileSync(guideFile, 'utf8'));
                
                // Check permissions
                const permissionCheck = await canModifyGuide(interaction.member, guideData);
                if (!permissionCheck.allowed) {
                    return await interaction.update({
                        content: permissionCheck.errorMessage,
                        embeds: [],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Delete the specific guide file
                if (fs.existsSync(guideFile)) {
                    fs.unlinkSync(guideFile);
                    
                    const embed = createDeleteSuccessEmbed(className, guideType, spec);
                    
                    await interaction.update({
                        embeds: [embed],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: 'Guide file not found.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                
            } catch (error) {
                console.error('Error deleting guide:', error);
                await interaction.reply({
                    content: 'An error occurred while deleting the guide.',
                    flags: MessageFlags.Ephemeral
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
                        content: `No guides found for user ${userName}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                let deletedCount = 0;
                let skippedCount = 0;
                const deletedSpecs = [];
                const skippedSpecs = [];
                
                for (const guide of userGuides) {
                    try {
                        // Check permissions for each guide
                        const permissionCheck = await canModifyGuide(interaction.member, guide);
                        if (!permissionCheck.allowed) {
                            skippedCount++;
                            if (!skippedSpecs.includes(guide.spec)) {
                                skippedSpecs.push(guide.spec);
                            }
                            continue;
                        }
                        
                        const guidesDir = path.join(__dirname, '../../guides', className.toLowerCase(), guideType, guide.spec);
                        const guideFile = path.join(guidesDir, `${userId}.json`);
                        
                        if (fs.existsSync(guideFile)) {
                            fs.unlinkSync(guideFile);
                            deletedCount++;
                            if (!deletedSpecs.includes(guide.spec)) {
                                deletedSpecs.push(guide.spec);
                            }
                        }
                    } catch (error) {
                        console.error(`Error deleting guide file for ${guide.spec}:`, error);
                    }
                }
                
                // Build response message
                let responseMessage = '';
                
                if (deletedCount > 0) {
                    const specsDisplay = deletedSpecs
                        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(' | ');
                    responseMessage = `Deleted ${deletedCount} guide(s) by ${userName}\n**Specs:** ${specsDisplay}`;
                }
                
                if (skippedCount > 0) {
                    const skippedDisplay = skippedSpecs
                        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                        .join(' | ');
                    if (responseMessage) responseMessage += '\n\n';
                    responseMessage += `Skipped ${skippedCount} guide(s) from other servers\n**Specs:** ${skippedDisplay}`;
                }
                
                if (deletedCount === 0) {
                    responseMessage = `**Permission Denied**\n\nAll of ${userName}'s guides were created in other servers.\n\nYou can only delete guides that were created in this server.`;
                }
                
                const embed = deletedCount > 0 
                    ? createDeleteSuccessEmbed(className, guideType, null, responseMessage)
                    : createErrorEmbed('Permission Denied', responseMessage);
                
                await interaction.update({
                    embeds: [embed],
                    components: [],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error deleting all user guides:', error);
                await interaction.reply({
                    content: 'An error occurred while deleting the guides.',
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }

    static async showSingleGuideDelete(interaction, className, guideType, guide, userId) {
        try {
            const embed = createConfirmDeleteEmbed(guide, 'This action cannot be undone!');
            
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
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error showing single guide delete:', error);
                await interaction.reply({
                content: 'An error occurred while preparing the guide for deletion.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    static async handleGoBackToGuideSelect(interaction) {
        if (interaction.customId.startsWith('back_to_guide_select_')) {
            const [, , , , className, guideType, userId, userName] = interaction.customId.split('_');
            
            try {
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const userGuides = allGuides.filter(guide => guide.submittedById === userId);
                
                if (userGuides.length === 0) {
                    return await interaction.update({
                        content: `No guides found for user ${userName}.`,
                        embeds: [],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Recreate the guide selection menu
                const guideOptions = userGuides.map(guide => ({
                    label: `${guide.spec.charAt(0).toUpperCase() + guide.spec.slice(1)} Guide`,
                    description: guide.description ? guide.description.substring(0, 100) + '...' : 'No description',
                    value: `${guide.spec}`
                }));
                
                // Add option to delete all guides
                guideOptions.push({
                    label: 'Delete ALL guides by this user',
                    description: `Delete all ${userGuides.length} guides by ${userName}`,
                    value: 'DELETE_ALL'
                });
                
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`delete_guide_select_${className}_${guideType}_${userId}_${userName}`)
                    .setPlaceholder('Select which guide to delete')
                    .addOptions(guideOptions);
                
                const row = new ActionRowBuilder().addComponents(selectMenu);
                
                const embed = createGuideListEmbed(
                    `Select Guide to Delete`,
                    `${userName} has ${userGuides.length} guides. Select which one to delete:`,
                    'Select a specific guide or delete all guides by this user'
                );
                
                await interaction.update({
                    embeds: [embed],
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error going back to guide selection:', error);
                await interaction.update({
                    content: 'An error occurred while loading guides.',
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }

    static async handleGoBackToUserSelect(interaction) {
        if (interaction.customId.startsWith('back_to_user_select_')) {
            const [, , , , className, guideType] = interaction.customId.split('_');
            
            try {
                const guides = await loadAllGuidesForClassType(className, guideType);
                
                if (!guides || guides.length === 0) {
                    return await interaction.update({
                        content: `No ${guideType.toUpperCase()} guides found for ${className}.`,
                        embeds: [],
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                }
                
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

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle(`Delete ${className.charAt(0).toUpperCase() + className.slice(1)} ${guideType.toUpperCase()} Guides`)
                    .setDescription(`Found ${guides.length} guide(s) from ${options.length} user(s).\n\nSelect a user to view their guides for deletion.`)
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error going back to user selection:', error);
                await interaction.update({
                    content: 'An error occurred while loading guides.',
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral
                });
            }
            return true;
        }
        return false;
    }
}
module.exports = GuideDeleteHandler;
