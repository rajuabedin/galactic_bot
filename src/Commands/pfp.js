const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pfp')
        .setDescription('Get user pfp.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Please select a user.')
                .setRequired(true)),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            const user = interaction.options.getUser('user');
            const pfpEmbed = new MessageEmbed()
                .setColor('0x009dff')
                .setImage(user.avatarURL())
                .setAuthor(`${user.username} PFP`, interaction.client.user.avatarURL())
                .setDescription(`Download [LINK](${user.avatarURL()})`)
            await interaction.reply({ embeds: [pfpEmbed] });
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}