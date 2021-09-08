const Discord = require('discord.js');
const MessageEmbed = require('discord.js');
const Command = require('./Command.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Event = require('./Event.js');
const fs = require("fs");
require('dotenv').config();

class Client extends Discord.Client {
    constructor() {
        super({intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS]});

        /**
         *
         * @type {Discord.Collection<String, Command>}
         */
        this.commands = new Discord.Collection();
        this.prefix = process.env.PREFIX
        this.clientId = '881243621293170738';
        this.guildId = "883828008316723231";
        this.languages = {};
        this.wait = require('util').promisify(setTimeout);
        this.random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    }

    start(token) {
        const commands = [];

        // LOAD COMMANDS
        fs.readdirSync("./Commands").filter(file => file.endsWith(".js")).forEach(file => {
            /**
             *@type {Command}
             */
            const command = require(`../Commands/${file}`);
            this.commands.set(command.name, command)
            commands.push(
                { name: command.name, description: command.description}
            );
        });

        // LOAD EVENTS
        fs.readdirSync("./Events").filter(file => file.endsWith(".js")).forEach(file => {
            /**
             *@type {Event}
             */
            const event = require(`../Events/${file}`);
            this.on(event.event, event.run.bind(null, this));
        });

        // LOAD LANGUAGES
        fs.readdirSync("./Languages").filter(file => file.endsWith(".json")).forEach(file => {
            /**
             *@type {JSON}
             */
             const language = require(`../Languages/${file}`);
             const name = file.replace(".json","");
             this.addLanguage(name, language);
        });

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');
        
                await rest.put(
                    Routes.applicationGuildCommands(this.clientId, this.guildId),
                    { body: commands },
                );
        
                console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
                console.error(error);
            }
        })();

        this.login(token)
    }

    getApp (guildId) {
        const app = this.api.applications(this.user.id)
        if (guildId){
            app.guilds(guildId)
        }
        return app;
    }

    addLanguage (key, value) {
        this.languages[key] = value;
    }

    getWordLanguage (language, word) {
        return this.languages[language][word];
    }

    blueEmbed(text, tittle ="") {
        const textToEmbed = new Discord.MessageEmbed()
            .setColor('0x009dff')
            .setTitle(tittle)
            .setURL('https://obelisk.club/')
            .setDescription(text)
        return textToEmbed
    }
    
    greenEmbed(text, tittle = "") {
        const textToEmbed = new Discord.MessageEmbed()
            .setColor('0x14e188')
            .setTitle(tittle)
            .setURL('https://obelisk.club/')
            .setDescription(text)
        return textToEmbed
    }
    
    redEmbed(text, tittle = "") {
        const textToEmbed = new Discord.MessageEmbed()
            .setColor('0xe1143d')
            .setTitle(tittle)
            .setURL('https://obelisk.club/')
            .setDescription(text)
        return textToEmbed
    }
    
    yellowEmbed(text, tittle = "") {
        const textToEmbed = new Discord.MessageEmbed()
            .setColor('0xffff00')
            .setTitle(tittle)
            .setURL('https://obelisk.club/')
            .setDescription(text)
        return textToEmbed
    }
}

module.exports = Client;