const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('./config.json')

const commands = [{
    name: 'lb',
    description: 'Shows the leaderboard'
},
{
    name : 'search',
    description : "Search for a song",
    options : [
        {
            name : "song",
            description : "Song title to search",
            type : 3,
            required : true
        }
    ]
},
{
    "name": "clb",
    "type": 1,
    "description": "Get leaderboard for a chart",
    "options": [
        {
            "name": "mid",
            "description": "Music ID of the chart",
            "type": 4,
            "required": true,
        },
        {
            "name": "diff",
            "description": "Difficulty of the chart (3 letters)",
            "type": 3,
            "required": true,
            "choices": [
                {
                    "name": "NOV",
                    "value": "NOV"
                },
                {
                    "name": "ADV",
                    "value": "ADV"
                },
                {
                    "name": "EXH",
                    "value": "EXH"
                },
                {
                    "name": "MXM",
                    "value": "MXM"
                }
            ]
        }
    ]
}]

const rest = new REST({ version: '9' }).setToken(config.discord_token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.discord_clientid),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();