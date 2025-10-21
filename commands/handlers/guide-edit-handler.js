const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadAllGuidesForClassType, saveGuideData } = require('../../utils/dataManager');
const { createGuideTitle, getTotalSteps, getStepName } = require('../../utils/classUtils');
const { getStepFields } = require('../../utils/stepConfig');
const { createProgressEmbed, createErrorEmbed, createGuideUpdatedEmbed } = require('../../utils/embedBuilder');
const { canModifyGuide } = require('../../utils/permissions');
const config = require('../../config.js');

class GuideEditHandler {
    // Handle user selection when admin edits guides
    static async handleEditUserSelect(interaction) {
        if (interaction.customId.startsWith('edit_user_select_')) {
            const [, , , className, guideType] = interaction.customId.split('_');
            const selectedValue = interaction.values[0];
            const [userId, spec] = selectedValue.split('_');
            
            // Start editing for the selected user's guide
            return await this.startEditing(interaction, className, guideType, spec, userId);
        }
        return false;
    }

    // Start the editing process - show Step 1 modal
    static async startEditing(interaction, className, guideType, spec, userId) {
        try {
            // Load the specific guide data
            const allGuides = await loadAllGuidesForClassType(className, guideType);
            const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
            
            if (!guide) {
                return await interaction.reply({
                    content: `Guide not found.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Show Step 1 modal
            await this.showStepModal(interaction, className, guideType, spec, userId, 1, guide);
        } catch (error) {
            console.error('Error starting guide edit:', error);
            await interaction.reply({
                content: 'An error occurred while starting the guide edit.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // Handle quick edit button (jump to specific step)
    static async handleQuickEdit(interaction) {
        if (interaction.customId.startsWith('quick_edit_step')) {
            const match = interaction.customId.match(/^quick_edit_step(\d+)_(.+)_(.+)_(.+)_(.+)$/);
            if (!match) return false;

            const [, stepNum, className, guideType, spec, userId] = match;
            const stepNumber = parseInt(stepNum);

            try {
                // Load the guide
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                
                if (!guide) {
                    return await interaction.reply({
                        content: `Guide not found.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Check permissions before allowing edit
                const permissionCheck = await canModifyGuide(interaction.member, guide);
                if (!permissionCheck.allowed) {
                    return await interaction.reply({
                        content: permissionCheck.errorMessage,
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Initialize temp edit data with the original guide
                global.tempEditData = global.tempEditData || {};
                const tempKey = `${userId}_${className}_${guideType}_${spec}`;
                global.tempEditData[tempKey] = { originalGuide: guide };

                // Show the specific step modal
                await this.showStepModal(interaction, className, guideType, spec, userId, stepNumber, guide);
                return true;

            } catch (error) {
                console.error('Error in quick edit:', error);
                await interaction.reply({
                    content: 'An error occurred while opening the edit form.',
                    flags: MessageFlags.Ephemeral
                });
                return true;
            }
        }
        return false;
    }

    // Generic function to show a step modal
    static async showStepModal(interaction, className, guideType, spec, userId, stepNumber, guide) {
        const totalSteps = getTotalSteps(guideType);
        const { isBotOwner } = require('../../utils/permissions');
        const isBotOwnerUser = isBotOwner(interaction.user.id);
        
        const modal = new ModalBuilder()
            .setCustomId(`edit_step${stepNumber}_${className}_${guideType}_${spec}_${userId}`)
            .setTitle(`Edit ${createGuideTitle(className, guideType, spec)} - Step ${stepNumber}/${totalSteps}`);
        
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
        // Check if this is an edit step submission
        const match = interaction.customId.match(/^edit_step(\d+)_(.+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec, userId] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const tempKey = `${userId}_${className}_${guideType}_${spec}`;
            
            // Initialize or get temp data
            global.tempEditData = global.tempEditData || {};
            if (!global.tempEditData[tempKey]) {
                // Load existing guide on first step
                const allGuides = await loadAllGuidesForClassType(className, guideType);
                const guide = allGuides.find(g => g.submittedById === userId && g.spec === spec);
                
                if (!guide) {
                    return await interaction.reply({
                        content: 'Guide not found.',
                        flags: MessageFlags.Ephemeral
                    });
                }
                
                // Check permissions before allowing edit
                const permissionCheck = await canModifyGuide(interaction.member, guide);
                if (!permissionCheck.allowed) {
                    return await interaction.reply({
                        content: permissionCheck.errorMessage,
                        flags: MessageFlags.Ephemeral
                    });
                }

                global.tempEditData[tempKey] = { originalGuide: guide };
            }
            
            const tempData = global.tempEditData[tempKey];

            // Extract all field values from the modal
            const fields = interaction.fields.fields;
            
            // Check if discord_id is provided (admin feature in step 1)
            if (stepNumber === 1 && fields.has('discord_id')) {
                const discordIdValue = fields.get('discord_id').value.trim();
                if (discordIdValue) {
                    try {
                        const targetUser = await interaction.client.users.fetch(discordIdValue);
                        tempData.submittedById = targetUser.id;
                        tempData.submittedBy = targetUser.tag;
                    } catch (error) {
                        console.error('Error fetching user by discord_id:', error);
                        return await interaction.reply({
                            content: `Could not find user with ID: ${discordIdValue}. Please check the Discord ID and try again.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            }
            
            fields.forEach((field, fieldId) => {
                // Skip discord_id field - it's not part of the guide data
                if (fieldId === 'discord_id') return;
                
                const value = field.value;
                // Handle arrays (pros/cons)
                if (fieldId === 'pros' || fieldId === 'cons') {
                    tempData[fieldId] = value.split('\n').map(line => line.trim()).filter(line => line);
                } else {
                    tempData[fieldId] = value;
                }
            });

            global.tempEditData[tempKey] = tempData;

            const totalSteps = getTotalSteps(guideType);

            // If this is the last step, save the guide
            if (stepNumber >= totalSteps) {
                return await this.saveGuide(interaction, className, guideType, spec, userId, tempData);
            }

            // Otherwise, show continue button for next step with preview
            const nextStepName = getStepName(guideType, stepNumber + 1);
            
            // Build field preview - show EVERYTHING without truncation
            let previewText = '**What you updated:**\n';
            fields.forEach((field, fieldId) => {
                const value = field.value;
                const label = fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
                
                if (fieldId === 'pros' || fieldId === 'cons') {
                    const items = value.split('\n').filter(line => line.trim());
                    previewText += `\n**${label}:**\n`;
                    items.forEach(item => {
                        previewText += `• ${item}\n`;
                    });
                } else {
                    previewText += `\n**${label}:**\n${value}\n`;
                }
            });
            
            const title = `${createGuideTitle(className, guideType, spec)} - Step ${stepNumber}/${totalSteps} Complete`;
            const embed = createProgressEmbed(title, previewText, config.colors.primary);

            // Add three buttons: Go Back & Edit, Continue, Cancel
            const editButton = new ButtonBuilder()
                .setCustomId(`redo_edit_step${stepNumber}_${className}_${guideType}_${spec}_${userId}`)
                .setLabel('Go Back & Edit')
                .setStyle(ButtonStyle.Secondary);

            const continueButton = new ButtonBuilder()
                .setCustomId(`edit_continue_step${stepNumber + 1}_${className}_${guideType}_${spec}_${userId}`)
                .setLabel(`Continue ➜ ${nextStepName} (${stepNumber + 1}/${totalSteps})`)
                .setStyle(ButtonStyle.Primary);

            const cancelButton = new ButtonBuilder()
                .setCustomId(`cancel_edit_${className}_${guideType}_${spec}_${userId}`)
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
            console.error(`Error in edit step ${stepNumber} submission:`, error);
            await interaction.reply({
                content: 'An error occurred while saving your changes.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Generic handler for continue buttons
    static async handleContinueStep(interaction) {
        // Check if this is an edit continue button
        const match = interaction.customId.match(/^edit_continue_step(\d+)_(.+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec, userId] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const tempKey = `${userId}_${className}_${guideType}_${spec}`;
            const tempData = global.tempEditData[tempKey];

            if (!tempData || !tempData.originalGuide) {
                return await interaction.reply({
                    content: 'Session expired. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Merge updated fields from previous steps with original guide
            const guide = { ...tempData.originalGuide, ...tempData };

            // Show the next step modal
            await this.showStepModal(interaction, className, guideType, spec, userId, stepNumber, guide);
            
            return true;

        } catch (error) {
            console.error(`Error creating edit step ${stepNumber} modal:`, error);
            await interaction.reply({
                content: 'An error occurred while creating the form.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Handle "Go Back & Edit" button - re-show the same step modal
    static async handleRedoStep(interaction) {
        const match = interaction.customId.match(/^redo_edit_step(\d+)_(.+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, stepNum, className, guideType, spec, userId] = match;
        const stepNumber = parseInt(stepNum);

        try {
            const tempKey = `${userId}_${className}_${guideType}_${spec}`;
            const tempData = global.tempEditData?.[tempKey];

            if (!tempData || !tempData.originalGuide) {
                return await interaction.reply({
                    content: 'Session expired. Please try again.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Merge updated fields with original guide for showing the modal
            const guide = { ...tempData.originalGuide, ...tempData };

            // Show the same step modal again with previously entered data
            await this.showStepModal(interaction, className, guideType, spec, userId, stepNumber, guide);
            
            return true;

        } catch (error) {
            console.error(`Error re-showing edit step ${stepNumber} modal:`, error);
            await interaction.reply({
                content: 'An error occurred while opening the form.',
                flags: MessageFlags.Ephemeral
            });
            return true;
        }
    }

    // Handle "Cancel" button - clear temp data and exit
    static async handleCancelEdit(interaction) {
        const match = interaction.customId.match(/^cancel_edit_(.+)_(.+)_(.+)_(.+)$/);
        if (!match) return false;

        const [, className, guideType, spec, userId] = match;
        const tempKey = `${userId}_${className}_${guideType}_${spec}`;

        // Clear temp data
        if (global.tempEditData?.[tempKey]) {
            delete global.tempEditData[tempKey];
        }

        await interaction.reply({
            content: 'Edit cancelled. Your changes have been discarded.',
            flags: MessageFlags.Ephemeral
        });

        return true;
    }

    // Save the complete guide
    static async saveGuide(interaction, className, guideType, spec, userId, tempData) {
        try {
            // Merge all data with original guide
            const updatedGuide = {
                ...tempData.originalGuide,
                ...tempData,
                updatedAt: new Date().toISOString()
            };
            
            // Add guildId if it doesn't exist (for backward compatibility with old guides)
            if (!updatedGuide.guildId) {
                updatedGuide.guildId = interaction.guild.id;
                updatedGuide.guildName = interaction.guild.name;
            }

            // Remove the temporary originalGuide key
            delete updatedGuide.originalGuide;

            // Save to file - pass the complete guide object
            await saveGuideData(updatedGuide);

            const embed = createGuideUpdatedEmbed(updatedGuide.className, updatedGuide.guideType, updatedGuide.spec);

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

            // Clean up temp data
            const tempKey = `${userId}_${className}_${guideType}_${spec}`;
            delete global.tempEditData[tempKey];

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
}

module.exports = GuideEditHandler;
