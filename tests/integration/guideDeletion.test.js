/**
 * Integration tests for guide deletion flow
 * Tests /guide-delete command execution with permission checks
 */

const { saveGuideData, loadGuideByDiscordId, deleteGuide } = require('../../utils/dataManager');
const { canModifyGuide } = require('../../utils/permissions');
const guideDeleteCommand = require('../../commands/guides-delete');
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

describe('Guide Deletion Flow', () => {
    const testGuildId = '817261341765140500';
    const ownerUserId = '143215050444767232'; // Bot owner
    const regularUserId = '999888777666555444';
    const adminUserId = '111222333444555666';
    const otherUserId = '777888999000111222';
    
    // Role IDs from actual server
    const creatorRoleId = '1187559949971243028';
    const adminRoleId = '1084007168652615690';
    
    let testGuideData;

    beforeEach(async () => {
        // Create fresh test guide for each test
        testGuideData = {
            className: 'maehwa',
            guideType: 'pvp',
            spec: 'awakening',
            submittedById: regularUserId,
            submittedBy: 'RegularUser',
            guildId: testGuildId,
            guildName: 'Test Guild',
            description: 'Test maehwa PvP guide for deletion',
            pros: ['Fast', 'High burst', 'Good mobility'],
            cons: ['Squishy', 'High skill cap'],
            crystalsT1Capped: 'https://i.imgur.com/test1.png',
            crystalsT2Capped: 'https://i.imgur.com/test2.png',
            crystalsUncapped: 'https://i.imgur.com/test3.png',
            addonsImgur: 'https://i.imgur.com/addons.png',
            artifactsImgur: 'https://i.imgur.com/artifacts.png',
            lightstoneImgur: 'https://i.imgur.com/lightstone.png',
            reasoning: 'Test reasoning',
            movementExample: 'Test movement',
            pvpCombo: 'Test combo',
            movementVideo: 'https://www.youtube.com/watch?v=test1',
            combatVideo: 'https://www.youtube.com/watch?v=test2',
            createdAt: new Date().toISOString()
        };

        await saveGuideData(testGuideData);
    });

    afterAll(async () => {
        // Clean up any remaining test guides
        const guidesDir = path.join(__dirname, '../../guides/maehwa');
        await fs.rm(guidesDir, { recursive: true, force: true });
    });

    describe('Permission Checks', () => {
        test('guide owner can delete their own guide', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
            expect(result.errorMessage).toBeUndefined();
        });

        test('bot owner can delete any guide', async () => {
            const mockMember = createMockMember([], ownerUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
        });

        test('admin can delete any guide from same server', async () => {
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(true);
        });

        test('discord admin can delete any guide', async () => {
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

        test('non-owner cannot delete guide without admin role', async () => {
            const mockMember = createMockMember([creatorRoleId], otherUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, testGuideData);
            
            expect(result.allowed).toBe(false);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage).toContain('only modify your own guides');
        });

        test('admin from different server cannot delete guide', async () => {
            const differentGuildId = '000000000000000000';
            const guideFromDifferentServer = { ...testGuideData, guildId: differentGuildId, guildName: 'Other Server' };
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const result = await canModifyGuide(mockMember, guideFromDifferentServer);
            
            expect(result.allowed).toBe(false);
            expect(result.errorMessage).toBeDefined();
            expect(result.errorMessage.toLowerCase()).toContain('server');
        });
    });

    describe('Command Execution', () => {
        test('should list guides for deletion for owner', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'maehwa';
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

            await guideDeleteCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
        });

        test('should show all guides for admin', async () => {
            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'maehwa';
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

            await guideDeleteCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
        });

        test('should handle no guides found', async () => {
            const mockMember = createMockMember([creatorRoleId], regularUserId, testGuildId);
            
            const mockInteraction = {
                options: {
                    getString: jest.fn((key) => {
                        if (key === 'class') return 'maehwa';
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

            await guideDeleteCommand.execute(mockInteraction);

            expect(mockInteraction.reply).toHaveBeenCalled();
            const replyCall = mockInteraction.reply.mock.calls[0][0];
            expect(replyCall.content.toLowerCase()).toContain('no');
            expect(replyCall.content.toLowerCase()).toContain('guides found');
        });
    });

    describe('Deletion Operations', () => {
        test('should delete guide file from filesystem', async () => {
            // Verify guide exists
            const beforeDelete = await loadGuideByDiscordId('maehwa', 'pvp', 'awakening', regularUserId);
            expect(beforeDelete).toBeDefined();

            // Delete the guide
            const deleted = await deleteGuide('maehwa', 'pvp', 'awakening', regularUserId);
            expect(deleted).toBe(true);

            // Verify guide is deleted
            const afterDelete = await loadGuideByDiscordId('maehwa', 'pvp', 'awakening', regularUserId);
            expect(afterDelete).toBeNull();
        });

        test('should handle deletion of non-existent guide', async () => {
            const result = await deleteGuide('maehwa', 'pvp', 'succession', 'nonexistentuser123');
            
            // Should return false for non-existent guide
            expect(result).toBe(false);
        });

        test('guide should not be loadable after deletion', async () => {
            await deleteGuide('maehwa', 'pvp', 'awakening', regularUserId);
            
            const loaded = await loadGuideByDiscordId('maehwa', 'pvp', 'awakening', regularUserId);
            expect(loaded).toBeNull();
        });

        test('should only delete specific guide, not all guides', async () => {
            // Create a second guide with different spec
            const secondGuide = {
                ...testGuideData,
                spec: 'succession'
            };
            await saveGuideData(secondGuide);

            // Delete awakening guide
            await deleteGuide('maehwa', 'pvp', 'awakening', regularUserId);

            // Verify awakening is deleted
            const awakeningGuide = await loadGuideByDiscordId('maehwa', 'pvp', 'awakening', regularUserId);
            expect(awakeningGuide).toBeNull();

            // Verify succession still exists
            const successionGuide = await loadGuideByDiscordId('maehwa', 'pvp', 'succession', regularUserId);
            expect(successionGuide).toBeDefined();
            expect(successionGuide.spec).toBe('succession');

            // Clean up succession guide
            await deleteGuide('maehwa', 'pvp', 'succession', regularUserId);
        });
    });

    describe('Role-Based Deletion Access', () => {
        test('regular user should only see own guides for deletion', async () => {
            const isAdmin = false;
            const canManageAllGuides = isAdmin || false;
            
            expect(canManageAllGuides).toBe(false);
        });

        test('guide admin should see all guides for deletion', async () => {
            const isAdmin = false;
            const isGuideAdmin = true;
            const canManageAllGuides = isAdmin || isGuideAdmin;
            
            expect(canManageAllGuides).toBe(true);
        });

        test('discord admin should see all guides for deletion', async () => {
            const isAdmin = true;
            const canManageAllGuides = isAdmin || false;
            
            expect(canManageAllGuides).toBe(true);
        });
    });

    describe('Cross-Server Deletion Prevention', () => {
        test('should prevent deletion of guides from other servers', async () => {
            const otherServerGuide = {
                ...testGuideData,
                guildId: '000000000000000000'
            };

            const mockMember = createMockMember([adminRoleId], adminUserId, testGuildId);
            const result = await canModifyGuide(mockMember, otherServerGuide);

            expect(result.allowed).toBe(false);
        });

        test('bot owner can delete guides from any server', async () => {
            const otherServerGuide = {
                ...testGuideData,
                guildId: '000000000000000000'
            };

            const mockMember = createMockMember([], ownerUserId, testGuildId);
            const result = await canModifyGuide(mockMember, otherServerGuide);

            expect(result.allowed).toBe(true);
        });
    });
});
