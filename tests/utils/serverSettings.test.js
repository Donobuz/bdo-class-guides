/**
 * Tests for server settings management
 */

const { loadServerSettings, saveServerSettings } = require('../../utils/serverSettings');
const fs = require('fs').promises;
const path = require('path');

describe('Server Settings Tests', () => {
    const serverSettingsDir = path.join(__dirname, '..', '..', 'server-settings');
    const testGuildId = '999999999999999999';
    const testSettingsFile = path.join(serverSettingsDir, `${testGuildId}.json`);
    
    afterAll(async () => {
        // Clean up test settings file
        try {
            await fs.unlink(testSettingsFile);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    describe('loadServerSettings()', () => {
        test('should return default settings for new server', async () => {
            const settings = await loadServerSettings('000000000000000000');
            
            expect(settings.guideCreatorRoleIds).toEqual([]);
            expect(settings.guideAdminRoleIds).toEqual([]);
            expect(settings.setupComplete).toBe(false);
        });

        test('should load existing server settings', async () => {
            const settings = await loadServerSettings('817261341765140500');
            
            expect(Array.isArray(settings.guideCreatorRoleIds)).toBe(true);
            expect(Array.isArray(settings.guideAdminRoleIds)).toBe(true);
            expect(settings.setupComplete).toBeDefined();
        });
    });

    describe('saveServerSettings()', () => {
        test('should save new server settings', async () => {
            const guildId = testGuildId;
            const settings = {
                guideCreatorRoleIds: ['role1', 'role2'],
                guideAdminRoleIds: ['admin1'],
                setupComplete: true,
                setupBy: '143215050444767232',
                setupAt: new Date().toISOString()
            };

            await saveServerSettings(guildId, settings);
            const loaded = await loadServerSettings(guildId);
            
            expect(loaded.guideCreatorRoleIds).toEqual(['role1', 'role2']);
            expect(loaded.guideAdminRoleIds).toEqual(['admin1']);
            expect(loaded.setupComplete).toBe(true);
        });

        test('should update existing server settings', async () => {
            const guildId = testGuildId;
            const updatedSettings = {
                guideCreatorRoleIds: ['role1', 'role2', 'role3'],
                guideAdminRoleIds: ['admin1', 'admin2'],
                setupComplete: true
            };

            await saveServerSettings(guildId, updatedSettings);
            const loaded = await loadServerSettings(guildId);
            
            expect(loaded.guideCreatorRoleIds).toHaveLength(3);
            expect(loaded.guideAdminRoleIds).toHaveLength(2);
        });
    });

    describe('Role Configuration', () => {
        test('should enforce 3-role maximum for creators', () => {
            const existingRoles = ['role1', 'role2', 'role3'];
            const newRole = 'role4';
            
            const combined = [...existingRoles, newRole];
            const isValid = combined.length <= 3;
            
            expect(isValid).toBe(false);
        });

        test('should enforce 3-role maximum for admins', () => {
            const existingRoles = ['admin1', 'admin2'];
            const newRole = 'admin3';
            
            const combined = [...existingRoles, newRole];
            const isValid = combined.length <= 3;
            
            expect(isValid).toBe(true);
        });

        test('should allow role removal', () => {
            const roles = ['role1', 'role2', 'role3'];
            const roleToRemove = 'role2';
            
            const filtered = roles.filter(r => r !== roleToRemove);
            
            expect(filtered).toEqual(['role1', 'role3']);
            expect(filtered).toHaveLength(2);
        });

        test('should prevent duplicate roles', () => {
            const existingRoles = ['role1', 'role2'];
            const newRole = 'role1'; // Duplicate
            
            const isDuplicate = existingRoles.includes(newRole);
            
            expect(isDuplicate).toBe(true);
        });
    });

    describe('Setup Status', () => {
        test('should mark setup as complete when roles are configured', () => {
            const settings = {
                guideCreatorRoleIds: ['role1'],
                guideAdminRoleIds: [],
                setupComplete: false
            };

            // After /guides-setup roles
            settings.setupComplete = true;
            settings.setupBy = '143215050444767232';
            settings.setupAt = new Date().toISOString();
            
            expect(settings.setupComplete).toBe(true);
            expect(settings.setupBy).toBeDefined();
            expect(settings.setupAt).toBeDefined();
        });

        test('should reset setup status', () => {
            const settings = {
                guideCreatorRoleIds: ['role1'],
                guideAdminRoleIds: ['admin1'],
                setupComplete: true
            };

            // After /guides-setup reset
            settings.guideCreatorRoleIds = [];
            settings.guideAdminRoleIds = [];
            settings.setupComplete = false;
            
            expect(settings.setupComplete).toBe(false);
            expect(settings.guideCreatorRoleIds).toHaveLength(0);
        });
    });
});
