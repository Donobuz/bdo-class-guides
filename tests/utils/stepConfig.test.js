/**
 * Optional tests for stepConfig.js
 * These test static configuration, which has low value but shows completeness
 */

const { getStepFields } = require('../../utils/stepConfig');

describe('Step Configuration Tests (Optional)', () => {
    describe('PvP Step 1 - Description, Pros, Cons', () => {
        test('should return 3 base fields for regular users', () => {
            const fields = getStepFields('pvp', 1, {}, false);
            
            expect(fields).toHaveLength(3);
            expect(fields[0].data.custom_id).toBe('description');
            expect(fields[1].data.custom_id).toBe('pros');
            expect(fields[2].data.custom_id).toBe('cons');
        });

        test('should return 4 fields when bot owner (includes discord_id)', () => {
            const fields = getStepFields('pvp', 1, {}, true);
            
            expect(fields).toHaveLength(4);
            expect(fields[3].data.custom_id).toBe('discord_id');
            expect(fields[3].data.required).toBe(false);
        });

        test('should pre-fill description from existing guide', () => {
            const existingGuide = {
                description: 'Test description',
                pros: ['Pro 1', 'Pro 2'],
                cons: ['Con 1']
            };
            
            const fields = getStepFields('pvp', 1, existingGuide, false);
            
            expect(fields[0].data.value).toBe('Test description');
            expect(fields[1].data.value).toBe('Pro 1\nPro 2');
            expect(fields[2].data.value).toBe('Con 1');
        });

        test('should handle empty guide data gracefully', () => {
            const fields = getStepFields('pvp', 1, {}, false);
            
            // Should not have values set
            expect(fields[0].data.value).toBeUndefined();
            expect(fields[1].data.value).toBeUndefined();
            expect(fields[2].data.value).toBeUndefined();
        });
    });

    describe('PvP Step 2 - Roles and Positioning', () => {
        test('should return correct fields', () => {
            const fields = getStepFields('pvp', 2, {}, false);
            
            expect(fields).toHaveLength(4);
            expect(fields[0].data.custom_id).toBe('largeScaleRole'); // Order: large first, then small
            expect(fields[1].data.custom_id).toBe('smallScaleRole');
            expect(fields[2].data.custom_id).toBe('positioning');
            expect(fields[3].data.custom_id).toBe('positioningImage');
        });

        test('should mark positioningImage as optional', () => {
            const fields = getStepFields('pvp', 2, {}, false);
            
            expect(fields[3].data.required).toBe(false);
        });
    });

    describe('PvP Step 3 - Crystals and Addons', () => {
        test('should return fields for all crystal tiers', () => {
            const fields = getStepFields('pvp', 3, {}, false);
            
            expect(fields).toHaveLength(4);
            expect(fields[0].data.custom_id).toBe('crystalsT1Capped');
            expect(fields[1].data.custom_id).toBe('crystalsT2Capped');
            expect(fields[2].data.custom_id).toBe('crystalsUncapped');
            expect(fields[3].data.custom_id).toBe('addonsImgur');
        });

        test('all fields should be required', () => {
            const fields = getStepFields('pvp', 3, {}, false);
            
            fields.forEach(field => {
                expect(field.data.required).toBe(true);
            });
        });
    });

    describe('PvP Step 4 - Artifacts and Lightstones', () => {
        test('should return artifact and lightstone fields', () => {
            const fields = getStepFields('pvp', 4, {}, false);
            
            expect(fields).toHaveLength(3);
            expect(fields[0].data.custom_id).toBe('artifactsImgur');
            expect(fields[1].data.custom_id).toBe('lightstoneImgur');
            expect(fields[2].data.custom_id).toBe('reasoning');
        });
    });

    describe('PvP Step 5 - Movement and Combat', () => {
        test('should return movement and combat fields', () => {
            const fields = getStepFields('pvp', 5, {}, false);
            
            expect(fields).toHaveLength(4);
            expect(fields[0].data.custom_id).toBe('movementExample');
            expect(fields[1].data.custom_id).toBe('movementVideo');
            expect(fields[2].data.custom_id).toBe('pvpCombo');
            expect(fields[3].data.custom_id).toBe('combatVideo');
        });

        test('video fields should be optional', () => {
            const fields = getStepFields('pvp', 5, {}, false);
            
            expect(fields[1].data.required).toBe(false); // movementVideo
            expect(fields[3].data.required).toBe(false); // combatVideo
        });
    });

    describe('PvE Steps', () => {
        test('Step 1 should include crystals with discord_id option', () => {
            const fields = getStepFields('pve', 1, {}, false);
            
            expect(fields).toHaveLength(4);
            expect(fields[3].data.custom_id).toBe('crystalsImgur');
        });

        test('Step 1 should add discord_id for bot owners', () => {
            const fields = getStepFields('pve', 1, {}, true);
            
            expect(fields).toHaveLength(5);
            expect(fields[4].data.custom_id).toBe('discord_id');
        });

        test('Step 2 should include addons, movement, and combos', () => {
            const fields = getStepFields('pve', 2, {}, false);
            
            expect(fields).toHaveLength(4); // addons, movementExample, movementVideo, pveCombo
            expect(fields[0].data.custom_id).toBe('addonsImgur');
            expect(fields[1].data.custom_id).toBe('movementExample');
            expect(fields[2].data.custom_id).toBe('movementVideo');
            expect(fields[3].data.custom_id).toBe('pveCombo');
        });
    });

    describe('Case Sensitivity', () => {
        test('should handle uppercase guide types', () => {
            const fields1 = getStepFields('PVP', 1, {}, false);
            const fields2 = getStepFields('pvp', 1, {}, false);
            
            expect(fields1).toHaveLength(fields2.length);
        });

        test('should handle PvE variations', () => {
            const fields1 = getStepFields('PvE', 1, {}, false);
            const fields2 = getStepFields('pve', 1, {}, false);
            
            expect(fields1).toHaveLength(fields2.length);
        });
    });

    describe('Invalid Inputs', () => {
        test('should return empty array for invalid guide type', () => {
            const fields = getStepFields('invalid', 1, {}, false);
            
            expect(fields).toHaveLength(0);
        });

        test('should return empty array for invalid step number', () => {
            const fields = getStepFields('pvp', 99, {}, false);
            
            expect(fields).toHaveLength(0);
        });

        test('should return empty array for step 0', () => {
            const fields = getStepFields('pvp', 0, {}, false);
            
            expect(fields).toHaveLength(0);
        });
    });

    describe('Field Properties', () => {
        test('all fields should have required properties', () => {
            const fields = getStepFields('pvp', 1, {}, false);
            
            fields.forEach(field => {
                expect(field.data.custom_id).toBeDefined();
                expect(field.data.label).toBeDefined();
                expect(field.data.style).toBeDefined();
                expect(field.data.max_length).toBeDefined();
                expect(field.data.required).toBeDefined();
            });
        });

        test('text fields should have appropriate max lengths', () => {
            const fields = getStepFields('pvp', 1, {}, false);
            
            // Description should allow longer text
            expect(fields[0].data.max_length).toBe(1000);
            
            // Pros and cons should be reasonable
            expect(fields[1].data.max_length).toBe(500);
            expect(fields[2].data.max_length).toBe(500);
        });

        test('URL fields should have appropriate max lengths', () => {
            const fields = getStepFields('pvp', 3, {}, false);
            
            // Image URLs should allow reasonable length
            fields.forEach(field => {
                expect(field.data.max_length).toBeGreaterThanOrEqual(500);
            });
        });
    });
});
