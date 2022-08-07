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
            let msg = await interaction.deferReply({ fetchReply: true });

            const user = interaction.options.getUser('user');
            const pfpEmbed = new MessageEmbed()
                .setColor('0x009dff')
                .setImage(user.avatarURL())
                .setAuthor({ name: `${user.username} PFP`, iconURL: interaction.client.user.avatarURL() })
                .setDescription(`Download [LINK](${user.avatarURL()})`)
            await interaction.editReply({ embeds: [pfpEmbed] });
        }
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}