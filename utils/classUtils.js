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

module.exports = {
    isAscensionClass,
    getAvailableSpecs,
    getPrimarySpec,
    formatSpecForDisplay,
    createGuideTitle
};
