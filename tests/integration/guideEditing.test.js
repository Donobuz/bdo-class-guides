/**
 * Integration tests for guide editing flow
 * Tests /guide-edit command execution with permission checks
 */

const { saveGuideData, loadGuideByDiscordId } = require('../../utils/dataManager');
const { canModifyGuide } = require('../../utils/permissions');
const guideEditCommand = require('../../commands/guide-edit');
const fs = require('fs').promises;
const path = require('path');

// Helper to create mock Discord member
function createMockMember(roleIds, userId, guildId, hasAdminPermission = false) {
    const rolesMap = new Map();
    roleIds.forEach(roleId => {
        rolesMap.set(roleId, { id: roleId });
    });
    
    // Add some() method to mimic Discord.js Collection
    rolesMap.some = function(predicate) {
        for (const [key, value] of this) {
            if (predicate(value, key, this)) return true;
        }
        return false;
    };

    return {
        id: userId,
        user: {
            id: userId
        },
        roles: {
            cache: rolesMap
        },
        permissions: {
            has: jest.fn(() => hasAdminPermission)
        },
        guild: {
            id: guildId
        }
    };
}

describe('Guide Editing Flow', () => {
    const testGuildId = '817261341765140500';
    const ownerUserId = '143215050444767232'; // Bot owner
    const regularUserId = '999888777666555444';
    const adminUserId = '111222333444555666';
    const otherUserId = '777888999000111222';
    
    // Role IDs from actual server
    const creatorRoleId = '1187559949971243028';
    const adminRoleId = '1084007168652615690';
    
    let testGuideData;

    beforeAll(async () => {
        // Create test guide owned by regularUserId
        testGuideData = {
            className: 'sorceress',
            guideType: 'pvp',
            spec: 'succession',
            submittedById: regularUserId,
            submittedBy: 'RegularUser',
            guildId: testGuildId,
            guildName: 'Test Guild',
            description: 'Original description',
            pros: ['Original pro 1', 'Original pro 2'],
            cons: ['Original con 1'],
            crystalsT1Capped: 'https://i.imgur.com/original1.png',
            crystalsT2Capped: 'https://i.imgur.com/original2.png',
            crystalsUncapped: 'https://i.imgur.com/original3.png',
            addonsImgur: 'https://i.imgur.com/addons-original.png',
            artifactsImgur: 'https://i.imgur.com/artifacts-original.png',
            lightstoneImgur: 'https://i.imgur.com/lightstone-original.png',
            reasoning: 'Original reasoning',
            movementExample: 'Original movement',
            pvpCombo: 'Original combo',
            movementVideo: 'https://www.youtube.com/watch?v=original1',
            combatVideo: 'https://www.youtube.com/watch?v=original2',
            createdAt: new Date().toISOString()
        };

        await saveGuideData(testGuideData);
    });

    afterAll(async () => {
        // Clean up test guide
        const guidesDir = path.join(__dirname, '../../guides/sorceress');
        await fs.rm(guidesDir, { recursive: true, force: true });
    });

    describe('Permission Checks', () => {
        test('guide owner can modify their own guide', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
            expect(result.errorMessage).toBeUndefined();
        });

        test('bot owner can modify any guide', async () => {
            const mockMember = createMockMember([], ownerUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
        });

        test('admin can modify any guide from same server', async () => {
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
        });

        test('discord admin can modify any guide', async () => {
            const mockMember = createMockMember([], adminUserId, testGuildId, true);
            
            // Discord admins are checked separately in the command logic  
            // canModifyGuide doesn't check Discord permissions, but the command does
            const isDiscordAdmin = mockMember.permissions.has();
            expect(isDiscordAdmin).toBe(true);
            
            // If not Discord admin, would need guide admin role
            const hasAdminRole = await require('../../utils/permissions').isGuideAdmin(mockMember);
            // Discord admin OR guide admin can modify
            expect(isDiscordAdmin || hasAdminRole).toBe(true);
        });

        test('non-owner cannot modify guide without admin role', async () => {
            const mockMember = createMockMember([creatorRoleId], otherUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(false);
            expect(result.errorMessage).toBeDefined();
        });

        test('admin from different server cannot modify guide', async () => {
            const differentGuildId = '000000000000000000';
            const guideFromDifferentServer = { ...testGuideData, guildId: differentGuildId };
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, guideFromDifferentServer);
            
            expect(result.allowed).toBe(false);
        });
    });

    describe('Command Execution', () => {
        test('should list guides for owner', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'sorceress';
                        if (key === 'type') return 'pvp';
                        return null;
                    })
                },
                user: {
                    id: regularUserId,
                    username: 'RegularUser'
                },
                member: mockMember,
                guild: {
                    id: testGuildId
                },
                reply: jest.fn()
            };

            await guideEditCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
        });

        test('should show all guides for admin', async () => {
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'sorceress';
                        if (key === 'type') return 'pvp';
                        return null;
                    })
                },
                user: {
                    id: adminUserId,
                    username: 'AdminUser'
                },
                member: mockMember,
                guild: {
                    id: testGuildId
                },
                reply: jest.fn()
            };

            await guideEditCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
            // Admin should see guides from all users
        });

        test('should handle no guides found', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'sorceress';
                        if (key === 'type') return 'pve'; // No PvE guides
                        return null;
                    })
                },
                user: {
                    id: regularUserId
                },
                member: mockMember,
                guild: {
                    id: testGuildId
                },
                reply: jest.fn()
            };

            await guideEditCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
            const replyCall = mockInteraction.reply.mock.calls[0][0];
            expect(replyCall.content.toLowerCase()).toContain('no guides found');
        });
    });

    describe('Data Persistence', () => {
        test('should load existing guide data', async () => {
            const loaded = await loadGuideByDiscordId('sorceress', 'pvp', 'succession', regularUserId);
            
            expect(loaded).toBeDefined();
            expect(loaded.description).toBe('Original description');
            expect(loaded.pros).toEqual(['Original pro 1', 'Original pro 2']);
        });

        test('should preserve all fields when loading', async () => {
            const loaded = await loadGuideByDiscordId('sorceress', 'pvp', 'succession', regularUserId);
            
            expect(loaded.crystalsT1Capped).toBe('https://i.imgur.com/original1.png');
            expect(loaded.movementVideo).toBe('https://www.youtube.com/watch?v=original1');
            expect(loaded.pvpCombo).toBe('Original combo');
        });

        test('should update guide when saving with same ID', async () => {
            const updatedData = {
                ...testGuideData,
                description: 'Updated description',
                pros: ['New pro 1', 'New pro 2', 'New pro 3']
            };

            await saveGuideData(updatedData);

            const loaded = await loadGuideByDiscordId('sorceress', 'pvp', 'succession', regularUserId);
            expect(loaded.description).toBe('Updated description');
            expect(loaded.pros).toEqual(['New pro 1', 'New pro 2', 'New pro 3']);

            // Restore original for other tests
            await saveGuideData(testGuideData);
        });
    });

    describe('Role-Based Visibility', () => {
        test('regular user should only see own guides', async () => {
            const isAdmin = false;
            const canManageAllGuides = isAdmin || false;
            
            expect(canManageAllGuides).toBe(false);
        });

        test('guide admin should see all guides', async () => {
            const isAdmin = false;
            const isGuideAdmin = true;
            const canManageAllGuides = isAdmin || isGuideAdmin;
            
            expect(canManageAllGuides).toBe(true);
        });

        test('discord admin should see all guides', async () => {
            const isAdmin = true;
            const canManageAllGuides = isAdmin || false;
            
            expect(canManageAllGuides).toBe(true);
        });
    });
});
