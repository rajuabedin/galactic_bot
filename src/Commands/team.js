const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

let itemRank = ["E-", "E ", "E+", "D-", "D ", "D+", "C-", "C ", "C+", "B-", "B ", "B+", "A-", "A ", "A+", "S-", "S "];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('team')
        .setDescription('Team management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Info about the team'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Add a user to the team')
                .addUserOption(option => option.setName('user').setDescription('The user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave the team')),



    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            let message = "";

            if (userInfo.tutorial_counter < 6) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let selectedOption = interaction.options.getSubcommand();
            if (!userInfo.group_id) {
                await interaction.reply({ embeds: [interaction.client.redEmbedImage("You are not part of any team, would you like to create one?", "Create a team?", interaction.user)], components: [rowYesNo] });

                const filterRun = i => i.user.id == interaction.user.id && i.message.interaction.id == interaction.id;
                const collector = interaction.channel.createMessageComponentCollector({ filterRun, time: 120000 });
                collector.on('collect', async i => {
                    if (!i.replied)
                        try {
                            if (i.customId == "yes") {
                                let teamID = 0;
                                let uniqueID = false;
                                while (!uniqueID) {
                                    teamID = new Date().getTime();
                                    uniqueID = await interaction.client.databaseEditData(`INSERT INTO group_list (group_id, leader_id) VALUES (?, ?)`, [teamID, interaction.user.id]);
                                    await interaction.client.wait(100);
                                }
                                await interaction.client.databaseEditData(`UPDATE users SET group_id = ? WHERE user_id = ?`, [teamID, interaction.user.id]);
                                let leader = await interaction.client.databaseSelectData("SELECT ship_emoji,ship_current_hp, ship_hp, ship_shield, ship_damage FROM user_ships WHERE user_id = ? AND equipped = 1", [interaction.user.id]);
                                leader = leader[0]; message = "**";
                                message += `╔[<@${interaction.user.id}>] 👑\n║${leader.ship_emoji}│<a:hp:896118360125870170>: ${leader.ship_current_hp} / ${leader.ship_hp}\n╚════ <a:sd:896118359966511104>: ${leader.ship_shield} <a:ATK:982593626548875334>: ${leader.ship_damage}\n`;
                                for (let index = 0; index < 3; index++) {
                                    message += "╔[Free]\n╚════ Available slot\n";
                                }
                                message += "**";
                                await i.update({ embeds: [interaction.client.blueEmbedImage(message, "Team Info:", interaction.user)], components: [] });
                                return;
                            }
                            else {
                                await i.update({});
                                collector.stop();
                            }
                        }
                        catch (error) {
                            errorLog.error(error.message, { 'command_name': interaction.commandName });
                        }
                });

                collector.on('end', collected => {
                    interaction.editReply({ embeds: [interaction.client.redEmbedImage("Command cancelled", "Create a team?", interaction.user)], ephemeral: true, components: [] });
                    return;
                });
            }
            else if (selectedOption == "info") {
                let leader = await interaction.client.databaseSelectData("SELECT group_list.group_id, group_list.leader_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN group_list ON user_ships.user_id = group_list.leader_id AND group_list.group_id = ? WHERE user_ships.equipped = 1", [userInfo.group_id]);
                leader = leader[0];
                let teamMembers = await interaction.client.databaseSelectData("SELECT users.user_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN users ON user_ships.user_id = users.user_id AND users.user_id <> ? AND users.group_id = ? WHERE user_ships.equipped = 1", [leader.leader_id, leader.group_id]);
                message = "**";
                message += `╔[<@${leader.leader_id}>] 👑\n║${leader.ship_emoji}│<a:hp:896118360125870170>: ${leader.ship_current_hp} / ${leader.ship_hp}\n╚════ <a:sd:896118359966511104>: ${leader.ship_shield} <a:ATK:982593626548875334>: ${leader.ship_damage}\n`;
                for (let index = 0; index < 3; index++) {
                    if (teamMembers[index] != null) {
                        message += `╔[<@${teamMembers[index].user_id}>]\n║${teamMembers[index].ship_emoji}│<a:hp:896118360125870170>: ${teamMembers[index].ship_current_hp} / ${teamMembers[index].ship_hp}\n╚════ <a:sd:896118359966511104>: ${teamMembers[index].ship_shield} <a:ATK:982593626548875334>: ${teamMembers[index].ship_damage}\n`;
                    }
                    else
                        message += "╔[Free]\n╚════ Available slot\n";
                }
                message += "**";
                await interaction.reply({ embeds: [interaction.client.blueEmbedImage(message, "Team Info:", interaction.user)] });

            }
            else if (selectedOption == "leave") {
                let team = await interaction.client.databaseSelectData("SELECT * FROM group_list WHERE group_id = ?", [userInfo.group_id]);
                team = team[0];
                if (team.members == 1) {
                    await interaction.client.databaseEditData("UPDATE users SET group_id = 0 WHERE group_id = ?", [team.group_id]);
                    await interaction.client.databaseEditData("DELETE FROM group_list WHERE group_id = ?", [team.group_id]);
                    await interaction.reply({ embeds: [interaction.client.redEmbedImage("Team has been disbanded!", "Team disbanded", interaction.user)] });
                    return;
                }
                else if (team.leader_id == userInfo.user_id) {
                    await interaction.client.databaseEditData("UPDATE users SET group_id = 0 WHERE group_id = ?", [team.group_id]);
                    await interaction.client.databaseEditData("DELETE FROM group_list WHERE group_id = ?", [team.group_id]);
                    await interaction.reply({ embeds: [interaction.client.redEmbedImage("The leader has disbanded the team!", "Team disbanded", interaction.user)] });
                    return;
                }
                else {
                    await interaction.client.databaseEditData("UPDATE users SET group_id = 0 WHERE user_id = ?", [userInfo.user_id]);
                    await interaction.client.databaseEditData("UPDATE group_list SET members = members - 1 WHERE group_id = ?", [team.group_id]);
                    await interaction.reply({ embeds: [interaction.client.redEmbedImage("You have left the team!", "Operation succesful", interaction.user)] });
                    return;
                }
            }
            else {
                selectedOption = interaction.options.getUser('user');
                let teamList = await interaction.client.databaseSelectData("SELECT * FROM group_list WHERE group_id = ?", [userInfo.group_id]);
                if (teamList[0].leader_id == interaction.user.id) {
                    if (teamList[0].members < 5) {
                        if (!selectedOption.bot && !selectedOption.system && selectedOption.id != interaction.user.id) {
                            let member = await interaction.client.databaseSelectData("SELECT group_id FROM users WHERE user_id = ?", [selectedOption.id]);
                            if (member[0].group_id == userInfo.group_id) {
                                await interaction.reply({ embeds: [interaction.client.redEmbedImage("The user is already part of this team", "ERROR!!", interaction.user)] });
                            }
                            else if (member[0].group_id != 0) {
                                await interaction.reply({ embeds: [interaction.client.redEmbedImage("The user is already part of a team", "ERROR!!", interaction.user)] });
                            }
                            else {
                                await interaction.reply({ content: `<@${selectedOption.id}>`, embeds: [interaction.client.blueEmbedImage(`Would you like to join the team?`, "Team Invite", interaction.user)], components: [rowYesNo] });
                                const filterRun = i => i.user.id == selectedOption.id && i.message.interaction.id == interaction.id;
                                const collector = interaction.channel.createMessageComponentCollector({ filterRun, time: 120000 });
                                collector.on('collect', async i => {
                                    if (!i.replied)
                                        try {
                                            if (i.customId == "yes" && i.user.id != interaction.user.id) {
                                                await interaction.client.databaseEditData(`UPDATE users SET group_id = ? WHERE user_id = ?`, [userInfo.group_id, selectedOption.id]);
                                                await interaction.client.databaseEditData(`UPDATE group_list SET members = members + 1 WHERE group_id = ?`, [userInfo.group_id]);
                                                let leader = await interaction.client.databaseSelectData("SELECT group_list.group_id, group_list.leader_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN group_list ON user_ships.user_id = group_list.leader_id AND group_list.group_id = ? WHERE user_ships.equipped = 1", [userInfo.group_id]);
                                                leader = leader[0];
                                                let teamMembers = await interaction.client.databaseSelectData("SELECT users.user_id, user_ships.ship_emoji, user_ships.ship_current_hp, user_ships.ship_hp, user_ships.ship_shield, user_ships.ship_damage FROM user_ships INNER JOIN users ON user_ships.user_id = users.user_id AND users.user_id <> ? AND users.group_id = ? WHERE user_ships.equipped = 1", [leader.leader_id, leader.group_id]);
                                                message = "**";
                                                message += `╔[<@${leader.leader_id}>] 👑\n║${leader.ship_emoji}│<a:hp:896118360125870170>: ${leader.ship_current_hp} / ${leader.ship_hp}\n╚════ <a:sd:896118359966511104>: ${leader.ship_shield} <a:ATK:982593626548875334>: ${leader.ship_damage}\n`;
                                                for (let index = 0; index < 3; index++) {
                                                    if (teamMembers[index] != null) {
                                                        message += `╔[<@${teamMembers[index].user_id}>]\n║${teamMembers[index].ship_emoji}│<a:hp:896118360125870170>: ${teamMembers[index].ship_current_hp} / ${teamMembers[index].ship_hp}\n╚════ <a:sd:896118359966511104>: ${teamMembers[index].ship_shield} <a:ATK:982593626548875334>: ${teamMembers[index].ship_damage}\n`;
                                                    }
                                                    else
                                                        message += "╔[Free]\n╚════ Available slot\n";
                                                }
                                                message += "**";
                                                await i.update({ content: " ", embeds: [interaction.client.blueEmbedImage(message, "Team Info:", interaction.user)], components: [] });
                                                collector.stop();
                                            }
                                            else if (i.customId == "no" && i.user.id != interaction.user.id) {
                                                await i.update({ content: " ", embeds: [interaction.client.redEmbedImage(`<@${selectedOption.id}> has declined the team invitation!`, "Invitation Failed!", interaction.user)], components: [] });
                                                collector.stop();
                                            }
                                            else
                                                await i.update({});
                                        }
                                        catch (error) {
                                            errorLog.error(error.message, { 'command_name': interaction.commandName });
                                        }
                                });

                                collector.on('end', collected => {
                                    return;
                                });
                            }
                        }
                        else
                            await interaction.reply({ embeds: [interaction.client.redEmbedImage("You have not selected a valid user", "Command cancelled", interaction.user)] });

                    }
                    else
                        await interaction.reply({ embeds: [interaction.client.redEmbedImage("The team has reached maximum capacity!", "ERROR!!", interaction.user)] });
                }
                else
                    await interaction.reply({ embeds: [interaction.client.redEmbedImage("You are not the leader of this team!", "ERROR!!", interaction.user)] });

            }
        } catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}

const rowYesNo = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('yes')
            .setLabel('YES')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('no')
            .setLabel('NO')
            .setStyle('DANGER'),
    );