const { Client, Collection, Events, GatewayIntentBits, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Import configuration and utilities
const config = require('./config.js');
const { loadAllGuidesForClassType } = require('./utils/dataManager');
const { connectToDatabase } = require('./utils/database');

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

const GUIDE_COMMANDS_WITH_AUTOCOMPLETE = ['guide', 'guide-create', 'guide-delete', 'guide-edit'];
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
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

/**
 * Retrieves a list of classes that have at least one guide from MongoDB
 * @returns {Promise<string[]>} Array of class names that have guides
 */
async function getClassesWithGuides() {
    try {
        const { getDatabase } = require('./utils/database');
        const db = getDatabase();
        const guides = db.collection('guides');
        
        // Get distinct class names from the guides collection
        const classNames = await guides.distinct('className');
        
        // Filter to only include valid BDO classes (case-insensitive)
        const validClasses = classNames
            .map(name => {
                // Find matching BDO class (case-insensitive)
                return BDO_CLASSES.find(bdoClass => 
                    bdoClass.toLowerCase() === name.toLowerCase()
                );
            })
            .filter(name => name !== undefined);
        
        return validClasses.length > 0 ? validClasses : BDO_CLASSES;
    } catch (error) {
        console.error('Error fetching classes from database:', error);
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
    
    // Check if user already has a guide for this class/type/spec
    try {
        const existingGuides = await loadAllGuidesForClassType(className, guideType);
        const userGuide = existingGuides.find(guide => 
            guide.submittedById === userId && guide.spec === spec
        );
        
        if (userGuide) {
            // Redirect to edit mode
            return await GuideEditHandler.startEditing(interaction, className, guideType, spec, userId);
        }
    } catch (error) {
        console.error('Error checking existing guide for spec:', error);
        // Continue with creation if there's an error checking (fail gracefully)
    }
    
    // No existing guide - show guide creation modal using dynamic handler
    await GuideCreateHandler.showStepModal(interaction, className, guideType, spec, 1);
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
        .setTitle('Deletion Cancelled')
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
            flags: MessageFlags.Ephemeral
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
                classesToShow = await getClassesWithGuides();
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
        if (!handled) handled = await GuideDeleteHandler.handleDeleteGuideSelect(interaction);
        
        if (!handled) {
            console.log(`Unhandled string select menu: ${customId}`);
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        let handled = false;
        
        // Try guide view handlers first
        if (!handled) handled = await GuideViewHandler.handleSpecSelect(interaction);
        
        // Try custom handlers
        if (!handled) handled = await handleSpecSelectionButton(interaction);
        if (!handled) handled = await handleCancelDelete(interaction);
        
        // Try handler methods - Both use generic handlers now (handles all steps dynamically)
        if (!handled) handled = await GuideCreateHandler.handleContinueStep(interaction);
        if (!handled) handled = await GuideCreateHandler.handleRedoStep(interaction);
        if (!handled) handled = await GuideCreateHandler.handleCancel(interaction);
        
        if (!handled) handled = await GuideEditHandler.handleContinueStep(interaction);
        if (!handled) handled = await GuideEditHandler.handleRedoStep(interaction);
        if (!handled) handled = await GuideEditHandler.handleCancelEdit(interaction);
        if (!handled) handled = await GuideEditHandler.handleQuickEdit(interaction);
        
        // Delete handlers
        if (!handled) handled = await GuideDeleteHandler.handleConfirmDelete(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleDeleteAllUserGuides(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleGoBackToGuideSelect(interaction);
        if (!handled) handled = await GuideDeleteHandler.handleGoBackToUserSelect(interaction);
        
        if (!handled) {
            console.log(`Unhandled button interaction: ${interaction.customId}`);
        }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        let handled = false;
        
        // Try each handler - Both use generic handlers now (handles all steps dynamically)
        if (!handled) handled = await GuideEditHandler.handleStepSubmission(interaction);
        if (!handled) handled = await GuideCreateHandler.handleStepSubmission(interaction);
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

// Connect to MongoDB and then log in to Discord
async function start() {
    try {
        await connectToDatabase();
        await client.login(config.token);
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

start();
