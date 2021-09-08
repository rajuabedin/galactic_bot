const Command = require('../Structures/Command.js');
const Discord = require('discord.js');

module.exports = new Command({
    name: "ping",
    description: "Ping command",

    async run(interaction) {
        const exampleEmbed = new Discord.MessageEmbed({
            title: `${interaction.client.getWordLanguage("eng","ping")}: `,
            description: `${interaction.client.ws.ping} ms`,
            type: 'rich',
            hexColor: '0xe1143d',
          });
        await interaction.reply({ embeds: [exampleEmbed] });
    }

})