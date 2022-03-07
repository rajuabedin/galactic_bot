const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('test2')
        .setDescription('Verve Testing'),

    async execute(interaction, userInfo, serverSettings) {
        interaction.reply({ embeds: [interaction.client.redEmbed("What are you looking at?", "HUH?!?")] });
    }
}