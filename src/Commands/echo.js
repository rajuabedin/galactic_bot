const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo1')
        .setDescription('Replies with your input.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(true)),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });


        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        //try {
        let echo = interaction.options.getString('input')
        await interaction.editReply(echo);
        await interaction.followUp({ embeds: [interaction.client.blueEmbed(echo + " 1")] })
        await interaction.followUp({ embeds: [interaction.client.yellowEmbed(echo + " 2")] })
        await interaction.followUp({ embeds: [interaction.client.redEmbed(echo + " 3")] })
        /*}
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }*/
    }
}