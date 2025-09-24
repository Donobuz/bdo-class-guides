const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { saveGuideData } = require('../../utils/dataManager');
const { createGuideTitle } = require('../../utils/classUtils');
const config = require('../../config.js');

class GuideCreateHandler {
    // Continue to Step 2 - Different flows for PvP vs PvE
    static async handleContinueStep2(interaction) {
        if (interaction.customId.startsWith('continue_step2_')) {
            const [, , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                let modal;
                
                if (guideType === 'pvp') {
                    // PvP Step 2: Addons & Crystals
                    modal = new ModalBuilder()
                        .setCustomId(`submit_guide_step2_${className}_${guideType}_${spec}`)
                        .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 2/4`);
                    
                    const addonsImgurInput = new TextInputBuilder()
                        .setCustomId('addonsImgur')
                        .setLabel('Addons Imgur Link (required)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('https://i.imgur.com/example.png')
                        .setMaxLength(500)
                        .setRequired(true);
                    
                    const addonReasoningInput = new TextInputBuilder()
                        .setCustomId('addonReasoning')
                        .setLabel('Addon Reasoning (optional)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Explain why you chose these addons...')
                        .setMaxLength(1000)
                        .setRequired(false);
                    
                    const crystalsImgurInput = new TextInputBuilder()
                        .setCustomId('crystalsImgur')
                        .setLabel('Crystals Imgur Link (required)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('https://i.imgur.com/example.png')
                        .setMaxLength(500)
                        .setRequired(true);
                    
                    const crystalInfoInput = new TextInputBuilder()
                        .setCustomId('crystalInfo')
                        .setLabel('Crystal Extra Information (optional)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Additional crystal information...')
                        .setMaxLength(1000)
                        .setRequired(false);
                    
                    const row1 = new ActionRowBuilder().addComponents(addonsImgurInput);
                    const row2 = new ActionRowBuilder().addComponents(addonReasoningInput);
                    const row3 = new ActionRowBuilder().addComponents(crystalsImgurInput);
                    const row4 = new ActionRowBuilder().addComponents(crystalInfoInput);
                    
                    modal.addComponents(row1, row2, row3, row4);
                    
                } else {
                    // PvE Step 2: Original format (final step)
                    modal = new ModalBuilder()
                        .setCustomId(`submit_guide_step2_${className}_${guideType}_${spec}`)
                        .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 2/2`);
                    
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
                }
                
                await interaction.showModal(modal);
                
            } catch (error) {
                console.error('Error creating step 2 modal:', error);
                await interaction.reply({
                    content: 'An error occurred while creating the form.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Continue to Step 3 (PvP only) - Artifacts & Lightstones
    static async handleContinueStep3(interaction) {
        if (interaction.customId.startsWith('continue_step3_')) {
            const [, , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                const modal = new ModalBuilder()
                    .setCustomId(`submit_guide_step3_${className}_${guideType}_${spec}`)
                    .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 3/4`);
                
                const artifactsImgurInput = new TextInputBuilder()
                    .setCustomId('artifactsImgur')
                    .setLabel('Artifacts Imgur Link (required)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://i.imgur.com/example.png')
                    .setMaxLength(500)
                    .setRequired(true);
                
                const lightstoneImgurInput = new TextInputBuilder()
                    .setCustomId('lightstoneImgur')
                    .setLabel('Lightstone Set Imgur Link (required)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('https://i.imgur.com/example.png')
                    .setMaxLength(500)
                    .setRequired(true);
                
                const reasoningInput = new TextInputBuilder()
                    .setCustomId('reasoning')
                    .setLabel('Reasoning (required)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Explain your artifact and lightstone choices...')
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const row1 = new ActionRowBuilder().addComponents(artifactsImgurInput);
                const row2 = new ActionRowBuilder().addComponents(lightstoneImgurInput);
                const row3 = new ActionRowBuilder().addComponents(reasoningInput);
                
                modal.addComponents(row1, row2, row3);
                
                await interaction.showModal(modal);
                
            } catch (error) {
                console.error('Error creating step 3 modal:', error);
                await interaction.reply({
                    content: '❌ An error occurred while creating the form.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Continue to Step 4 (PvP only) - Movement & Combat
    static async handleContinueStep4(interaction) {
        if (interaction.customId.startsWith('continue_step4_')) {
            const [, , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                const modal = new ModalBuilder()
                    .setCustomId(`submit_guide_step4_${className}_${guideType}_${spec}`)
                    .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 4/4`);
                
                const movementExampleInput = new TextInputBuilder()
                    .setCustomId('movementExample')
                    .setLabel('Movement Example (required)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Describe movement patterns, rotations, positioning...')
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const movementVideoInput = new TextInputBuilder()
                    .setCustomId('movementVideo')
                    .setLabel('Movement Video (optional)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('YouTube link or GIF link')
                    .setMaxLength(500)
                    .setRequired(false);
                
                const pvpComboInput = new TextInputBuilder()
                    .setCustomId('pvpCombo')
                    .setLabel('PvP Combo Example (required)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Describe your main PvP combos...')
                    .setMaxLength(1000)
                    .setRequired(true);
                
                const combatVideoInput = new TextInputBuilder()
                    .setCustomId('combatVideo')
                    .setLabel('Combat Video (optional)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('YouTube link or GIF link')
                    .setMaxLength(500)
                    .setRequired(false);
                
                const row1 = new ActionRowBuilder().addComponents(movementExampleInput);
                const row2 = new ActionRowBuilder().addComponents(movementVideoInput);
                const row3 = new ActionRowBuilder().addComponents(pvpComboInput);
                const row4 = new ActionRowBuilder().addComponents(combatVideoInput);
                
                modal.addComponents(row1, row2, row3, row4);
                
                await interaction.showModal(modal);
                
            } catch (error) {
                console.error('Error creating step 4 modal:', error);
                await interaction.reply({
                    content: '❌ An error occurred while creating the form.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Handle Step 1 submission (same for both PvP and PvE)
    static async handleStep1Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step1_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                // Get step 1 data
                const description = interaction.fields.getTextInputValue('description');
                const pros = interaction.fields.getTextInputValue('pros');
                const cons = interaction.fields.getTextInputValue('cons');
                
                // Store step 1 data temporarily
                global.tempGuideData = global.tempGuideData || {};
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                global.tempGuideData[tempKey] = {
                    description,
                    pros: pros.split('\n').filter(item => item.trim() !== ''),
                    cons: cons.split('\n').filter(item => item.trim() !== ''),
                    submittedById: interaction.user.id,
                    username: interaction.user.displayName || interaction.user.username,
                    submittedAt: new Date().toISOString(),
                    className,
                    guideType,
                    spec
                };
                
                // Show preview and continue button
                const stepLabel = guideType === 'pvp' ? 'Step 2' : 'Step 2';
                const totalSteps = guideType === 'pvp' ? '4' : '2';
                
                const embed = new EmbedBuilder()
                    .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 1 Complete`)
                    .setDescription(`Step 1 data saved! Click "Continue to ${stepLabel}" to proceed.`)
                    .addFields(
                        { name: 'Description', value: description.substring(0, 1024), inline: false },
                        { name: 'Pros', value: pros.substring(0, 1024) || 'None', inline: true },
                        { name: 'Cons', value: cons.substring(0, 1024) || 'None', inline: true }
                    )
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                    .setFooter({ text: `Guide Progress: 1/${totalSteps} steps complete` });
                
                const continueButton = new ButtonBuilder()
                    .setCustomId(`continue_step2_${className}_${guideType}_${spec}`)
                    .setLabel(`Continue to ${stepLabel}`)
                    .setStyle(ButtonStyle.Primary);
                
                const row = new ActionRowBuilder().addComponents(continueButton);
                
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error saving step 1 data:', error);
                await interaction.reply({
                    content: '❌ An error occurred while saving your data.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Handle Step 2 submission - Different behavior for PvP vs PvE
    static async handleStep2Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step2_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                const step1Data = global.tempGuideData?.[tempKey];
                
                if (!step1Data) {
                    return await interaction.reply({
                        content: '❌ Step 1 data not found. Please start over.',
                        ephemeral: true
                    });
                }
                
                if (guideType === 'pvp') {
                    // PvP Step 2: Store addon/crystal data and continue to step 3
                    const addonsImgur = interaction.fields.getTextInputValue('addonsImgur');
                    const addonReasoning = interaction.fields.getTextInputValue('addonReasoning') || '';
                    const crystalsImgur = interaction.fields.getTextInputValue('crystalsImgur');
                    const crystalInfo = interaction.fields.getTextInputValue('crystalInfo') || '';
                    
                    // Update temp data with step 2 info
                    global.tempGuideData[tempKey] = {
                        ...step1Data,
                        addonsImgur,
                        addonReasoning,
                        crystalsImgur,
                        crystalInfo
                    };
                    
                    // Show step 2 complete and continue to step 3
                    const embed = new EmbedBuilder()
                        .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 2 Complete`)
                        .setDescription('Addons & Crystals saved! Click "Continue to Step 3" for artifacts & lightstones.')
                        .addFields(
                            { name: 'Addons Link', value: addonsImgur, inline: true },
                            { name: 'Crystals Link', value: crystalsImgur, inline: true }
                        )
                        .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                        .setFooter({ text: 'Guide Progress: 2/4 steps complete' });
                    
                    const continueButton = new ButtonBuilder()
                        .setCustomId(`continue_step3_${className}_${guideType}_${spec}`)
                        .setLabel('Continue to Step 3')
                        .setStyle(ButtonStyle.Primary);
                    
                    const row = new ActionRowBuilder().addComponents(continueButton);
                    
                    await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                    
                } else {
                    // PvE Step 2: Final submission (original format)
                    const addons = interaction.fields.getTextInputValue('addons');
                    const movement = interaction.fields.getTextInputValue('movement');
                    const combos = interaction.fields.getTextInputValue('combos');
                    const ytLinks = interaction.fields.getTextInputValue('ytLinks') || '';
                    
                    const completeGuideData = {
                        ...step1Data,
                        addons: addons.split('\n').filter(item => item.trim() !== ''),
                        movement,
                        combos: combos.split('\n').filter(item => item.trim() !== ''),
                        ytLinks: ytLinks.split('\n').filter(item => item.trim() !== '')
                    };
                    
                    // Save the PvE guide
                    await saveGuideData(completeGuideData);
                    
                    // Clean up temp data
                    delete global.tempGuideData[tempKey];
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Guide Submitted Successfully!')
                        .setDescription(`Your ${createGuideTitle(className, guideType, spec)} has been saved.`)
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
                }
                
            } catch (error) {
                console.error('Error handling step 2 submission:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your submission.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Handle Step 3 submission (PvP only) - Artifacts & Lightstones
    static async handleStep3Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step3_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                const previousData = global.tempGuideData?.[tempKey];
                
                if (!previousData) {
                    return await interaction.reply({
                        content: '❌ Previous step data not found. Please start over.',
                        ephemeral: true
                    });
                }
                
                const artifactsImgur = interaction.fields.getTextInputValue('artifactsImgur');
                const lightstoneImgur = interaction.fields.getTextInputValue('lightstoneImgur');
                const reasoning = interaction.fields.getTextInputValue('reasoning');
                
                // Update temp data with step 3 info
                global.tempGuideData[tempKey] = {
                    ...previousData,
                    artifactsImgur,
                    lightstoneImgur,
                    reasoning
                };
                
                // Show step 3 complete and continue to step 4
                const embed = new EmbedBuilder()
                    .setTitle(`${createGuideTitle(className, guideType, spec)} - Step 3 Complete`)
                    .setDescription('Artifacts & Lightstones saved! Click "Continue to Step 4" for movement & combat.')
                    .addFields(
                        { name: 'Artifacts Link', value: artifactsImgur, inline: true },
                        { name: 'Lightstone Link', value: lightstoneImgur, inline: true },
                        { name: 'Reasoning', value: reasoning.substring(0, 1024), inline: false }
                    )
                    .setColor(config.colors[className.toLowerCase()] || config.colors.primary)
                    .setFooter({ text: 'Guide Progress: 3/4 steps complete' });
                
                const continueButton = new ButtonBuilder()
                    .setCustomId(`continue_step4_${className}_${guideType}_${spec}`)
                    .setLabel('Continue to Step 4')
                    .setStyle(ButtonStyle.Primary);
                
                const row = new ActionRowBuilder().addComponents(continueButton);
                
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error handling step 3 submission:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your submission.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }

    // Handle Step 4 submission (PvP only) - Final submission
    static async handleStep4Submission(interaction) {
        if (interaction.customId.startsWith('submit_guide_step4_')) {
            const [, , , className, guideType, spec] = interaction.customId.split('_');
            
            try {
                const tempKey = `${interaction.user.id}_${className}_${guideType}_${spec}`;
                const previousData = global.tempGuideData?.[tempKey];
                
                if (!previousData) {
                    return await interaction.reply({
                        content: '❌ Previous step data not found. Please start over.',
                        ephemeral: true
                    });
                }
                
                const movementExample = interaction.fields.getTextInputValue('movementExample');
                const movementVideo = interaction.fields.getTextInputValue('movementVideo') || '';
                const pvpCombo = interaction.fields.getTextInputValue('pvpCombo');
                const combatVideo = interaction.fields.getTextInputValue('combatVideo') || '';
                
                // Complete PvP guide data
                const completeGuideData = {
                    ...previousData,
                    movementExample,
                    movementVideo,
                    pvpCombo,
                    combatVideo
                };
                
                // Save the PvP guide
                await saveGuideData(completeGuideData);
                
                // Clean up temp data
                delete global.tempGuideData[tempKey];
                
                const embed = new EmbedBuilder()
                    .setTitle('PvP Guide Submitted Successfully!')
                    .setDescription(`Your ${createGuideTitle(className, guideType, spec)} has been saved.`)
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
                
            } catch (error) {
                console.error('Error handling step 4 submission:', error);
                await interaction.reply({
                    content: '❌ An error occurred while processing your submission.',
                    ephemeral: true
                });
            }
            return true;
        }
        return false;
    }
}

module.exports = GuideCreateHandler;
