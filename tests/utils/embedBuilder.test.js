/**
 * Tests for embedBuilder URL validation
 */

const { createSavedGuideEmbed } = require('../../utils/embedBuilder');

describe('Embed Builder Tests', () => {
    describe('URL Validation in Embeds', () => {
        test('should include valid image URLs in embeds', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test guide',
                pros: ['High damage'],
                cons: ['Squishy'],
                crystalsT1Capped: 'https://i.imgur.com/valid.png',
                addonsImgur: 'https://i.imgur.com/addons.png',
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            expect(embeds.length).toBeGreaterThan(1);
            
            // Check if crystal embed was created
            const crystalEmbed = embeds.find(e => e.data.title === 'Crystals - T1 Capped');
            expect(crystalEmbed).toBeDefined();
            expect(crystalEmbed.data.image.url).toBe('https://i.imgur.com/valid.png');
        });

        test('should skip invalid image URLs', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test guide',
                pros: ['High damage'],
                cons: ['Squishy'],
                crystalsT1Capped: '123', // Invalid URL
                addonsImgur: 'not a url', // Invalid URL
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            
            // Should only have main embed, no image embeds
            const crystalEmbed = embeds.find(e => e.data.title === 'Crystals - T1 Capped');
            expect(crystalEmbed).toBeUndefined();
        });

        test('should handle YouTube URLs correctly', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test guide',
                pros: ['High damage'],
                cons: ['Squishy'],
                movementVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            
            // Check if video embed was created with correct title
            const videoEmbed = embeds.find(e => e.data.title === 'Gameplay Video');
            expect(videoEmbed).toBeDefined();
        });

        test('should skip empty or null URLs', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test guide',
                pros: ['High damage'],
                cons: ['Squishy'],
                crystalsT1Capped: '',
                addonsImgur: null,
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            
            // Should only have main embed
            expect(embeds.length).toBe(1);
        });
    });

    describe('Embed Structure', () => {
        test('should always include main embed with guide info', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test description',
                pros: ['Pro 1', 'Pro 2'],
                cons: ['Con 1', 'Con 2'],
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            
            expect(embeds.length).toBeGreaterThanOrEqual(1);
            expect(embeds[0].data.title).toContain('Wizard');
            expect(embeds[0].data.description).toBe('Test description');
        });

        test('should format pros and cons correctly', () => {
            const guideData = {
                className: 'Wizard',
                guideType: 'pvp',
                spec: 'succession',
                description: 'Test guide',
                pros: ['High damage', 'Good mobility'],
                cons: ['Low defense', 'Complex combos'],
                submittedBy: 'TestUser',
                createdAt: new Date().toISOString()
            };

            const embeds = createSavedGuideEmbed(guideData);
            const mainEmbed = embeds[0];
            
            const prosField = mainEmbed.data.fields.find(f => f.name === 'Pros');
            const consField = mainEmbed.data.fields.find(f => f.name === 'Cons');
            
            expect(prosField).toBeDefined();
            expect(consField).toBeDefined();
            expect(prosField.value).toContain('High damage');
            expect(consField.value).toContain('Low defense');
        });
    });
});
