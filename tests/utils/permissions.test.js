/**
 * Tests for permissions utility functions
 */

const { 
    isBotOwner, 
    hasGuidePermission, 
    isGuideAdmin, 
    canModifyGuide 
} = require('../../utils/permissions');

// Helper function to create mock member with roles
function createMockMember(roleIds = [], guildId = '817261341765140500') {
    const cache = new Map();
    roleIds.forEach(id => {
        cache.set(id, { id });
    });
    
    // Add some() method to mimic Discord.js Collection
    cache.some = function(callback) {
        for (let [key, value] of this) {
            if (callback(value)) return true;
        }
        return false;
    };
    
    return {
        guild: { id: guildId },
        roles: { cache }
    };
}

describe('Permission System Tests', () => {
    describe('isBotOwner()', () => {
        test('should return true for bot owner ID', () => {
            expect(isBotOwner('143215050444767232')).toBe(true);
        });

        test('should return false for non-bot owner ID', () => {
            expect(isBotOwner('999999999999999999')).toBe(false);
        });

        test('should return false for undefined', () => {
            expect(isBotOwner(undefined)).toBe(false);
        });

        test('should return false for null', () => {
            expect(isBotOwner(null)).toBe(false);
        });
    });

    describe('hasGuidePermission()', () => {
        test('should return true if user has creator role', async () => {
            const member = createMockMember(['1187559949971243028']); // Actual creator role ID
            const result = await hasGuidePermission(member);
            expect(result).toBe(true);
        });

        test('should return true if user has admin role', async () => {
            const member = createMockMember(['1084007168652615690']); // Actual admin role ID
            const result = await hasGuidePermission(member);
            expect(result).toBe(true);
        });

        test('should return false if user has no guide roles', async () => {
            const member = createMockMember(['9999999999999999999']); // Random role, not a guide role
            const result = await hasGuidePermission(member);
            expect(result).toBe(false);
        });

        test('should return false if setup is not complete', async () => {
            const member = createMockMember(['1187559949971243028'], '000000000000000000'); // Server not set up
            const result = await hasGuidePermission(member);
            expect(result).toBe(false);
        });
    });

    describe('isGuideAdmin()', () => {
        test('should return true if user has admin role', async () => {
            const member = createMockMember(['1084007168652615690']); // Actual admin role ID
            const result = await isGuideAdmin(member);
            expect(result).toBe(true);
        });

        test('should return false if user only has creator role', async () => {
            const member = createMockMember(['1187559949971243028']); // Creator role, not admin
            const result = await isGuideAdmin(member);
            expect(result).toBe(false);
        });

        test('should return false if user has no guide roles', async () => {
            const member = createMockMember([]); // No roles
            const result = await isGuideAdmin(member);
            expect(result).toBe(false);
        });
    });

    describe('canModifyGuide()', () => {
        test('should allow guide owner to modify their own guide', async () => {
            const mockMember = {
                user: { id: '127964448345423873' },
                guild: { id: '817261341765140500' },
                roles: { cache: new Map() }
            };

            const mockGuide = {
                submittedById: '127964448345423873',
                guildId: '817261341765140500',
                guildName: 'OMNI'
            };

            const result = await canModifyGuide(mockMember, mockGuide);
            expect(result.allowed).toBe(true);
        });

        test('should allow bot owner to modify any guide', async () => {
            const mockMember = {
                user: { id: '143215050444767232' },
                guild: { id: '817261341765140500' },
                roles: { cache: new Map() }
            };

            const mockGuide = {
                submittedById: '127964448345423873',
                guildId: '817261341765140500',
                guildName: 'OMNI'
            };

            const result = await canModifyGuide(mockMember, mockGuide);
            expect(result.allowed).toBe(true);
        });

        test('should allow guide admin to modify guides from same server', async () => {
            const mockMember = createMockMember(['1084007168652615690']); // Actual admin role
            mockMember.user = { id: '999999999999999999' };

            const mockGuide = {
                submittedById: '127964448345423873',
                guildId: '817261341765140500',
                guildName: 'OMNI'
            };

            const result = await canModifyGuide(mockMember, mockGuide);
            expect(result.allowed).toBe(true);
        });

        test('should deny guide admin from modifying guides from different server', async () => {
            const mockMember = createMockMember(['1084007168652615690']); // Actual admin role
            mockMember.user = { id: '999999999999999999' };

            const mockGuide = {
                submittedById: '127964448345423873',
                guildId: '000000000000000000',
                guildName: 'Different Server'
            };

            const result = await canModifyGuide(mockMember, mockGuide);
            expect(result.allowed).toBe(false);
            expect(result.errorMessage).toContain('Different Server');
        });

        test('should deny regular user from modifying others guides', async () => {
            const mockMember = createMockMember([]); // No guide roles
            mockMember.user = { id: '999999999999999999' };

            const mockGuide = {
                submittedById: '127964448345423873',
                guildId: '817261341765140500',
                guildName: 'OMNI'
            };

            const result = await canModifyGuide(mockMember, mockGuide);
            expect(result.allowed).toBe(false);
            expect(result.errorMessage).toContain('your own guides');
        });
    });
});
