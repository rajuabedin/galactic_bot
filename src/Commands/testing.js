const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('testing'),

    async execute(interaction) {
        //try {
             
        /*} catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
    }
}