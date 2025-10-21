require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    mongodbUri: process.env.MONGODB_URI,
    
    // Classes that use Ascension instead of Succession
    ascensionClasses: [
        'archer',
        'scholar',
        'shai',
        'wukong',
        'deadeye',
        // Add more ascension classes here as they are released
    ],
    
    colors: {
        primary: 0x2B2D31,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        guardian: 0x9B59B6,
        warrior: 0xE74C3C,
        ranger: 0x2ECC71,
        sorceress: 0x8E44AD,
        berserker: 0xE67E22,
        tamer: 0xF39C12,
        musa: 0x3498DB,
        maehwa: 0xE91E63,
        valkyrie: 0xF1C40F,
        kunoichi: 0x34495E,
        ninja: 0x2C3E50,
        wizard: 0x3498DB,
        witch: 0x9B59B6,
        darkknight: 0x2C3E50,
        striker: 0xE74C3C,
        mystic: 0x3498DB,
        lahn: 0xE91E63,
        archer: 0x27AE60,
        shai: 0xF39C12,
        hashashin: 0xE67E22,
        nova: 0x5DADE2,
        sage: 0x48C9B0,
        corsair: 0x2980B9,
        drakania: 0xC0392B,
        scholar: 0x6C5CE7
    }
};
