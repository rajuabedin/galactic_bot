const Event = require('../Structures/Event.js');
const Command = require('../Structures/Command.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");
require('dotenv').config()


module.exports = new Event("ready", async (client) => {
    console.log(`Logged in as ${client.user.tag} ID -> [${client.user.id}]`);

    // const commands = await client.getApp(client.guildId).commands.get();
    // console.log(commands)

    // const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

    // fs.readdirSync("./Commands").filter(file => file.endsWith(".js")).forEach(async (file) => {
    //     /**
    //      *@type {Command}
    //      */
    //     const command = require(`../Commands/${file}`);
    //     console.log(`Command ${command.name} loaded!`);
    //     await client.getApp(client.guildId).commands.post({
    //         data: {
    //             name: command.name,
    //             description: command.description,
    //         }
    //     })
    // });


});