const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { saveGuideData } = require('../../utils/dataManager');
const config = require('../../config.js');

class GuideCreateHandler {
    static async handleContinueStep2(interaction) {
        if (interaction.customId.startsWith('continue_step2_')) {
            const [, , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                // Create Step 2 modal
                const modal = new ModalBuilder()
                    .setCustomId(`submit_guide_step2_${className}_${guideType}_${spec}`)
                    .setTitle(`${className} ${guideType.toUpperCase()} Guide - Step 2/2`);
                
                const addonsInput = new TextInputBuilder()
                    .setCustomId('addons')
                    .setLabel('Addons (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const movementInput = new TextInputBuilder()
                    .setCustomId('movement')
                    .setLabel('Movement/Mobility')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const combosInput = new TextInputBuilder()
                    .setCustomId('combos')
                    .setLabel('Combos (one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const ytLinksInput = new TextInputBuilder()
                    .setCustomId('ytLinks')
                    .setLabel('YouTube Links (optional, one per line)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(false);
                
                const row1 = new ActionRowBuilder().addComponents(addonsInput);
                const row2 = new ActionRowBuilder().addComponents(movementInput);
                const row3 = new ActionRowBuilder().addComponents(combosInput);
                const row4 = new ActionRowBuilder().addComponents(ytLinksInput);
                
                modal.addComponents(row1, row2, row3, row4);
                
                await interaction.showModal(modal);
                
            } catch (error) {
                console.error('Error showing step 2 modal:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your submission.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleStep1Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step1_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                // Get step 1 data
                const description = interaction.fields.getTextInputValue('description');
                const pros = interaction.fields.getTextInputValue('pros');
                const cons = interaction.fields.getTextInputValue('cons');
                const crystalsImage = interaction.fields.getTextInputValue('crystalsImage');
                
                // Store step 1 data temporarily
                global.tempGuideData = global.tempGuideData || {};
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                global.tempGuideData[tempKey] = {
                    description,
                    pros: pros.split('\n').filter(item => item.trim() !== ''),
                    cons: cons.split('\n').filter(item => item.trim() !== ''),
                    crystalsImage,
                    className,
                    guideType,
                    spec
                };
                
                // Show preview and continue button
                const embed = new EmbedBuilder()
                    .setTitle(`${className} ${guideType.toUpperCase()} Guide - Step 1 Complete`)
                    .setDescription('✅ Step 1 data saved! Click "Continue to Step 2" to complete your guide.')
                    .addFields(
                        { name: 'Description', value: description.substring(0, 1024), inline: false },
                        { name: 'Pros', value: pros.substring(0, 1024) || 'None', inline: true },
                        { name: 'Cons', value: cons.substring(0, 1024) || 'None', inline: true }
                    )
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary);
                
                const continueButton = new ButtonBuilder()
                    .setCustomId(`continue_step2_${className}_${guideType}_${spec}`)
                    .setLabel('Continue to Step 2')
                    .setStyle(ButtonStyle.Primary);
                
                const row = new ActionRowBuilder().addComponents(continueButton);
                
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error in step 1 submission:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your submission.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleStep2Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step2_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                // Get step 2 data
                const addons = interaction.fields.getTextInputValue('addons');
                const movement = interaction.fields.getTextInputValue('movement');
                const combos = interaction.fields.getTextInputValue('combos');
                const ytLinksValue = interaction.fields.getTextInputValue('ytLinks');
                
                // Get step 1 data from temp storage
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                const tempData = global.tempGuideData[tempKey];
                
                if (!tempData) {
                    return await interaction.reply({
                        content: '❌ Session expired. Please start over with /create-guide.',
                        ephemeral: true
                    });
                }
                
                // Combine all data
                const guideData = {
                    description: tempData.description,
                    pros: tempData.pros,
                    cons: tempData.cons,
                    crystals: tempData.crystalsImage.split('\n').filter(item => item.trim() !== ''),
                    addons: addons.split('\n').filter(item => item.trim() !== ''),
                    movement: movement,
                    combos: combos.split('\n').filter(item => item.trim() !== ''),
                    ytLinks: ytLinksValue ? ytLinksValue.split('\n').filter(item => item.trim() !== '') : [],
                    submittedById: interaction.user.id,
                    username: interaction.user.displayName || interaction.user.username,
                    submittedAt: new Date().toISOString()
                };
                
                // Save the guide
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
                        .setTitle('✅ Guide Submitted Successfully!')
                        .setDescription(`Your ${className} ${guideType.toUpperCase()} guide has been saved.`)
                        .setColor(config.colors.success)
                        .addFields(
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true },
                            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true }
                        )
                        .setFooter({ text: 'Use /guide to view your submitted guide!' })
                        .setTimestamp();
                    
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                    
                    // Clean up temp data
                    delete global.tempGuideData[tempKey];
                } else {
                    await interaction.reply({
                        content: '❌ Failed to save guide. Please try again.',
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error saving guide:', error);
                await interaction.reply({
                    content: '❌ An error occurred while saving your guide.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
    
    static async handleLegacySubmission(interaction) {
        if (interaction.customId.startsWith('submit_guide_')) {
            const [, , className, guideType, spec] = interaction.customId.split('_');
            
            // Note: Permission checks can be added here if needed
            
            try {
                // Get form data
                const description = interaction.fields.getTextInputValue('description');
                const pros = interaction.fields.getTextInputValue('pros');
                const cons = interaction.fields.getTextInputValue('cons');
                const crystalsImage = interaction.fields.getTextInputValue('crystalsImage');
                const addons = interaction.fields.getTextInputValue('addons');
                
                // Process the data
                const guideData = {
                    description,
                    pros: pros.split('\n').filter(item => item.trim() !== ''),
                    cons: cons.split('\n').filter(item => item.trim() !== ''),
                    crystals: crystalsImage.split('\n').filter(item => item.trim() !== ''),
                    addons: addons.split('\n').filter(item => item.trim() !== ''),
                    submittedById: interaction.user.id,
                    username: interaction.user.displayName || interaction.user.username,
                    submittedAt: new Date().toISOString()
                };
                
                // Save the guide
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
                        .setTitle('✅ Guide Submitted Successfully!')
                        .setDescription(`Your ${className} ${guideType.toUpperCase()} guide has been saved.`)
                        .setColor(config.colors.success)
                        .addFields(
                            { name: 'Class', value: className, inline: true },
                            { name: 'Type', value: guideType.toUpperCase(), inline: true },
                            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true }
                        )
                        .setFooter({ text: 'Use /guide to view your submitted guide!' })
                        .setTimestamp();
                    
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to save guide. Please try again.',
                        ephemeral: true
                    });
                }
                
            } catch (error) {
                console.error('Error saving guide:', error);
                await interaction.reply({
                    content: '❌ An error occurred while saving your guide.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
}

module.exports = GuideCreateHandler;
