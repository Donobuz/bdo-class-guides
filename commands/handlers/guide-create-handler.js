const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { saveGuideData } = require('../../utils/dataManager');
const { createGuideTitle, getTotalSteps, getStepName } = require('../../utils/classUtils');
const { getStepFields } = require('../../utils/stepConfig');
const { createProgressEmbed, createErrorEmbed, createGuideCreatedEmbed } = require('../../utils/embedBuilder');
const config = require('../../config.js');

class GuideCreateHandler {
    // Start the guide creation process - show Step 1 modal
    static async startCreation(interaction, className, guideType, spec) {
        try {
            await this.showStepModal(interaction, className, guideType, spec, 1);
        } catch (error) {
            console.error('Error starting guide creation:', error);
            await interaction.reply({
                content: 'An error occurred while starting the guide creation.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // Generic function to show a step modal
    static async showStepModal(interaction, className, guideType, spec, stepNumber, guide = {}) {
        const totalSteps = getTotalSteps(guideType);
        const { isBotOwner } = require('../../utils/permissions');
        const isBotOwnerUser = isBotOwner(interaction.user.id);
        
        const modal = new ModalBuilder()
            .setCustomId(`submit_guide_step${stepNumber}_${className}_${guideType}_${spec}`)
            .setTitle(`${createGuideTitle(className, guideType, spec)} - Step ${stepNumber}/${totalSteps}`);
        
        // Get fields dynamically based on step and guide type
        const fields = getStepFields(guideType, stepNumber, guide, isBotOwnerUser);
        
        // Add fields to modal (max 5 components per modal)
        fields.forEach(field => {
            modal.addComponents(new ActionRowBuilder().addComponents(field));
        });
        
        await interaction.showModal(modal);
    }

    // Generic handler for step submissions
    static async handleStepSubmission(interaction) {
        // Check if this is a create step submission
        const match = interaction.customId.match(/^submit_guide_step(\d+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const userId = interaction.user.id;
            
            // Check if discord_id is provided (bot owner feature in step 1) BEFORE creating tempKey
            let targetUserId = userId;
            let targetUserTag = interaction.user.tag;
            
            if (stepNumber === 1) {
                const fields = interaction.fields.fields;
                if (fields.has('discord_id')) {
                    const discordIdValue = fields.get('discord_id').value.trim();
                    if (discordIdValue) {
                        try {
                            const targetUser = await interaction.client.users.fetch(discordIdValue);
                            targetUserId = targetUser.id;
                            targetUserTag = targetUser.tag;
                        } catch (error) {
                            console.error('Error fetching user by discord_id:', error);
                            return await interaction.reply({
                                content: `Could not find user with ID: ${discordIdValue}. Please check the Discord ID and try again.`,
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    }
                }
            } else {
                // For steps 2+, check if there's an existing proxy submission
                // Look for a tempKey where actualSubmitterId matches current user
                if (global.tempGuideData) {
                    const matchingSuffix = `_${className}_${guideType}_${spec}`;
                    const existingKey = Object.keys(global.tempGuideData).find(key => 
                        key.endsWith(matchingSuffix) && 
                        global.tempGuideData[key].actualSubmitterId === userId
                    );
                    
                    if (existingKey) {
                        // Extract the target user ID from the existing key
                        targetUserId = existingKey.split('_')[0];
                        targetUserTag = global.tempGuideData[existingKey].submittedBy;
                    }
                }
            }
            
            const tempKey = `${targetUserId}_${className}_${guideType}_${spec}`;
            
            // Initialize or get temp data
            global.tempGuideData = global.tempGuideData || {};
            if (!global.tempGuideData[tempKey]) {
                global.tempGuideData[tempKey] = {
                    className,
                    guideType,
                    spec,
                    submittedById: targetUserId,
                    submittedBy: targetUserTag,
                    actualSubmitterId: userId, // Track who actually submitted it
                    guildId: interaction.guild.id, // Track which server created the guide
                    guildName: interaction.guild.name // Store server name for display
                };
            }
            
            const tempData = global.tempGuideData[tempKey];

            // Extract all field values from the modal
            const fields = interaction.fields.fields;
            
            fields.forEach((field, fieldId) => {
                // Skip discord_id field - it's not part of the guide data
                if (fieldId === 'discord_id') return;
                
                const value = field.value;
                // Handle arrays (pros/cons/reliable_ccs)
                if (fieldId === 'pros' || fieldId === 'cons' || fieldId === 'reliable_ccs') {
                    tempData[fieldId] = value.split('\n').map(line => line.trim()).filter(line => line);
                } else {
                    tempData[fieldId] = value;
                }
            });

            global.tempGuideData[tempKey] = tempData;

            const totalSteps = getTotalSteps(guideType);

            // If this is the last step, save the guide
            if (stepNumber >= totalSteps) {
                return await this.saveGuide(interaction, className, guideType, spec, userId, tempData);
            }

            // Otherwise, show continue button for next step with preview
            const nextStepName = getStepName(guideType, stepNumber + 1);
            
            // Build field preview - show EVERYTHING without truncation
            let previewText = '**What you entered:**\n';
            fields.forEach((field, fieldId) => {
                const value = field.value;
                const label = fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
                
                if (fieldId === 'pros' || fieldId === 'cons' || fieldId === 'reliable_ccs') {
                    const items = value.split('\n').filter(line => line.trim());
                    previewText += `\n**${label}:**\n`;
                    items.forEach(item => {
                        previewText += `• ${item}\n`;
                    });
                } else {
                    previewText += `\n**${label}:**\n${value}\n`;
                }
            });

            const embed = createProgressEmbed(
                `${createGuideTitle(className, guideType, spec)} - Step ${stepNumber}/${totalSteps} Complete`,
                previewText,
                config.colors.primary
            );

            // Add three buttons: Go Back & Edit, Continue, Cancel
            const editButton = new ButtonBuilder()
                .setCustomId(`redo_step${stepNumber}_${className}_${guideType}_${spec}`)
                .setLabel('Go Back & Edit')
                .setStyle(ButtonStyle.Secondary);

            const continueButton = new ButtonBuilder()
                .setCustomId(`continue_step${stepNumber + 1}_${className}_${guideType}_${spec}`)
                .setLabel(`Continue ➜ ${nextStepName} (${stepNumber + 1}/${totalSteps})`)
                .setStyle(ButtonStyle.Primary);

            const cancelButton = new ButtonBuilder()
                .setCustomId(`cancel_guide_${className}_${guideType}_${spec}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(editButton, continueButton, cancelButton);

            await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });

            return true;

        } catch (error) {
            console.error(`Error in create step ${stepNumber} submission:`, error);
            const errorEmbed = createErrorEmbed('Error', 'An error occurred while saving your progress.');
            await interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Generic handler for continue buttons
    static async handleContinueStep(interaction) {
        // Check if this is a create continue button
        const match = interaction.customId.match(/^continue_step(\d+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const userId = interaction.user.id;
            
            // First try with the current user's ID
            let tempKey = `${userId}_${className}_${guideType}_${spec}`;
            let tempData = global.tempGuideData?.[tempKey];
            
            // If not found, check if this is a proxy submission (bot owner creating for someone else)
            // Look for any tempKey that matches the class/type/spec pattern
            if (!tempData && global.tempGuideData) {
                const matchingSuffix = `_${className}_${guideType}_${spec}`;
                tempKey = Object.keys(global.tempGuideData).find(key => 
                    key.endsWith(matchingSuffix) && 
                    global.tempGuideData[key].actualSubmitterId === userId
                );
                tempData = tempKey ? global.tempGuideData[tempKey] : null;
            }

            if (!tempData) {
                return await interaction.reply({
                    content: 'Session expired. Please start over with /guide-create.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Show the next step modal with any previously entered data
            await this.showStepModal(interaction, className, guideType, spec, stepNumber, tempData);
            
            return true;

        } catch (error) {
            console.error(`Error creating step ${stepNumber} modal:`, error);
            await interaction.reply({
                content: 'An error occurred while creating the form.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Handle "Go Back & Edit" button - re-show the same step modal
    static async handleRedoStep(interaction) {
        const match = interaction.customId.match(/^redo_step(\d+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const userId = interaction.user.id;
            
            // First try with the current user's ID
            let tempKey = `${userId}_${className}_${guideType}_${spec}`;
            let tempData = global.tempGuideData?.[tempKey];
            
            // If not found, check if this is a proxy submission (bot owner creating for someone else)
            // Look for any tempKey that matches the class/type/spec pattern
            if (!tempData && global.tempGuideData) {
                const matchingSuffix = `_${className}_${guideType}_${spec}`;
                tempKey = Object.keys(global.tempGuideData).find(key => 
                    key.endsWith(matchingSuffix) && 
                    global.tempGuideData[key].actualSubmitterId === userId
                );
                tempData = tempKey ? global.tempGuideData[tempKey] : null;
            }

            if (!tempData) {
                return await interaction.reply({
                    content: 'Session expired. Please start over with /guide-create.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Show the same step modal again with previously entered data
            await this.showStepModal(interaction, className, guideType, spec, stepNumber, tempData);
            
            return true;

        } catch (error) {
            console.error(`Error re-showing step ${stepNumber} modal:`, error);
            await interaction.reply({
                content: 'An error occurred while opening the form.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Handle "Cancel" button - clear temp data and exit
    static async handleCancel(interaction) {
        const match = interaction.customId.match(/^cancel_guide_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, className, guideType, spec] = match;
        const userId = interaction.user.id;
        const tempKey = `${userId}_${className}_${guideType}_${spec}`;

        // Clear temp data
        if (global.tempGuideData?.[tempKey]) {
            delete global.tempGuideData[tempKey];
        }

        await interaction.reply({
            content: 'Guide creation cancelled. Your progress has been discarded.',
            flags: MessageFlags.Ephemeral
        });

        return true;
    }

    // Save the complete guide
    static async saveGuide(interaction, className, guideType, spec, userId, tempData) {
        try {
            // Add timestamp
            const completeGuide = {
                ...tempData,
                createdAt: new Date().toISOString()
            };

            // Save to file - pass the complete guide object
            const result = await saveGuideData(completeGuide);

            const embed = createGuideCreatedEmbed(className, guideType, spec);
            
            // Show different message based on whether it was an update or new creation
            if (result.wasUpdate) {
                embed.setTitle('Guide Updated Successfully!');
                embed.setDescription(`Your ${className} ${spec} ${guideType.toUpperCase()} guide has been updated and replaced the previous version!`);
            }
            
            embed.setFooter({ text: 'Use /guide to view your guide!' });

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

            // Clean up temp data - use the submittedById from tempData, not the passed userId
            const tempKey = `${tempData.submittedById}_${className}_${guideType}_${spec}`;
            delete global.tempGuideData[tempKey];

            return true;

        } catch (error) {
            console.error('Error saving guide:', error);
            await interaction.reply({
                content: 'An error occurred while saving your guide.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Legacy handler for backwards compatibility (if needed)
    static async handleLegacySubmission(interaction) {
        // This can be removed if you're sure no old modals are in use
        return false;
    }
}

module.exports = GuideCreateHandler;
