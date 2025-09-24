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

module.exports = {
    isAscensionClass,
    getAvailableSpecs,
    getPrimarySpec
};
