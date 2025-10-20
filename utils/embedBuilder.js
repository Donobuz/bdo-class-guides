const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

/**
 * Creates an embed when no guide is available for a class
 */
function createNoGuideEmbed(className, guideType) {
    const embed = new EmbedBuilder()
        .setTitle(`${className} ${guideType.toUpperCase()} Guides`)
        .setDescription(`No ${guideType} guides available for ${className} yet.\n\nWould you like to create one?`)
        .setColor(0x0099FF)
        .setTimestamp();

    return embed;
}

/**
 * Creates an embed for displaying saved guide data
 * Now returns an array: [mainEmbed, ...imageEmbeds]
 */
function createSavedGuideEmbed(guideData) {
    const { className, guideType, spec, description, pros, cons, crystalsImgur, crystalsT1Capped, crystalsT2Capped, crystalsUncapped, addonsImgur, artifactsImgur, lightstoneImgur, reasoning, pvpCombo, combatVideo, movementVideo, movementExample, pveCombo, submittedBy, username, createdAt } = guideData;
    
    const mainEmbed = new EmbedBuilder()
        .setTitle(`${className.charAt(0).toUpperCase() + className.slice(1)} ${spec.charAt(0).toUpperCase() + spec.slice(1)} - ${guideType.toUpperCase()}`)
        .setDescription(description || 'No description provided')
        .setColor(config.colors[className] || config.colors.primary)
        .setTimestamp(createdAt ? new Date(createdAt) : new Date());

    // Add pros and cons side by side
    if (pros && pros.length > 0) {
        mainEmbed.addFields({
            name: 'Pros',
            value: Array.isArray(pros) ? pros.map(pro => `• ${pro}`).join('\n') : pros,
            inline: true
        });
    } else {
        mainEmbed.addFields({ name: 'Pros', value: 'None listed', inline: true });
    }
    
    if (cons && cons.length > 0) {
        mainEmbed.addFields({
            name: 'Cons',
            value: Array.isArray(cons) ? cons.map(con => `• ${con}`).join('\n') : cons,
            inline: true
        });
    } else {
        mainEmbed.addFields({ name: 'Cons', value: 'None listed', inline: true });
    }

    // Add separator
    mainEmbed.addFields({ name: '\u200B', value: '\u200B', inline: false });

    // Add reasoning if present (for artifacts/lightstones)
    if (reasoning) {
        mainEmbed.addFields({
            name: 'Build Reasoning',
            value: reasoning,
            inline: false
        });
    }

    // PvP specific fields
    if (guideType === 'pvp') {
        if (movementExample) {
            mainEmbed.addFields({
                name: 'Movement Pattern',
                value: movementExample,
                inline: false
            });
        }

        if (pvpCombo) {
            mainEmbed.addFields({
                name: 'PvP Combos',
                value: pvpCombo,
                inline: false
            });
        }
    }

    // PvE specific fields
    if (guideType === 'pve') {
        if (movementExample) {
            mainEmbed.addFields({
                name: 'Movement Pattern',
                value: movementExample,
                inline: false
            });
        }

        if (pveCombo) {
            mainEmbed.addFields({
                name: 'Rotation/Combo',
                value: pveCombo,
                inline: false
            });
        }
    }

    // Set footer with submitter info
    const submitterName = submittedBy || username || 'Unknown';
    mainEmbed.setFooter({ text: `Submitted by ${submitterName}` });

    // Create array to hold all embeds
    const embeds = [mainEmbed];

    // Add Crystal Tiers as separate embeds (for PvP guides)
    if (crystalsT1Capped) {
        const crystalsT1Embed = new EmbedBuilder()
            .setTitle('Crystals - T1 Capped')
            .setImage(crystalsT1Capped)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(crystalsT1Embed);
    }

    if (crystalsT2Capped) {
        const crystalsT2Embed = new EmbedBuilder()
            .setTitle('Crystals - T2 Capped')
            .setImage(crystalsT2Capped)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(crystalsT2Embed);
    }

    if (crystalsUncapped) {
        const crystalsUncappedEmbed = new EmbedBuilder()
            .setTitle('Crystals - Uncapped')
            .setImage(crystalsUncapped)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(crystalsUncappedEmbed);
    }

    // Add single Crystals image (for PvE guides)
    if (crystalsImgur) {
        const crystalsEmbed = new EmbedBuilder()
            .setTitle('Crystals')
            .setImage(crystalsImgur)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(crystalsEmbed);
    }

    // Add Addons image as a separate embed
    if (addonsImgur) {
        const addonsEmbed = new EmbedBuilder()
            .setTitle('Addons')
            .setImage(addonsImgur)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(addonsEmbed);
    }

    // Add Artifacts image as a separate embed
    if (artifactsImgur) {
        const artifactsEmbed = new EmbedBuilder()
            .setTitle('Artifacts')
            .setImage(artifactsImgur)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(artifactsEmbed);
    }

    // Add Lightstone image as a separate embed
    if (lightstoneImgur) {
        const lightstoneEmbed = new EmbedBuilder()
            .setTitle('Lightstone Set')
            .setImage(lightstoneImgur)
            .setColor(config.colors[className] || config.colors.primary);
        embeds.push(lightstoneEmbed);
    }

    // Add movement video as embed with YouTube thumbnail
    if (movementVideo) {
        // Check if it's a YouTube link
        const youtubeRegex = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
        const match = movementVideo.match(youtubeRegex);

        if (match) {
            const videoId = match[2];
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const videoEmbed = new EmbedBuilder()
                .setTitle('Gameplay Video')
                .setURL(movementVideo)
                .setImage(thumbnailUrl)
                .setDescription(`[Click here to watch on YouTube](${movementVideo})`)
                .setColor(config.colors[className] || config.colors.primary);
            embeds.push(videoEmbed);
        } else {
            // Not a YouTube link, just add as a field in main embed
            mainEmbed.addFields({
                name: 'Gameplay Video',
                value: `[Watch Video](${movementVideo})`,
                inline: false
            });
        }
    }

    // Add combat video for PvP (separate from movement video)
    if (combatVideo && guideType === 'pvp') {
        const youtubeRegex = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
        const match = combatVideo.match(youtubeRegex);

        if (match) {
            const videoId = match[2];
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const videoEmbed = new EmbedBuilder()
                .setTitle('Combat Video')
                .setURL(combatVideo)
                .setImage(thumbnailUrl)
                .setDescription(`[Click here to watch on YouTube](${combatVideo})`)
                .setColor(config.colors[className] || config.colors.primary);
            embeds.push(videoEmbed);
        } else {
            mainEmbed.addFields({
                name: 'Combat Video',
                value: `[Watch Video](${combatVideo})`,
                inline: false
            });
        }
    }

    return embeds;
}

/**
 * Creates an embed for a submitted guide
 * @param {Object} guideData - The submitted guide data
 * @returns {EmbedBuilder} - Discord embed for the submitted guide
 */
function createSubmittedGuideEmbed(guideData) {
    const { className, guideType, spec, description, pros, cons, movement, combos, addonsImage, addonsText, crystalsImage, username } = guideData;
    
    const embed = new EmbedBuilder()
        .setTitle(`${className.charAt(0).toUpperCase() + className.slice(1)} ${spec.charAt(0).toUpperCase() + spec.slice(1)} - ${guideType.toUpperCase()}`)
        .setDescription(description)
        .setColor(config.colors[className] || config.colors.primary)
        .setFooter({ 
            text: `Submitted by ${username}` 
        })
        .setTimestamp();

    // Add pros and cons
    if (pros && pros.length > 0) {
        embed.addFields({
            name: 'Pros',
            value: Array.isArray(pros) ? pros.join('\n') : pros,
            inline: true
        });
    }
    
    if (cons && cons.length > 0) {
        embed.addFields({
            name: 'Cons',
            value: Array.isArray(cons) ? cons.join('\n') : cons,
            inline: true
        });
    }

    // Add movement and combos
    if (movement) {
        embed.addFields({
            name: 'Movement & Mobility',
            value: movement,
            inline: false
        });
    }
    
    if (combos) {
        embed.addFields({
            name: 'Combos & Rotations',
            value: combos,
            inline: false
        });
    }

    // Handle images
    if (addonsImage) {
        let addonsValue = 'Image will be processed and attached';
        if (addonsText) {
            addonsValue += `\n\n**Reasoning:** ${addonsText}`;
        }
        
        embed.addFields({
            name: 'Add-ons',
            value: addonsValue,
            inline: true
        });
    }

    if (crystalsImage) {
        embed.addFields({
            name: 'Crystals',  
            value: 'Image will be processed and attached',
            inline: true
        });
    }

    return embed;
}

/**
 * Creates the guide selection embed (same as createClassGuideEmbed but with different name for compatibility)
 * @param {string} className - The class name
 * @param {string} guideType - Either 'pvp' or 'pve'
 * @returns {EmbedBuilder} - Discord embed for guide selection
 */
function createGuideSelectionEmbed(className, guideType) {
    const { isAscensionClass } = require('./classUtils');
    const isAscension = isAscensionClass(className);
    const specText = isAscension ? 'Select a specialization (Awakening/Ascension)' : 'Select a specialization (Succession/Awakening)';
    
    return new EmbedBuilder()
        .setTitle(`${className.charAt(0).toUpperCase() + className.slice(1)} ${guideType.toUpperCase()} Guides`)
        .setDescription(specText)
        .setColor(config.colors[className] || config.colors.primary)
        .setTimestamp();
}

/**
 * Creates an error embed
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setTitle(`${title}`)
        .setDescription(description)
        .setColor(config.colors.error)
        .setTimestamp();
}

/**
 * Creates a success embed
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(config.colors.success || 0x00FF00)
        .setTimestamp();
}

/**
 * Creates a progress saved embed for guide creation/editing
 */
function createProgressEmbed(stepName, previewText, color = config.colors.primary) {
    return new EmbedBuilder()
        .setTitle(`Step Progress: ${stepName}`)
        .setDescription(`Progress saved!\n${previewText}`)
        .setColor(color)
        .setTimestamp();
}

/**
 * Creates a confirmation embed for deletions
 */
function createConfirmDeleteEmbed(guideInfo) {
    const { className, guideType, spec, description, submittedBy } = guideInfo;
    
    return new EmbedBuilder()
        .setTitle('Confirm Guide Deletion')
        .setDescription('Are you sure you want to delete this guide?')
        .addFields(
            { name: 'User', value: submittedBy || 'Unknown', inline: true },
            { name: 'Class', value: className.charAt(0).toUpperCase() + className.slice(1), inline: true },
            { name: 'Type', value: guideType.toUpperCase(), inline: true },
            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true },
            { name: 'Description', value: description ? (description.substring(0, 200) + (description.length > 200 ? '...' : '')) : 'No description', inline: false }
        )
        .setColor(config.colors.error)
        .setFooter({ text: 'This action cannot be undone!' });
}

/**
 * Creates embed for list of guides (for selection)
 */
function createGuideListEmbed(title, description, className, count) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(config.colors[className] || config.colors.primary)
        .setFooter({ text: `${count} guide(s) available` })
        .setTimestamp();
}

/**
 * Creates embed for deletion success
 */
function createDeleteSuccessEmbed(className, guideType, spec, customMessage = null) {
    const specDisplay = spec ? spec.charAt(0).toUpperCase() + spec.slice(1) : '';
    const description = customMessage || `Deleted ${className} ${specDisplay} ${guideType.toUpperCase()} guide.`;
    
    return new EmbedBuilder()
        .setTitle('Guide Deleted Successfully')
        .setDescription(description)
        .setColor(config.colors.success || 0x00FF00)
        .setTimestamp();
}

/**
 * Creates embed for guide creation success
 */
function createGuideCreatedEmbed(className, guideType, spec) {
    return new EmbedBuilder()
        .setTitle('Guide Created Successfully!')
        .setDescription(`Your ${className} ${spec} ${guideType.toUpperCase()} guide has been created and is now available for others to view!`)
        .addFields(
            { name: 'Class', value: className.charAt(0).toUpperCase() + className.slice(1), inline: true },
            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true },
            { name: 'Type', value: guideType.toUpperCase(), inline: true }
        )
        .setColor(config.colors.success || 0x00FF00)
        .setTimestamp();
}

/**
 * Creates embed for guide update success
 */
function createGuideUpdatedEmbed(className, guideType, spec) {
    return new EmbedBuilder()
        .setTitle('Guide Updated Successfully!')
        .setDescription(`Your ${className} ${spec} ${guideType.toUpperCase()} guide has been updated!`)
        .addFields(
            { name: 'Class', value: className.charAt(0).toUpperCase() + className.slice(1), inline: true },
            { name: 'Spec', value: spec.charAt(0).toUpperCase() + spec.slice(1), inline: true },
            { name: 'Type', value: guideType.toUpperCase(), inline: true }
        )
        .setColor(config.colors.success || 0x00FF00)
        .setTimestamp();
}

module.exports = {
    createNoGuideEmbed,
    createSavedGuideEmbed,
    createSubmittedGuideEmbed,
    createGuideSelectionEmbed,
    createErrorEmbed,
    createSuccessEmbed,
    createProgressEmbed,
    createConfirmDeleteEmbed,
    createGuideListEmbed,
    createDeleteSuccessEmbed,
    createGuideCreatedEmbed,
    createGuideUpdatedEmbed
};
