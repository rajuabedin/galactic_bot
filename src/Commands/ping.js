const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping command!'),
        
    async execute(interaction, userInfo) {
        try {
            await interaction.reply({ embeds: [interaction.client.redEmbed(`Pong ${interaction.client.ws.ping} ms!`)] });
        } catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}