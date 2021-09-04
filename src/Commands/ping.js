const Command = require('../Structures/Command.js');

module.exports = new Command({
    name: "ping",
    description: "testing command",

    async run(interaction) {
        await interaction.reply(`${interaction.client.getWordLanguage("eng","ping")}: ${interaction.client.ws.ping} ms.`);
    }

})