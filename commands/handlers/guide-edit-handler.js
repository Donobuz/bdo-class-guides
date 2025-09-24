const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { loadAllGuidesForClassType, saveGuideData } = require('../../utils/dataManager');
const { createGuideTitle } = require('../../utils/classUtils');
const config = require('../../config.js');

class GuideEditHandler {
    static async handleEditUserSelect(interaction) {
        if (interaction.customId.startsWith('edit_user_select_')) {
            const [, , , className, guideType] = interaction.customId.split('_');
            const selectedValue = interaction.values[0];
            const [userId, spec] = selectedValue.split('_');
            
            try {
                // Load the specific guide data
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                
                if (!guide) {
                    return await interaction.reply({
                        content: `❌ Guide not found.`,
                        ephemeral: true
                    });
                }
                
                // Create first modal with existing data
                const modal = new ModalBuilder()
                    .setCustomId(`edit_guide_modal1_${className}_${guideType}_${spec}_${userId}`)
                    .setTitle(`Edit ${createGuideTitle(className, guideType, spec)} - Step 1/2`);
                
                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide.description || '')
                    .setRequired(true);
                
                const prosInput = new TextInputBuilder()
                    .setCustomId('pros')
                    .setLabel('Pros')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide.pros?.join('\n') || '')
                    .setRequired(true);
                
                const consInput = new TextInputBuilder()
                    .setCustomId('cons')
                    .setLabel('Cons')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide.cons?.join('\n') || '')
                    .setRequired(true);
                
                const crystalsInput = new TextInputBuilder()
                    .setCustomId('crystals')
                    .setLabel('Crystals')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide.crystals?.join('\n') || '')
                    .setRequired(true);
                
                const row1 = new ActionRowBuilder().addComponents(descriptionInput);
                const row2 = new ActionRowBuilder().addComponents(prosInput);
                const row3 = new ActionRowBuilder().addComponents(consInput);
                const row4 = new ActionRowBuilder().addComponents(crystalsInput);
                
                modal.addComponents(row1, row2, row3, row4);
                
                await interaction.showModal(modal);
                
            } catch (error) {
                console.error('Error in edit user selection:', error);
                await interaction.reply({
                    content: '❌ An error occurred while loading the guide for editing.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleEditModal1(interaction) {
        if (interaction.customId.startsWith('edit_guide_modal1_')) {
            const [, , , className, guideType, spec, userId] = interaction.customId.split('_');
            
            try {
                // Get step 1 data
                const description = interaction.fields.getTextInputValue('description');
                const pros = interaction.fields.getTextInputValue('pros');
                const cons = interaction.fields.getTextInputValue('cons');
                const crystals = interaction.fields.getTextInputValue('crystals');
                
                // Load existing data for step 2
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                
                // Store step 1 data temporarily
                global.tempEditData = global.tempEditData || {};
                const tempKey = `${userId}_${className}_${guideType}_${spec}`;
                global.tempEditData[tempKey] = {
                    description,
                    pros: pros.split('\n').filter(item => item.trim() !== ''),
                    cons: cons.split('\n').filter(item => item.trim() !== ''),
                    crystals: crystals.split('\n').filter(item => item.trim() !== ''),
                    className,
                    guideType,
                    spec,
                    userId,
                    originalGuide: guide
                };
                
                // Create Step 2 modal with existing data
                const modal2 = new ModalBuilder()
                    .setCustomId(`edit_guide_modal2_${className}_${guideType}_${spec}_${userId}`)
                    .setTitle(`Edit ${createGuideTitle(className, guideType, spec)} - Step 2/2`);
                
                const addonsInput = new TextInputBuilder()
                    .setCustomId('addons')
                    .setLabel('Addons (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide?.addons?.join('\n') || '')
                    .setRequired(true);
                
                const movementInput = new TextInputBuilder()
                    .setCustomId('movement')
                    .setLabel('Movement/Mobility')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide?.movement || '')
                    .setRequired(true);
                
                const combosInput = new TextInputBuilder()
                    .setCustomId('combos')
                    .setLabel('Combos (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide?.combos?.join('\n') || '')
                    .setRequired(true);
                
                const ytLinksInput = new TextInputBuilder()
                    .setCustomId('ytLinks')
                    .setLabel('YouTube Links (optional, one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setValue(guide?.ytLinks?.join('\n') || '')
                    .setRequired(false);
                
                const row1 = new ActionRowBuilder().addComponents(addonsInput);
                const row2 = new ActionRowBuilder().addComponents(movementInput);
                const row3 = new ActionRowBuilder().addComponents(combosInput);
                const row4 = new ActionRowBuilder().addComponents(ytLinksInput);
                
                modal2.addComponents(row1, row2, row3, row4);
                
                await interaction.showModal(modal2);
                
            } catch (error) {
                console.error('Error in edit step 1:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your edit.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleEditModal2(interaction) {
        if (interaction.customId.startsWith('edit_guide_modal2_')) {
            const [, , , className, guideType, spec, userId] = interaction.customId.split('_');
            
            try {
                // Get step 2 data
                const addons = interaction.fields.getTextInputValue('addons');
                const movement = interaction.fields.getTextInputValue('movement');
                const combos = interaction.fields.getTextInputValue('combos');
                const ytLinksValue = interaction.fields.getTextInputValue('ytLinks');
                
                // Get step 1 data from temp storage
                const tempKey = `${userId}_${className}_${guideType}_${spec}`;
                const tempData = global.tempEditData[tempKey];
                
                if (!tempData) {
                    return await interaction.reply({
                        content: '❌ Session expired. Please try again.',
                        ephemeral: true
                    });
                }
                
                // Combine all data
                const guideData = {
                    description: tempData.description,
                    pros: tempData.pros,
                    cons: tempData.cons,
                    crystals: tempData.crystals,
                    addons: addons.split('\n').filter(item => item.trim() !== ''),
                    movement: movement,
                    combos: combos.split('\n').filter(item => item.trim() !== ''),
                    ytLinks: ytLinksValue ? ytLinksValue.split('\n').filter(item => item.trim() !== '') : [],
                    submittedById: userId,
                    username: tempData.originalGuide.username,
                    submittedAt: tempData.originalGuide.submittedAt, // Keep original submission time
                    editedAt: new Date().toISOString()
                };
                
                // Save the updated guide
                const completeGuideData = {
                    ...guideData,
                    className: className.toLowerCase(),
                    guideType,
                    spec
                };
                await saveGuideData(completeGuideData);
                const success = true;
                
                if (success) {
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Guide Updated Successfully!')
                        .setDescription(`Your ${className} ${guideType.toUpperCase()} guide has been updated.`)
                        .setColor(config.colors.success)
                        .addFields(
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true },
                            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true }
                        )
                        .setFooter({ text: 'Use /guide to view your updated guide!' })
                        .setTimestamp();
                    
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                    
                    // Clean up temp data
                    delete global.tempEditData[tempKey];
                } else {
                    await interaction.reply({
                        content: '❌ Failed to update guide. Please try again.',
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error updating guide:', error);
                await interaction.reply({
                    content: '❌ An error occurred while updating your guide.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    static async startEditing(interaction, className, guideType, spec, userId) {
        try {
            // Load the specific guide data
            const allGuides = await loadAllGuidesForClassType(className, guideType);
            const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
            
            if (!guide) {
                return await interaction.reply({
                    content: `❌ Guide not found.`,
                    ephemeral: true
                });
            }
            
            // Create first modal with existing data
            const modal = new ModalBuilder()
                .setCustomId(`edit_guide_modal1_${className}_${guideType}_${spec}_${userId}`)
                .setTitle(`Edit ${className} ${guideType.toUpperCase()} Guide - Step 1/2`);
            
            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setValue(guide.description || '')
                .setRequired(true);
            
            const prosInput = new TextInputBuilder()
                .setCustomId('pros')
                .setLabel('Pros')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setValue(guide.pros?.join('\n') || '')
                .setRequired(true);
            
            const consInput = new TextInputBuilder()
                .setCustomId('cons')
                .setLabel('Cons')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setValue(guide.cons?.join('\n') || '')
                .setRequired(true);
            
            const crystalsInput = new TextInputBuilder()
                .setCustomId('crystals')
                .setLabel('Crystals (imgur links, one per line)')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1000)
                .setValue(guide.crystals?.join('\n') || '')
                .setRequired(false);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(prosInput),
                new ActionRowBuilder().addComponents(consInput),
                new ActionRowBuilder().addComponents(crystalsInput)
            );
            
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error starting guide edit:', error);
            await interaction.reply({
                content: 'An error occurred while starting the guide edit.',
                ephemeral: true
            });
        }
    }
}

module.exports = GuideEditHandler;
