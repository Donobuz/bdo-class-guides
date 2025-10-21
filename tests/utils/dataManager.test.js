/**
 * Tests for dataManager functions
 */

const fs = require('fs').promises;
const path = require('path');
const { saveGuideData, loadAllGuides } = require('../../utils/dataManager');

describe('Data Manager Tests', () => {
    const guidesDir = path.join(__dirname, '..', '..', 'guides');
    const testClasses = ['testclass', 'newclass', 'warrior'];
    
    afterAll(async () => {
        // Clean up all test guide files created during tests
        for (const className of testClasses) {
            const classDir = path.join(guidesDir, className);
            try {
                await fs.rm(classDir, { recursive: true, force: true });
            } catch (error) {
                // Ignore errors if directory doesn't exist
            }
        }
    });

    describe('saveGuideData()', () => {
        test('should save guide data correctly', async () => {
            // Use a unique ID based on timestamp to avoid conflicts with previous runs
            const uniqueId = `${Date.now()}`;
            const guideData = {
                className: 'TestClass',
                guideType: 'pvp',
                spec: 'succession',
                submittedById: uniqueId,
                description: 'Test guide',
                pros: ['Pro 1'],
                cons: ['Con 1']
            };

            const result = await saveGuideData(guideData);
            
            expect(result.success).toBe(true);
            expect(result.wasUpdate).toBe(false);
        });

        test('should detect updates to existing guides', async () => {
            const guideData = {
                className: 'TestClass',
                guideType: 'pvp',
                spec: 'succession',
                submittedById: Date.now().toString(),
                description: 'Initial guide',
                pros: ['Pro 1'],
                cons: ['Con 1']
            };

            // First save - should be new
            const firstSave = await saveGuideData(guideData);
            expect(firstSave.success).toBe(true);
            expect(firstSave.wasUpdate).toBe(false);

            // Second save - should be update
            guideData.description = 'Updated guide';
            const secondSave = await saveGuideData(guideData);
            
            expect(secondSave.success).toBe(true);
            expect(secondSave.wasUpdate).toBe(true);
        });

        test('should create proper directory structure', async () => {
            const guideData = {
                className: 'NewClass',
                guideType: 'pve',
                spec: 'awakening',
                submittedById: '987654321',
                description: 'New class guide'
            };

            await saveGuideData(guideData);
            
            const guidePath = path.join(
                __dirname, '..', '..', 'guides',
                'newclass', 'pve', 'awakening', '987654321.json'
            );
            
            const fileExists = await fs.access(guidePath)
                .then(() => true)
                .catch(() => false);
            
            expect(fileExists).toBe(true);
        });
    });

    describe('loadAllGuides()', () => {
        test('should load guides for a class/type/spec', async () => {
            const guides = await loadAllGuides('Wizard', 'pvp', 'succession');
            
            expect(Array.isArray(guides)).toBe(true);
        });

        test('should return empty array for non-existent class', async () => {
            const guides = await loadAllGuides('NonExistentClass', 'pvp', 'succession');
            
            expect(guides).toEqual([]);
        });

        test('should load guides for specific class/type/spec', async () => {
            // First create a guide
            const testGuide = {
                className: 'warrior',
                guideType: 'pvp',
                spec: 'succession',
                submittedById: '111222333',
                description: 'Test guide for loading'
            };
            await saveGuideData(testGuide);

            // Then load and verify
            const guides = await loadAllGuides('warrior', 'pvp', 'succession');
            
            expect(Array.isArray(guides)).toBe(true);
            // The guide we created should be in the list
            expect(guides.some(g => g.submittedById === '111222333')).toBe(true);
        });
    });

    describe('Guide Data Integrity', () => {
        test('saved guide should have all required fields', async () => {
            const guideData = {
                className: 'Warrior',
                guideType: 'pvp',
                spec: 'succession',
                submittedById: '111222333',
                submittedBy: 'TestUser',
                description: 'Warrior guide',
                pros: ['High defense', 'Good CC'],
                cons: ['Slow mobility'],
                createdAt: new Date().toISOString()
            };

            await saveGuideData(guideData);
            const guides = await loadAllGuides('Warrior', 'pvp', 'succession');
            const savedGuide = guides.find(g => g.submittedById === '111222333');
            
            expect(savedGuide).toBeDefined();
            expect(savedGuide.className).toBe('Warrior');
            expect(savedGuide.guideType).toBe('pvp');
            expect(savedGuide.spec).toBe('succession');
            expect(savedGuide.submittedById).toBe('111222333');
            expect(savedGuide.description).toBe('Warrior guide');
        });
    });
});
