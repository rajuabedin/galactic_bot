const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const utility = require('../Utility/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping command!'),

    async execute(interaction, userInfo, serverSettings) {
String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            let msg = await interaction.deferReply({ fetchReply: true });

            try {
                await utility.userLog(interaction, interaction.user.id, "testing")
            } catch (error) {
                await errorLog.error(error, interaction);
            }
            await interaction.editReply({ embeds: [interaction.client.redEmbed(`Pong ${interaction.client.ws.ping} ms!`)], ephemeral: true });
        } catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}