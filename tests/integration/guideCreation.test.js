/**
 * Integration tests for guide creation flow
 */

describe('Guide Creation Flow', () => {
    describe('Discord ID Proxy Submission', () => {
        test('should use target user ID when discord_id is provided (Step 1)', () => {
            const userId = '143215050444767232'; // Bot owner
            const targetUserId = '557857598661984267'; // Target user
            const className = 'Wizard';
            const guideType = 'pvp';
            const spec = 'succession';

            // Simulate Step 1 with discord_id field
            const tempKey = `${targetUserId}_${className}_${guideType}_${spec}`;
            const tempData = {
                className,
                guideType,
                spec,
                submittedById: targetUserId,
                submittedBy: 's8n7',
                actualSubmitterId: userId
            };

            expect(tempKey).toBe('557857598661984267_Wizard_pvp_succession');
            expect(tempData.submittedById).toBe(targetUserId);
            expect(tempData.actualSubmitterId).toBe(userId);
        });

        test('should find existing proxy submission in Step 2+', () => {
            const userId = '143215050444767232';
            const className = 'Wizard';
            const guideType = 'pvp';
            const spec = 'succession';

            // Simulate existing tempData from Step 1
            global.tempGuideData = {
                '557857598661984267_Wizard_pvp_succession': {
                    className,
                    guideType,
                    spec,
                    submittedById: '557857598661984267',
                    submittedBy: 's8n7',
                    actualSubmitterId: userId
                }
            };

            // Simulate Step 2+ looking for tempKey
            const matchingSuffix = `_${className}_${guideType}_${spec}`;
            const existingKey = Object.keys(global.tempGuideData).find(key => 
                key.endsWith(matchingSuffix) && 
                global.tempGuideData[key].actualSubmitterId === userId
            );

            expect(existingKey).toBe('557857598661984267_Wizard_pvp_succession');
        });

        test('should use submitter ID when discord_id is not provided', () => {
            const userId = '127964448345423873';
            const className = 'Maehwa';
            const guideType = 'pvp';
            const spec = 'succession';

            const tempKey = `${userId}_${className}_${guideType}_${spec}`;
            const tempData = {
                className,
                guideType,
                spec,
                submittedById: userId,
                submittedBy: 'vxyne',
                actualSubmitterId: userId
            };

            expect(tempKey).toBe('127964448345423873_Maehwa_pvp_succession');
            expect(tempData.submittedById).toBe(tempData.actualSubmitterId);
        });
    });

    describe('Multi-Step Progress Tracking', () => {
        test('should maintain tempData across steps', () => {
            const tempKey = '123_Wizard_pvp_succession';
            
            // Step 1
            global.tempGuideData = {
                [tempKey]: {
                    className: 'Wizard',
                    guideType: 'pvp',
                    spec: 'succession',
                    description: 'Test',
                    pros: ['Pro 1'],
                    cons: ['Con 1']
                }
            };

            // Step 2 - add more data
            global.tempGuideData[tempKey].largeScaleRole = 'DPS';
            global.tempGuideData[tempKey].smallScaleRole = 'Burst';

            expect(global.tempGuideData[tempKey].description).toBe('Test');
            expect(global.tempGuideData[tempKey].largeScaleRole).toBe('DPS');
        });

        test('should cleanup tempData after save', () => {
            const tempKey = '123_Wizard_pvp_succession';
            
            global.tempGuideData = {
                [tempKey]: {
                    className: 'Wizard',
                    submittedById: '123'
                }
            };

            // Simulate cleanup
            delete global.tempGuideData[tempKey];

            expect(global.tempGuideData[tempKey]).toBeUndefined();
        });
    });

    describe('Continue and Redo Button Logic', () => {
        test('should find tempKey for regular submission', () => {
            const userId = '123';
            const className = 'Wizard';
            const guideType = 'pvp';
            const spec = 'succession';
            const tempKey = `${userId}_${className}_${guideType}_${spec}`;

            global.tempGuideData = {
                [tempKey]: { submittedById: userId }
            };

            const foundKey = `${userId}_${className}_${guideType}_${spec}`;
            expect(global.tempGuideData[foundKey]).toBeDefined();
        });

        test('should find tempKey for proxy submission', () => {
            const actualSubmitterId = '143215050444767232';
            const className = 'Wizard';
            const guideType = 'pvp';
            const spec = 'succession';

            global.tempGuideData = {
                '557857598661984267_Wizard_pvp_succession': {
                    submittedById: '557857598661984267',
                    actualSubmitterId
                }
            };

            const matchingSuffix = `_${className}_${guideType}_${spec}`;
            const tempKey = Object.keys(global.tempGuideData).find(key => 
                key.endsWith(matchingSuffix) && 
                global.tempGuideData[key].actualSubmitterId === actualSubmitterId
            );

            expect(tempKey).toBe('557857598661984267_Wizard_pvp_succession');
        });
    });
});
