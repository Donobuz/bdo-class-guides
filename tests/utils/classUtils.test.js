/**
 * Tests for classUtils functions
 */

const {
    createGuideTitle,
    isAscensionClass,
    getPrimarySpec,
    formatSpecForDisplay,
    getTotalSteps,
    getStepName
} = require('../../utils/classUtils');

describe('Class Utils Tests', () => {
    describe('createGuideTitle()', () => {
        test('should create proper title for Wizard succession PvP', () => {
            const title = createGuideTitle('Wizard', 'pvp', 'succession');
            expect(title).toBe('Wizard PVP - Succession');
        });

        test('should create proper title for Archer awakening PvE', () => {
            const title = createGuideTitle('Archer', 'pve', 'awakening');
            expect(title).toBe('Archer PVE Guide'); // Ascension class, no spec shown
        });

        test('should handle lowercase inputs', () => {
            const title = createGuideTitle('wizard', 'pvp', 'succession');
            expect(title).toBe('Wizard PVP - Succession');
        });
    });

    describe('isAscensionClass()', () => {
        test('should return true for ascension classes', () => {
            expect(isAscensionClass('Archer')).toBe(true);
            expect(isAscensionClass('Scholar')).toBe(true);
            expect(isAscensionClass('Wukong')).toBe(true);
        });

        test('should return false for regular classes', () => {
            expect(isAscensionClass('Wizard')).toBe(false);
            expect(isAscensionClass('Warrior')).toBe(false);
        });

        test('should be case-insensitive', () => {
            expect(isAscensionClass('archer')).toBe(true);
            expect(isAscensionClass('WIZARD')).toBe(false);
        });
    });

    describe('getPrimarySpec()', () => {
        test('should return succession for regular classes', () => {
            expect(getPrimarySpec('Wizard')).toBe('succession');
            expect(getPrimarySpec('Warrior')).toBe('succession');
        });

        test('should return awakening for ascension classes', () => {
            expect(getPrimarySpec('Archer')).toBe('awakening');
            expect(getPrimarySpec('Scholar')).toBe('awakening');
        });
    });

    describe('formatSpecForDisplay()', () => {
        test('should return Succession for regular class succession', () => {
            expect(formatSpecForDisplay('Wizard', 'succession')).toBe('Succession');
        });

        test('should return Awakening for regular class awakening', () => {
            expect(formatSpecForDisplay('Wizard', 'awakening')).toBe('Awakening');
        });

        test('should return empty string for ascension class awakening', () => {
            expect(formatSpecForDisplay('Archer', 'awakening')).toBe('');
        });

        test('should return Succession for ascension class succession (though not used)', () => {
            expect(formatSpecForDisplay('Archer', 'succession')).toBe('Succession');
        });
    });

    describe('getTotalSteps()', () => {
        test('should return 5 for PvP guides', () => {
            expect(getTotalSteps('pvp')).toBe(5);
        });

        test('should return 2 for PvE guides', () => {
            expect(getTotalSteps('pve')).toBe(2);
        });

        test('should return 2 (default PvE) for invalid guide type', () => {
            expect(getTotalSteps('invalid')).toBe(2);
        });
    });

    describe('getStepName()', () => {
        test('should return correct PvP step names', () => {
            expect(getStepName('pvp', 1)).toBe('Description & Overview');
            expect(getStepName('pvp', 2)).toBe('PvP Roles');
            expect(getStepName('pvp', 3)).toBe('Addons & Crystals');
            expect(getStepName('pvp', 4)).toBe('Artifacts & Lightstones');
            expect(getStepName('pvp', 5)).toBe('Movement & Combat');
        });

        test('should return correct PvE step names', () => {
            expect(getStepName('pve', 1)).toBe('Description & Crystals');
            expect(getStepName('pve', 2)).toBe('Addons & Movement');
        });

        test('should return "Step X" for invalid steps', () => {
            expect(getStepName('pvp', 99)).toBe('Step 99');
            expect(getStepName('pve', 0)).toBe('Step 0');
        });
    });
});
