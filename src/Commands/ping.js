const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping command!'),
    async execute(interaction) {
        try {
            const exampleEmbed = new Discord.MessageEmbed({
                title: `${interaction.client.getWordLanguage("eng", "ping")}: `,
                description: `${interaction.client.ws.ping} ms`,
                type: 'rich',
                hexColor: '0xe1143d',
            });
            await interaction.reply({ embeds: [exampleEmbed] });
        } catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            errorLog.warn(error.message, { 'command_name': interaction.commandName });
        }
    }
}