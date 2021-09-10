const Discord = require('discord.js');
const MessageEmbed = require('discord.js');
const Command = require('./Command.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Event = require('./Event.js');
const mysql = require('mysql');
const fs = require("fs");
require('dotenv').config();

class Client extends Discord.Client {
    constructor() {
        super({ intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS] });

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

        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
        });

    }

    async start(token) {
        const commands = [];
        // LOAD COMMANDS
        fs.readdirSync("./Commands").filter(file => file.endsWith(".js")).forEach(file => {
            /**
             *@type {Command}
             */
            const command = require(`../Commands/${file}`);
            this.commands.set(command.data.name, command)
            commands.push(command.data.toJSON());
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
            const name = file.replace(".json", "");
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

    getApp(guildId) {
        const app = this.api.applications(this.user.id)
        if (guildId) {
            app.guilds(guildId)
        }
        return app;
    }

    addLanguage(key, value) {
        this.languages[key] = value;
    }

    getWordLanguage(language, word) {
        return this.languages[language][word];
    }

    blueEmbed(text, tittle = "") {
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


    /**
     * 
     * @param {String} user_id 
     * @returns 
     */

    async getUserAccount(user_id) {
        var result = await this.databaseSelcetData("SELECT * from users WHERE user_id = ?", [user_id]);
        return result[0];
    }


    async usePooledConnectionAsync(actionAsync) {
        const connection = await new Promise((resolve, reject) => {
            this.pool.getConnection((ex, connection) => {
                if (ex) {
                    reject(ex);
                } else {
                    resolve(connection);
                }
            });
        });
        try {
            return await actionAsync(connection);
        } finally {
            connection.release();
        }
    }

    /**
     * 
     * @param {String} query 
     * @param {Array} args 
     * @returns 
     */

    async databaseSelcetData(query, args) {
        var result = await this.usePooledConnectionAsync(async connection => {
            const rows = await new Promise((resolve, reject) => {
                connection.query(query, args, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            return rows;
        });
        return result;
    }

    /**
     * 
     * @param {String} query 
     * @param {Array} args 
     * @returns 
     */
    async databaseEditData(query, args) {
        var result = await this.usePooledConnectionAsync(async connection => {
            const rowsCount = await new Promise((resolve, reject) => {
                connection.query(query, args, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results.affectedRows);
                    }
                });
            });
            return rowsCount;
        });
        var queryCompleted = false;
        if (result > 0) {
            queryCompleted = true;
        }

        return queryCompleted;
    }

    async makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

}

module.exports = Client;