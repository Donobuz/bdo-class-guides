/**
 * Integration tests for guide viewing flow
 * Tests /guide command execution and embed building
 */

const { saveGuideData, loadAllGuidesForClassType, deleteGuide } = require('../../utils/dataManager');
const { createSavedGuideEmbed } = require('../../utils/embedBuilder');
const guideCommand = require('../../commands/guide');
const fs = require('fs').promises;
const path = require('path');

describe('Guide Viewing Flow', () => {
    const testUserId = '999888777666555444';
    const testGuildId = '817261341765140500';
    const testUsername = 'TestUser';
    
    let testGuideData;

    beforeAll(async () => {
        // Create test guide data
        testGuideData = {
            className: 'warrior',
            guideType: 'pvp',
            spec: 'awakening',
            submittedById: testUserId,
            submittedBy: testUsername,
            guildId: testGuildId,
            guildName: 'Test Guild',
            description: 'Test warrior PvP guide',
            pros: ['High damage', 'Good sustain', 'Strong in 1v1'],
            cons: ['Low mobility', 'Predictable', 'Weak to range'],
            crystalsT1Capped: 'https://i.imgur.com/test1.png',
            crystalsT2Capped: 'https://i.imgur.com/test2.png',
            crystalsUncapped: 'https://i.imgur.com/test3.png',
            addonsImgur: 'https://i.imgur.com/addons.png',
            artifactsImgur: 'https://i.imgur.com/artifacts.png',
            lightstoneImgur: 'https://i.imgur.com/lightstone.png',
            reasoning: 'This build focuses on burst damage',
            movementExample: 'W+F for gap close',
            pvpCombo: 'Q → Shift+RMB → W+F',
            movementVideo: 'https://www.youtube.com/watch?v=test',
            combatVideo: 'https://www.youtube.com/watch?v=test2',
            createdAt: new Date().toISOString()
        };

        // Save the test guide
        await saveGuideData(testGuideData);
    });

    afterAll(async () => {
        // Clean up test guide
        const guidesDir = path.join(__dirname, '../../guides/warrior');
        await fs.rm(guidesDir, { recursive: true, force: true });
    });

    describe('Guide Loading', () => {
        test('should load guides for specific class and type', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            
            expect(guides).toBeDefined();
            expect(Array.isArray(guides)).toBe(true);
            expect(guides.length).toBeGreaterThan(0);
            
            const guide = guides[0];
            expect(guide.className).toBe('warrior');
            expect(guide.guideType).toBe('pvp');
        });

        test('should return empty array for non-existent class/type', async () => {
            const guides = await loadAllGuidesForClassType('nonexistent', 'pvp');
            
            expect(guides).toBeDefined();
            expect(Array.isArray(guides)).toBe(true);
            expect(guides.length).toBe(0);
        });

        test('should load guide with all expected fields', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            expect(guide.description).toBe('Test warrior PvP guide');
            expect(guide.pros).toEqual(['High damage', 'Good sustain', 'Strong in 1v1']);
            expect(guide.cons).toEqual(['Low mobility', 'Predictable', 'Weak to range']);
            expect(guide.crystalsT1Capped).toBe('https://i.imgur.com/test1.png');
            expect(guide.movementVideo).toBe('https://www.youtube.com/watch?v=test');
        });
    });

    describe('Embed Building', () => {
        test('should create embed with correct title', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            const embeds = createSavedGuideEmbed(guide);
            
            expect(embeds).toBeDefined();
            expect(Array.isArray(embeds)).toBe(true);
            expect(embeds.length).toBeGreaterThan(0);
            
            const mainEmbed = embeds[0];
            // Title format is: "Warrior Awakening - PVP" (spec first, then type)
            expect(mainEmbed.data.title).toBe('Warrior Awakening - PVP');
        });

        test('should include description in embed', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            const embeds = createSavedGuideEmbed(guide);
            const mainEmbed = embeds[0];
            
            expect(mainEmbed.data.description).toContain('Test warrior PvP guide');
        });

        test('should include pros and cons fields', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            const embeds = createSavedGuideEmbed(guide);
            const mainEmbed = embeds[0];
            
            const prosField = mainEmbed.data.fields.find(f => f.name === 'Pros');
            const consField = mainEmbed.data.fields.find(f => f.name === 'Cons');
            
            expect(prosField).toBeDefined();
            expect(consField).toBeDefined();
            expect(prosField.value).toContain('High damage');
            expect(consField.value).toContain('Low mobility');
        });

        test('should include image links in embeds', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            const embeds = createSavedGuideEmbed(guide);
            
            // Check that embeds contain image URLs
            const embedsJson = JSON.stringify(embeds);
            expect(embedsJson).toContain('https://i.imgur.com/test1.png');
            expect(embedsJson).toContain('https://i.imgur.com/addons.png');
        });

        test('should include video links in embeds', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const guide = guides[0];
            
            const embeds = createSavedGuideEmbed(guide);
            const embedsJson = JSON.stringify(embeds);
            
            expect(embedsJson).toContain('youtube.com');
        });
    });

    describe('Command Execution Simulation', () => {
        test('should execute /guide command successfully', async () => {
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'type') return 'pvp';
                        if (key === 'class') return 'warrior';
                        return null;
                    })
                },
                reply: jest.fn(),
                guild: {
                    id: testGuildId,
                    name: 'Test Guild'
                },
                user: {
                    id: testUserId,
                    username: testUsername
                }
            };

            await guideCommand.execute(mockInteraction);

            // Should have called reply (either with guide or selection menu)
            expect(mockInteraction.reply).toHaveBeenCalled();
        });

        test('should handle no guides found scenario', async () => {
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'type') return 'pve';
                        if (key === 'class') return 'warrior';
                        return null;
                    })
                },
                reply: jest.fn(),
                guild: {
                    id: testGuildId
                },
                user: {
                    id: testUserId
                }
            };

            await guideCommand.execute(mockInteraction);

            // Should reply with "no guides found" message
            expect(mockInteraction.reply).toHaveBeenCalled();
            const replyCall = mockInteraction.reply.mock.calls[0][0];
            expect(replyCall.content).toContain('no');
            expect(replyCall.content.toLowerCase()).toContain('guide');
        });
    });

    describe('Spec Filtering', () => {
        test('should filter guides by awakening spec', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const awakeningGuides = guides.filter(g => g.spec === 'awakening');
            
            expect(awakeningGuides.length).toBeGreaterThan(0);
            awakeningGuides.forEach(guide => {
                expect(guide.spec).toBe('awakening');
            });
        });

        test('should handle succession spec filter', async () => {
            const guides = await loadAllGuidesForClassType('warrior', 'pvp');
            const successionGuides = guides.filter(g => g.spec === 'succession');
            
            // May be empty, but should be an array
            expect(Array.isArray(successionGuides)).toBe(true);
        });
    });
});
