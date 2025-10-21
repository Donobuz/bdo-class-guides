const { TextInputBuilder, TextInputStyle } = require('discord.js');

/**
 * Get the modal field configurations for a specific step
 * @param {string} guideType - The guide type (pve/pvp)
 * @param {number} stepNumber - The step number (1-indexed)
 * @param {object} guide - The guide data object for pre-filling values
 * @param {boolean} isBotOwner - Whether the user is a bot owner (adds optional discord_id field)
 * @returns {Array} - Array of TextInputBuilder objects
 */
function getStepFields(guideType, stepNumber, guide = {}, isBotOwner = false) {
    const stepConfigs = {
        // PvP Step 1: Description, Pros, Cons
        pvp_1: [
            {
                id: 'description',
                label: 'Guide Description',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your build and playstyle...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.description || ''
            },
            {
                id: 'pros',
                label: 'Pros (one per line)',
                style: TextInputStyle.Paragraph,
                placeholder: 'High damage\nGood mobility\nStrong in 1v1...',
                maxLength: 500,
                required: true,
                getValue: (g) => g.pros?.join('\n') || ''
            },
            {
                id: 'cons',
                label: 'Cons (one per line)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Resource management\nVulnerable to grabs\nHigh skill requirement...',
                maxLength: 500,
                required: true,
                getValue: (g) => g.cons?.join('\n') || ''
            },
            ...(isBotOwner ? [{
                id: 'discord_id',
                label: 'Submit for User (Discord ID - Optional)',
                style: TextInputStyle.Short,
                placeholder: 'Leave empty to submit as yourself, or enter Discord user ID',
                maxLength: 20,
                required: false,
                getValue: (g) => g.submittedById === g.actualSubmitterId ? '' : g.submittedById || ''
            }] : [])
        ],
        // PvP Step 2: Large Scale Role, Small Scale Role, Positioning
        pvp_2: [
            {
                id: 'largeScaleRole',
                label: 'Large Scale Role',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your role and effectiveness in Node Wars, Siege, Red Battlefield, etc...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.largeScaleRole || ''
            },
            {
                id: 'smallScaleRole',
                label: 'Small Scale Role',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your role in 1v1, small skirmishes, and arsha...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.smallScaleRole || ''
            },
            {
                id: 'positioning',
                label: 'Positioning',
                style: TextInputStyle.Paragraph,
                placeholder: 'Explain optimal positioning in various PvP scenarios...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.positioning || ''
            },
            {
                id: 'positioningImage',
                label: 'Positioning Image (optional)',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png or Discord CDN link',
                maxLength: 500,
                required: false,
                getValue: (g) => g.positioningImage || ''
            }
        ],
        // PvP Step 3: Crystals (T1 Capped, T2 Capped, Uncapped) + Addons
        pvp_3: [
            {
                id: 'crystalsT1Capped',
                label: 'T1 Capped Crystals Image Link',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png or Discord CDN link',
                maxLength: 500,
                required: true,
                getValue: (g) => g.crystalsT1Capped || ''
            },
            {
                id: 'crystalsT2Capped',
                label: 'T2 Capped Crystals Image Link',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png or Discord CDN link',
                maxLength: 500,
                required: true,
                getValue: (g) => g.crystalsT2Capped || ''
            },
            {
                id: 'crystalsUncapped',
                label: 'Uncapped Crystals Image Link',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png or Discord CDN link',
                maxLength: 500,
                required: true,
                getValue: (g) => g.crystalsUncapped || ''
            },
            {
                id: 'addonsImgur',
                label: 'Addons Image Link',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png or Discord CDN link',
                maxLength: 500,
                required: true,
                getValue: (g) => g.addonsImgur || ''
            }
        ],
        // PvP Step 4: Artifacts, Lightstones, Reforge Stones, Skills, Reliable CCs
        pvp_4: [
            {
                id: 'artifact_and_lightstones',
                label: 'Artifacts and Lightstones (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Artifact and Lightstone choices',
                maxLength: 2000,
                required: true,
                getValue: (g) => g.artifact_and_lightstones || ''
            },
            {
                id: 'reforge_stones',
                label: 'Reforge Stones (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your reforge stone choices...',
                maxLength: 2000,
                required: true,
                getValue: (g) => g.reforge_stones || ''
            },
            {
                id: 'skill_info',
                label: 'Skills (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Locked skills, BSR skills, Quickslot skills, Rebams',
                maxLength: 2000,
                required: true,
                getValue: (g) => g.skill_info || ''
            },
            {
                id: 'reliable_ccs',
                label: 'Reliable CCs (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'CCs you can safely use (one per line)',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.reliable_ccs?.join('\n') || ''
            }
        ],
        // PvP Step 5: Movement, Combat
        pvp_5: [
            {
                id: 'movementExample',
                label: 'Movement Example (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe movement patterns, rotations, positioning...',
                maxLength: 2000,
                required: true,
                getValue: (g) => g.movementExample || ''
            },
            {
                id: 'movementVideo',
                label: 'Movement Video (optional)',
                style: TextInputStyle.Short,
                placeholder: 'YouTube link or GIF link',
                maxLength: 500,
                required: false,
                getValue: (g) => g.movementVideo || ''
            },
            {
                id: 'pvpCombo',
                label: 'PvP Combo Example (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your main PvP combos...',
                maxLength: 2000,
                required: true,
                getValue: (g) => g.pvpCombo || ''
            },
            {
                id: 'combatVideo',
                label: 'Combat Video (optional)',
                style: TextInputStyle.Short,
                placeholder: 'YouTube link or GIF link',
                maxLength: 500,
                required: false,
                getValue: (g) => g.combatVideo || ''
            }
        ],
        // PvE Step 1: Description, Pros, Cons, Crystals
        pve_1: [
            {
                id: 'description',
                label: 'Guide Description',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your build and playstyle...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.description || ''
            },
            {
                id: 'pros',
                label: 'Pros (one per line)',
                style: TextInputStyle.Paragraph,
                placeholder: 'High damage\nGood mobility\nFast clear speed...',
                maxLength: 500,
                required: true,
                getValue: (g) => g.pros?.join('\n') || ''
            },
            {
                id: 'cons',
                label: 'Cons (one per line)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Resource management\nLimited AoE\nRequires high APM...',
                maxLength: 500,
                required: true,
                getValue: (g) => g.cons?.join('\n') || ''
            },
            {
                id: 'crystalsImgur',
                label: 'Crystals Imgur Link (required)',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png',
                maxLength: 500,
                required: true,
                getValue: (g) => g.crystalsImgur || ''
            },
            ...(isBotOwner ? [{
                id: 'discord_id',
                label: 'Submit for User (Discord ID - Optional)',
                style: TextInputStyle.Short,
                placeholder: 'Leave empty to submit as yourself, or enter Discord user ID',
                maxLength: 20,
                required: false,
                getValue: (g) => g.submittedById === g.actualSubmitterId ? '' : g.submittedById || ''
            }] : [])
        ],
        // PvE Step 2: Addons, Movement, Combos
        pve_2: [
            {
                id: 'addonsImgur',
                label: 'Addons Imgur Link (required)',
                style: TextInputStyle.Short,
                placeholder: 'https://i.imgur.com/example.png',
                maxLength: 500,
                required: true,
                getValue: (g) => g.addonsImgur || ''
            },
            {
                id: 'movementExample',
                label: 'Movement Example (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your rotation and movement patterns...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.movementExample || ''
            },
            {
                id: 'movementVideo',
                label: 'Movement Video (optional)',
                style: TextInputStyle.Short,
                placeholder: 'YouTube link or GIF link',
                maxLength: 500,
                required: false,
                getValue: (g) => g.movementVideo || ''
            },
            {
                id: 'pveCombo',
                label: 'PvE Combo Example (required)',
                style: TextInputStyle.Paragraph,
                placeholder: 'Describe your main grinding combos...',
                maxLength: 1000,
                required: true,
                getValue: (g) => g.pveCombo || ''
            }
        ]
    };

    const configKey = `${guideType.toLowerCase()}_${stepNumber}`;
    const config = stepConfigs[configKey];
    
    if (!config) {
        console.warn(`No field configuration found for ${configKey}`);
        return [];
    }

    // Build TextInputBuilder objects from config
    return config.map(fieldConfig => {
        const input = new TextInputBuilder()
            .setCustomId(fieldConfig.id)
            .setLabel(fieldConfig.label)
            .setStyle(fieldConfig.style)
            .setPlaceholder(fieldConfig.placeholder)
            .setMaxLength(fieldConfig.maxLength)
            .setRequired(fieldConfig.required);

        // Set value if guide data is provided
        if (guide && Object.keys(guide).length > 0) {
            const value = fieldConfig.getValue(guide);
            if (value) {
                input.setValue(value);
            }
        }

        return input;
    });
}

module.exports = {
    getStepFields
};
