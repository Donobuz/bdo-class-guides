const config = require('../config.js');

/**
 * Check if a class uses Ascension instead of Succession
 * @param {string} className - The class name to check
 * @returns {boolean} - True if the class uses ascension, false otherwise
 */
function isAscensionClass(className) {
    return config.ascensionClasses.includes(className.toLowerCase());
}

/**
 * Get the available specs for a class
 * @param {string} className - The class name
 * @returns {Array} - Array of available specs ['awakening', 'succession'] (ascension classes only have awakening)
 */
function getAvailableSpecs(className) {
    // All classes have awakening, only non-ascension classes have succession
    if (isAscensionClass(className)) {
        return ['awakening']; // Ascension is saved as awakening
    }
    return ['awakening', 'succession'];
}

/**
 * Get the primary spec name for a class (awakening for ascension classes, succession for others)
 * @param {string} className - The class name
 * @returns {string} - 'awakening' for ascension classes, 'succession' for others
 */
function getPrimarySpec(className) {
    return isAscensionClass(className) ? 'awakening' : 'succession';
}

/**
 * Format a spec name for display (hide awakening for ascension classes)
 * @param {string} className - The class name
 * @param {string} spec - The spec name (awakening/succession)
 * @returns {string} - Formatted spec name or empty string for ascension awakening
 */
function formatSpecForDisplay(className, spec) {
    // For ascension classes, don't show "Awakening" in the title since they only have one spec
    if (isAscensionClass(className) && spec === 'awakening') {
        return '';
    }
    return spec.charAt(0).toUpperCase() + spec.slice(1);
}

/**
 * Create a guide title with proper spec formatting
 * @param {string} className - The class name
 * @param {string} guideType - The guide type (pve/pvp)
 * @param {string} spec - The spec name (awakening/succession)
 * @returns {string} - Formatted title
 */
function createGuideTitle(className, guideType, spec) {
    const classNameFormatted = className.charAt(0).toUpperCase() + className.slice(1);
    const guideTypeFormatted = guideType.toUpperCase();
    const specFormatted = formatSpecForDisplay(className, spec);
    
    if (specFormatted) {
        return `${classNameFormatted} ${guideTypeFormatted} - ${specFormatted}`;
    } else {
        return `${classNameFormatted} ${guideTypeFormatted} Guide`;
    }
}

// Define the complete workflow structure for each guide type
const GUIDE_WORKFLOWS = {
    pvp: [
        'description_pros_cons',            // Step 1
        'large_small_scale_roles',          // Step 2
        'addons_crystals',                  // Step 3
        'artifacts_lightstones',            // Step 4
        'movement_combat'                   // Step 5
    ],
    pve: [
        'description_pros_cons_crystals',   // Step 1
        'addons_movement_combos'            // Step 2
    ]
};

// Human-readable step names
const STEP_NAMES = {
    description_pros_cons: 'Description & Overview',
    large_small_scale_roles: 'PvP Roles',
    addons_crystals: 'Addons & Crystals',
    artifacts_lightstones: 'Artifacts & Lightstones',
    movement_combat: 'Movement & Combat',
    description_pros_cons_crystals: 'Description & Crystals',
    addons_movement_combos: 'Addons & Movement'
};

/**
 * Get the total number of steps for guide creation based on guide type
 * @param {string} guideType - The guide type (pve/pvp)
 * @returns {number} - Total number of steps (4 for PvP, 2 for PvE)
 */
function getTotalSteps(guideType) {
    const workflow = GUIDE_WORKFLOWS[guideType.toLowerCase()];
    if (!workflow) {
        console.warn(`Unknown guide type: ${guideType}, defaulting to PvE workflow`);
        return GUIDE_WORKFLOWS.pve.length;
    }
    
    return workflow.length;
}

/**
 * Get the workflow for a guide type
 * @param {string} guideType - The guide type (pve/pvp)
 * @returns {Array} - Array of workflow step names
 */
function getWorkflow(guideType) {
    const workflow = GUIDE_WORKFLOWS[guideType.toLowerCase()];
    if (!workflow) {
        console.warn(`Unknown guide type: ${guideType}, defaulting to PvE workflow`);
        return GUIDE_WORKFLOWS.pve;
    }
    return workflow;
}

/**
 * Get the human-readable name for a step
 * @param {string} guideType - The guide type (pve/pvp)
 * @param {number} stepNumber - The step number (1-indexed)
 * @returns {string} - Human-readable step name
 */
function getStepName(guideType, stepNumber) {
    const workflow = getWorkflow(guideType);
    const stepKey = workflow[stepNumber - 1]; // Convert to 0-indexed
    return STEP_NAMES[stepKey] || `Step ${stepNumber}`;
}

module.exports = {
    isAscensionClass,
    getAvailableSpecs,
    getPrimarySpec,
    formatSpecForDisplay,
    createGuideTitle,
    getTotalSteps,
    getWorkflow,
    getStepName,
    GUIDE_WORKFLOWS
};
