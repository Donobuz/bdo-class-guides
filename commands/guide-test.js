const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { saveGuideData } = require('../utils/dataManager');
const { isBotOwner } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guide-test')
        .setDescription('Create a test PvP Archer guide with predefined values'),

    async execute(interaction) {
        try {
            // Check if user is bot owner
            if (!isBotOwner(interaction.user.id)) {
                return await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.user.id;
            const username = interaction.user.username;

            // Create test guide data with ALL PvP fields
            const testGuideData = {
                // Basic Info
                className: 'archer',
                guideType: 'pvp',
                spec: 'awakening',
                submittedById: userId,
                submittedBy: username,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                createdAt: new Date().toISOString(),
                
                // Step 1: Description, Pros, Cons
                description: 'This is a comprehensive test guide for Archer PvP Awakening. High mobility ranged class with excellent kiting potential and strong burst damage. Excels at maintaining distance while dealing significant damage through quick combos.',
                pros: [
                    'Excellent range and mobility',
                    'High burst damage potential',
                    'Good CC chains and catch potential',
                    'Strong in 1v1 scenarios',
                    'Can kite effectively'
                ],
                cons: [
                    'Very squishy and easily punished',
                    'Requires good positioning awareness',
                    'High skill ceiling',
                    'Struggles in close combat',
                    'Resource management is critical'
                ],
                
                // Step 2: Large Scale, Small Scale, Positioning
                largeScaleRole: 'In large scale PvP (Node Wars, Siege, Red Battlefield), Archer excels as a backline damage dealer. Focus on picking off isolated targets and applying pressure from maximum range. Coordinate with your guild to focus fire on priority targets. Use your mobility to reposition quickly when enemies push your lines.',
                smallScaleRole: 'In 1v1 and small skirmishes, Archer shines through superior kiting and spacing. Maintain optimal range while landing CC chains. Use your mobility skills to create distance when needed. Strong in Arsha duels with proper combo execution.',
                positioning: 'Always maintain maximum effective range from enemies. Position yourself with escape routes in mind. In Node Wars, stay behind your frontline but within range to apply pressure. In 1v1, use terrain and spacing to your advantage. Never let enemies close the gap without a mobility skill ready.',
                positioningImage: 'https://i.imgur.com/positioning-example.png',
                
                // Step 3: Crystals and Addons
                crystalsT1Capped: 'https://i.imgur.com/test-t1-capped.png',
                crystalsT2Capped: 'https://i.imgur.com/test-t2-capped.png',
                crystalsUncapped: 'https://i.imgur.com/test-uncapped.png',
                addonsImgur: 'https://i.imgur.com/testaddons.png',
                
                // Step 4: Artifacts and Lightstones
                artifactsImgur: 'https://i.imgur.com/testartifacts.png',
                lightstoneImgur: 'https://i.imgur.com/testlightstone.png',
                reasoning: 'This build focuses on maximizing burst damage while maintaining mobility. Artifact choices prioritize damage output and survivability. Lightstone set provides additional AP and critical damage for one-shot potential while offering defensive stats to survive counterattacks.',
                
                // Step 5: Movement and Combat
                movementExample: 'Primary movement: W+F for gap close, Shift+Space for quick repositioning, S+RMB for backward movement while attacking. Chain movements together for maximum mobility. Use Q cancel into movement skills for faster repositioning.',
                movementVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                pvpCombo: 'Main Combo: Q (Spirit Asylum) → Shift+RMB (Charging Wind) → Shift+F (Spirit\'s Shackles) → RMB (Arrow Explosion) → W+F (Charging Kick) for gap close. Alternative: F (Vine Knot) → LMB+RMB (Nature\'s Tremble) → Shift+Q (Flow: Winged Strike) → W+LMB (Glide) for sustained damage.',
                combatVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
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
