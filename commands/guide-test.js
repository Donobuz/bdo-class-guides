const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { saveGuideData } = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide-test')
        .setDescription('Create a test PvP Archer guide with predefined values'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.user.id;
            const username = interaction.user.username;

            // Create test guide data
            const testGuideData = {
                className: 'archer',
                guideType: 'pvp',
                spec: 'awakening',
                submittedById: userId,
                submittedBy: username,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                description: 'This is a test guide for Archer PvP Awakening. High mobility ranged class with excellent kiting potential.',
                pros: [
                    'Excellent range and mobility',
                    'High burst damage',
                    'Good CC chains',
                    'Strong in 1v1 scenarios'
                ],
                cons: [
                    'Squishy and easily punished',
                    'Requires good positioning',
                    'High skill ceiling',
                    'Struggles in close combat'
                ],
                crystalsT1Capped: 'https://i.imgur.com/test-t1-capped.png',
                crystalsT2Capped: 'https://i.imgur.com/test-t2-capped.png',
                crystalsUncapped: 'https://i.imgur.com/test-uncapped.png',
                addonsImgur: 'https://i.imgur.com/testaddons.png',
                artifactsImgur: 'https://i.imgur.com/testartifacts.png',
                lightstoneImgur: 'https://i.imgur.com/testlightstone.png',
                reasoning: 'This build focuses on maximizing burst damage while maintaining mobility.',
                movementExample: 'W+F for gap close, Q for damage, Shift+RMB for range poke',
                pvpCombo: 'Q → Shift+RMB → Shift+F → RMB → W+F',
                movementVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                combatVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                createdAt: new Date().toISOString()
            };

            // Save the guide
            await saveGuideData(testGuideData);

            await interaction.editReply({
                content: `Test guide created successfully!\n\n` +
                        `**Class:** Archer\n` +
                        `**Type:** PvP\n` +
                        `**Spec:** Awakening\n` +
                        `**Submitted By:** ${username}\n\n` +
                        `You can view it with \`/guide class:Archer type:PvP\``
            });

        } catch (error) {
            console.error('Error creating test guide:', error);
            await interaction.editReply({
                content: 'An error occurred while creating the test guide.'
            });
        }
    }
};
