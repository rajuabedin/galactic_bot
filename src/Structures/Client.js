const Discord = require('discord.js');
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
        this.guildId = "735090312694988801";
        this.languages = {};
        this.wait = require('util').promisify(setTimeout);


    }

    start(token) {
        const commands = [];

        // LOAD COMMANDS
        fs.readdirSync("./Commands").filter(file => file.endsWith(".js")).forEach(file => {
            /**
             *@type {Command}
             */
            const command = require(`../Commands/${file}`);
            console.log(`Command ${command.name} added!`)
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
            console.log(`Event ${event.event} loaded!`)
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

}

module.exports = Client;