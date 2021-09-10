const Command = require('../Structures/Command.js');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_account')
        .setDescription('Create account to play!'),

    async execute(interaction) {
        const firm = new MessageActionRow()
<<<<<<< HEAD
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
=======
            .addComponents(
                new MessageButton()
                    .setCustomId('Earth')
                    //.setLabel('Beginning')
                    .setEmoji(interaction.client.earthIcon)
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('Moon')
                    //.setLabel('Ending')
                    .setEmoji(interaction.client.moonIcon)
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('Mars')
                    //.setLabel('Ending')
                    .setEmoji(interaction.client.marsIcon)
                    .setStyle('SUCCESS'),

            );
>>>>>>> test

        var userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof userInfo === 'undefined') {
            interaction.reply({ embeds: [interaction.client.yellowEmbed("Which firm would you like to create an account on?")], ephemeral: true, components: [firm] });
        }
        else
            interaction.reply("You already posses an account");

        const filter = i => i.user.id === interaction.user.id;

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
}

