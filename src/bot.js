const {Client, Intents} = require('discord.js');
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]});
const fs = require('fs');
require('dotenv').config()

fs.readdirSync("./src/")
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} ID -> [${client.user.id}]`);
});

client.on("messageCreate", message => {
    if (!message.content.startsWith(process.env.PREFIX)) return;
    message.reply("got prefix");
});

client.login(process.env.TOKEN)

