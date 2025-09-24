const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Import configuration and utilities
const config = require('./config.js');
const { loadAllGuidesForClassType } = require('./utils/dataManager');

// Import handlers
const GuideViewHandler = require('./commands/handlers/guide-view-handler');
const GuideCreateHandler = require('./commands/handlers/guide-create-handler');
const GuideEditHandler = require('./commands/handlers/guide-edit-handler');
const GuideDeleteHandler = require('./commands/handlers/guide-delete-handler');

// Constants
const BDO_CLASSES = [
    'Guardian', 'Warrior', 'Ninja', 'Kunoichi', 'Sorceress', 'Wizard', 'Witch',
    'Ranger', 'Berserker', 'Tamer', 'Valkyrie', 'Musa', 'Maehwa', 'Dark Knight',
    'Striker', 'Mystic', 'Lahn', 'Archer', 'Shai', 'Hashashin', 'Nova', 'Sage',
    'Corsair', 'Drakania', 'Scholar', 'Wukong', 'Deadeye'
];

const GUIDE_COMMANDS_WITH_AUTOCOMPLETE = ['guide', 'create-guide', 'guide-delete', 'guide-edit'];
const COMMANDS_REQUIRING_EXISTING_GUIDES = ['guide', 'guide-delete', 'guide-edit'];

/**
 * Loads and registers all commands from the commands directory
 * @param {Client} client - Discord client instance
 */
function loadCommands(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

/**
 * Gets classes that have existing guides
 * @returns {string[]} Array of class names with guides
 */
function getClassesWithGuides() {
    const guidesDir = path.join(__dirname, 'guides');
    
    try {
        if (!fs.existsSync(guidesDir)) {
            return [];
        }

        const classesWithGuides = [];
        const classFolders = fs.readdirSync(guidesDir)
            .filter(item => fs.statSync(path.join(guidesDir, item)).isDirectory());
        
        for (const className of classFolders) {
            const classDir = path.join(guidesDir, className);
            let hasGuides = false;
            
            // Check both pvp and pve folders
            for (const guideType of ['pvp', 'pve']) {
                const typeDir = path.join(classDir, guideType);
                if (fs.existsSync(typeDir)) {
                    // Check both succession and awakening folders
                    for (const spec of ['succession', 'awakening']) {
                        const specDir = path.join(typeDir, spec);
                        if (fs.existsSync(specDir)) {
                            const guideFiles = fs.readdirSync(specDir).filter(f => f.endsWith('.json'));
                            if (guideFiles.length > 0) {
                                hasGuides = true;
                                break;
                            }
                        }
                    }
                    if (hasGuides) break;
                }
            }
            
            if (hasGuides) {
                classesWithGuides.push(className.charAt(0).toUpperCase() + className.slice(1));
            }
        }
        
        return BDO_CLASSES.filter(className => classesWithGuides.includes(className));
    } catch (error) {
        console.error('Error reading guides directory:', error);
        return BDO_CLASSES; // Fallback to all classes if error
    }
}

/**
 * Handles spec selection button interactions for guide creation
 * @param {ButtonInteraction} interaction - Discord button interaction
 * @returns {Promise<boolean>} Whether the interaction was handled
 */
async function handleSpecSelectionButton(interaction) {
    const { customId } = interaction;
    
    if (!customId.startsWith('guide_') || customId.split('_').length !== 4) {
        return false;
    }
    
    const [, className, guideType, spec] = customId.split('_');
    const userId = interaction.user.id;
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    // Check if regular member already has a guide for this class/type/spec
    if (!isAdmin) {
        try {
            const existingGuides = await loadAllGuidesForClassType(className, guideType);
            const userGuide = existingGuides.find(guide => 
                guide.submittedById === userId && guide.spec === spec
            );
            
            if (userGuide) {
                await interaction.reply({
                    content: `❌ You already have a ${className} ${guideType.toUpperCase()} ${spec.charAt(0).toUpperCase() + spec.slice(1)} guide. Regular members can only have one guide per class/type/spec combination.`,
                    ephemeral: true
                });
                return true;
            }
        } catch (error) {
            console.error('Error checking existing guide for spec:', error);
            // Continue with creation if there's an error checking (fail gracefully)
        }
    }
    
    // Show guide creation modal
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const totalSteps = guideType === 'pvp' ? '4' : '2';
    const modal = new ModalBuilder()
        .setCustomId(`submit_guide_step1_${className}_${guideType}_${spec}`)
        .setTitle(`${className.charAt(0).toUpperCase() + className.slice(1)} ${guideType.toUpperCase()} Guide - Step 1/${totalSteps}`);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Guide Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your build and playstyle...')
        .setRequired(true)
        .setMaxLength(1000);

    const prosInput = new TextInputBuilder()
        .setCustomId('pros')
        .setLabel('Pros (one per line)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('High damage\nGood mobility\nStrong in 1v1...')
        .setRequired(true)
        .setMaxLength(500);

    const consInput = new TextInputBuilder()
        .setCustomId('cons')
        .setLabel('Cons (one per line)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Resource management\nVulnerable to grabs\nHigh skill requirement...')
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(prosInput),
        new ActionRowBuilder().addComponents(consInput)
    );

    await interaction.showModal(modal);
    return true;
}

/**
 * Handles the cancel delete button interaction
 * @param {ButtonInteraction} interaction - Discord button interaction
 * @returns {Promise<boolean>} Whether the interaction was handled
 */
async function handleCancelDelete(interaction) {
    if (interaction.customId !== 'cancel_delete') {
        return false;
    }
    
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
        .setTitle('❌ Deletion Cancelled')
        .setDescription('No guides were deleted.')
        .setColor(0x808080)
        .setTimestamp();
    
    await interaction.update({
        embeds: [embed],
        components: []
    });
    
    return true;
}

/**
 * Handles command execution errors
 * @param {CommandInteraction} interaction - Discord command interaction
 * @param {Error} error - The error that occurred
 */
async function handleCommandError(interaction, error) {
    console.error('Error executing command:', error);
    
    try {
        const errorMessage = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(errorMessage);
        } else if (!interaction.replied) {
            await interaction.followUp(errorMessage);
        }
    } catch (replyError) {
        console.error('Error sending error message:', replyError);
    }
}

// Create a new client instance
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

// Create a collection for commands
client.commands = new Collection();

// Load all commands
loadCommands(client);

// When the client is ready, run this code
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log(`Bot is in ${c.guilds.cache.size} guilds`);
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            await handleCommandError(interaction, error);
        }
    }

    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
        const { commandName, options } = interaction;
        
        if (GUIDE_COMMANDS_WITH_AUTOCOMPLETE.includes(commandName)) {
            const focusedValue = options.getFocused();
            
            // Determine which classes to show based on command type
            let classesToShow = BDO_CLASSES;
            if (COMMANDS_REQUIRING_EXISTING_GUIDES.includes(commandName)) {
                classesToShow = getClassesWithGuides();
            }
            
            // Filter classes based on user input
            const filtered = classesToShow.filter(choice => 
                choice.toLowerCase().includes(focusedValue.toLowerCase())
            );
            
            await interaction.respond(
                filtered.slice(0, 25).map(choice => ({ name: choice, value: choice }))
            );
        }
    }

    // Handle string select menu interactions
    if (interaction.isStringSelectMenu()) {
        const { customId } = interaction;
        let handled = false;
        
        // Try each handler
        if (!handled) handled = await GuideViewHandler.handleGuideSelect(interaction);
        if (!handled) handled = await GuideViewHandler.handleSpecSelect(interaction);
        if (!handled) handled = await GuideViewHandler.handleGuideView(interaction);
        if (!handled) handled = await GuideEditHandler.handleEditUserSelect(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleDeleteUserSelect(interaction);
        
        if (!handled) {
            console.log(`Unhandled string select menu: ${customId}`);
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        let handled = false;
        
        // Try custom handlers first
        if (!handled) handled = await handleSpecSelectionButton(interaction);
        if (!handled) handled = await handleCancelDelete(interaction);
        
        // Try handler methods
        if (!handled) handled = await GuideCreateHandler.handleContinueStep2(interaction);
        if (!handled) handled = await GuideCreateHandler.handleContinueStep3(interaction);
        if (!handled) handled = await GuideCreateHandler.handleContinueStep4(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleConfirmDelete(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleDeleteAllUserGuides(interaction);
        
        if (!handled) {
            console.log(`Unhandled button interaction: ${interaction.customId}`);
        }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        let handled = false;
        
        // Try each handler
        if (!handled) handled = await GuideEditHandler.handleEditModal1(interaction);
        if (!handled) handled = await GuideEditHandler.handleEditModal2(interaction);
        if (!handled) handled = await GuideCreateHandler.handleStep1Submission(interaction);
        if (!handled) handled = await GuideCreateHandler.handleStep2Submission(interaction);
        if (!handled) handled = await GuideCreateHandler.handleStep3Submission(interaction);
        if (!handled) handled = await GuideCreateHandler.handleStep4Submission(interaction);
        if (!handled) handled = await GuideCreateHandler.handleLegacySubmission(interaction);
        
        if (!handled) {
            console.log(`Unhandled modal submission: ${customId}`);
        }
    }
});

// Handle errors
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Log in to Discord with your client's token
client.login(config.token);
