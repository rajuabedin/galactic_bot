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

    async execute(interaction, userInfo) {
        try {
            const user = interaction.options.getUser('user');
            const pfpEmbed = new MessageEmbed()
                .setColor('0x009dff')
                .setImage(user.avatarURL())
                .setAuthor(`${user.username} PFP`, interaction.client.user.avatarURL())
                .setDescription(`PFP [LINK](${user.avatarURL()})`)
            await interaction.reply({ embeds: [pfpEmbed] });
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}