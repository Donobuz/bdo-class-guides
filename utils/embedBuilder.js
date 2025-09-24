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
 */
function createSavedGuideEmbed(guideData) {
    const { className, guideType, spec, description, pros, cons, movement, combos, addons, crystals, ytLinks, username } = guideData;
    
    // Helper function to validate URLs
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`${className.charAt(0).toUpperCase() + className.slice(1)} ${spec.charAt(0).toUpperCase() + spec.slice(1)} - ${guideType.toUpperCase()}`)
        .setDescription(description)
        .setColor(config.colors[className] || config.colors.primary)
        .setFooter({ 
            text: `Guide by ${username}` 
        })
        .setTimestamp();

    // Add pros and cons if they exist
    if (pros && pros.length > 0) {
        embed.addFields({
            name: '✅ Pros',
            value: Array.isArray(pros) ? pros.join('\n') : pros,
            inline: true
        });
    }
    
    if (cons && cons.length > 0) {
        embed.addFields({
            name: '❌ Cons',
            value: Array.isArray(cons) ? cons.join('\n') : cons,
            inline: true
        });
    }

    // Add movement and combos if they exist
    if (movement) {
        embed.addFields({
            name: '🏃 Movement & Mobility',
            value: movement,
            inline: false
        });
    }
    
    if (combos) {
        embed.addFields({
            name: '⚔️ Combos & Rotations',
            value: Array.isArray(combos) ? combos.join('\n') : combos,
            inline: false
        });
    }

    // Handle addons
    if (addons && addons.length > 0) {
        const addonImage = Array.isArray(addons) ? addons[0] : addons;
        
        if (isValidUrl(addonImage)) {
            embed.addFields({
                name: '🔮 Add-ons',
                value: `[View Add-ons](${addonImage})`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '🔮 Add-ons',
                value: Array.isArray(addons) ? addons.join('\n') : addons,
                inline: true
            });
        }
    }

    // Handle crystals
    if (crystals && crystals.length > 0) {
        const crystalImage = Array.isArray(crystals) ? crystals[0] : crystals;
        
        if (isValidUrl(crystalImage)) {
            embed.addFields({
                name: '💎 Crystals',
                value: `[View Crystals](${crystalImage})`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '💎 Crystals',
                value: Array.isArray(crystals) ? crystals.join('\n') : crystals,
                inline: true
            });
        }
    }

    // Handle YouTube links
    if (ytLinks && ytLinks.length > 0) {
        embed.addFields({
            name: '� YouTube Links',
            value: Array.isArray(ytLinks) ? ytLinks.join('\n') : ytLinks,
            inline: false
        });
    }

    return embed;
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
            name: '✅ Pros',
            value: Array.isArray(pros) ? pros.join('\n') : pros,
            inline: true
        });
    }
    
    if (cons && cons.length > 0) {
        embed.addFields({
            name: '❌ Cons',
            value: Array.isArray(cons) ? cons.join('\n') : cons,
            inline: true
        });
    }

    // Add movement and combos
    if (movement) {
        embed.addFields({
            name: '🏃 Movement & Mobility',
            value: movement,
            inline: false
        });
    }
    
    if (combos) {
        embed.addFields({
            name: '⚔️ Combos & Rotations',
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
            name: '🔮 Add-ons',
            value: addonsValue,
            inline: true
        });
    }

    if (crystalsImage) {
        embed.addFields({
            name: '💎 Crystals',  
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
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setColor(config.colors.error)
        .setTimestamp();
}

module.exports = {
    createNoGuideEmbed,
    createSavedGuideEmbed,
    createSubmittedGuideEmbed,
    createGuideSelectionEmbed,
    createErrorEmbed
};
