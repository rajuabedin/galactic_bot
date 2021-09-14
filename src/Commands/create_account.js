const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_account')
        .setDescription('Create account to play!'),

    async execute(interaction) {
        try {

            let timestamp = Math.floor(interaction.createdTimestamp / 1000);
            const filter = i => i.user.id === interaction.user.id && Math.floor(i.message.createdTimestamp / 1000) === timestamp;

            let user = await interaction.client.getUserAccount(interaction.user.id);
            if (typeof user === 'undefined') {
                await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
                return;
            }
            var userInfo = await interaction.client.getUserAccount(interaction.user.id);
            if (typeof userInfo === 'undefined') {
                interaction.reply({ embeds: [interaction.client.yellowEmbed("Which firm would you like to create an account on?")], ephemeral: true, components: [firm] });
            }
            else
                interaction.reply("You already posses an account");

            let timestamp = Math.floor(interaction.createdTimestamp / 1000);
            const filter = i => i.user.id === interaction.user.id && Math.floor(i.message.createdTimestamp / 1000) === timestamp;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                await i.update({ embeds: [interaction.client.greenEmbed(`You have selected ${i.component.customId}`)], components: [] });
                collector.stop("Selected Firm");
            });

            collector.on('end', collected => {
                interaction.editReply({});
                //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
            });
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

const firm = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('Earth')
            //.setLabel('Beginning')
            .setEmoji("🌏")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Moon')
            //.setLabel('Ending')
            .setEmoji("🌑")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Mars')
            //.setLabel('Ending')
            .setEmoji("🍅")
            .setStyle('SUCCESS'),

    );

