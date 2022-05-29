const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

let itemRank = ["E-", "E ", "E+", "D-", "D ", "D+", "C-", "C ", "C+", "B-", "B ", "B+", "A-", "A ", "A+", "S-", "S "];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Team management')
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Select from [ ship - laser - shield - engine ]')
                .addChoice('ship', 'ship')
                .addChoice('laser', 'laser')
                .addChoice('shield', 'shield')
                .addChoice('engine', 'engine')
        ),



    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        //try {
        let message = "";
        if (userInfo.tutorial_counter < 3) {
            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
            return;
        }
        let selectedOption = interaction.options.getString('option');
        if (selectedOption == 'create') {
        }
        else if (selectedOption == 'leave') {

        }
        else if (selectedOption == 'invite') {

        }
        else {
            if (!userInfo.group_id) {
                await interaction.reply({ embeds: ["You are not part of any team!", "ERROR!!"], ephemeral: true });
                return;
            }
            let leader = await interaction.client.databaseSelcetData("SELECT group_list.leader_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN group_list ON user_ships.user_id = group_list.leader_id AND group_list.group_id = ? WHERE user_ships.equipped = 1", [userInfo.group_id]);
            leader = leader[0];
            let teamMembers = await interaction.client.databaseSelcetData("SELECT users.user_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN users ON user_ships.user_id = users.user_id AND users.user_id <> ? WHERE user_ships.equipped = 1", [leader.leader_id]);
            message = "**";
            message += `╔[<@${leader.leader_id}>] 👑\n║${leader.ship_emoji}│<a:hp:896118360125870170>: ${leader.ship_current_hp} / ${leader.ship_hp}\n╚════ <a:sd:896118359966511104>: ${leader.ship_shield} <a:sd:896118359966511104>: ${leader.ship_damage}\n`;
            for (let index = 0; index < 3; index++) {
                if (teamMembers[index] != null) {
                    message += `╔[<@${teamMembers[index].user_id}>]\n║${teamMembers[index].ship_emoji}│<a:hp:896118360125870170>: ${teamMembers[index].ship_current_hp} / ${teamMembers[index].ship_hp}\n╚════ <a:sd:896118359966511104>: ${teamMembers[index].ship_shield} <a:sd:896118359966511104>: ${teamMembers[index].ship_damage}\n`;
                }
                else
                    message += "╔[Free]\n╚════ Available slot\n";
            }
            message += "**";
            await interaction.reply({ embeds: [interaction.client.blueEmbedImage(message, "Team Info:", interaction.user)] });
        }


        /*} catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
    }
}