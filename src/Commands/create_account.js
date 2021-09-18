const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_account')
        .setDescription('Create account to play!'),

    async execute(interaction) {
        try {

            var userInfo = await interaction.client.getUserAccount(interaction.user.id);
            let tutorialCounter = 0;
            if (typeof userInfo === 'undefined') {
                interaction.reply({ embeds: [interaction.client.yellowEmbed("Which firm would you like to create an account on?")], components: [firm] });
            }
            else if (userInfo.tutorial_counter >= 10) {
                interaction.reply("You already posses an account");
                return
            }
            else
                tutorialCounter = userInfo.tutorial_counter;

            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (tutorialCounter === 0) {
                    tutorialCounter++;                    
                    await interaction.client.databaseEditData(`INSERT INTO users (user_id, firm) VALUES (?, ?)`, [interaction.user.id, i.component.customId]);
                    await interaction.client.databaseEditData(`INSERT INTO user_cd (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO ammunition (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO hunt_configuration (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO user_ships (user_id) VALUES (?)`, [interaction.user.id]);
                    await i.update({ embeds: [interaction.client.greenEmbed(`**You have selected ${i.component.customId}.**\n*You were rewarded with 1000 (x1) laser ammunition and 10000 crediits.*`,"TUTORIAL phase 1")], components: [] });
                }

                //collector.stop("Selected Firm");
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

