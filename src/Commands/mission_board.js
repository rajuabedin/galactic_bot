const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mission_board')
        .setDescription('Get a mission and level up faster!')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Please enter mission type, id or monster name...')
                .setRequired(false)),

    async execute(interaction, userInfo, serverSettings) {
String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            let msg = await interaction.deferReply({ fetchReply: true });

            if (userInfo.tutorial_counter < 6) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            var missionListDB = await interaction.client.databaseSelectData("SELECT * from missions where mission_visible = 'yes'", [interaction.user.id]);
            if (missionListDB == undefined || missionListDB.length == 0) {
                return await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error'))] });
            } else {
                var searchMission = interaction.options.getString('search')
                var missionList = [];
                var embed;
                var count = 0;
                var missionsPerPage = 1;
                var currentData = "";

                if (searchMission == null) {
                    await missionListDB.forEach((mission, index) => {
                        count++;

                        var todo = "";
                        var task = mission.mission_task.split(";");
                        var taskQuantity = mission.mission_task_quantity.split(";");
                        var timeLeftMsg = "";
                        var availableMap = interaction.client.getWordLanguage(serverSettings.lang, 'missions_no_map');

                        if (mission.map_id > 0) {
                            availableMap = mission.map_id;
                        }


                        if (mission.mission_limit > 0) {
                            let timeH = 0;
                            let timeM = mission.mission_limit * 60;
                            while (timeM >= 60) {
                                timeH++;
                                timeM -= 60;
                            }
                            if (timeH && timeM)
                                timeLeftMsg = timeH + " H " + timeM + " M";
                            else if (timeH)
                                timeLeftMsg = timeH + " H"
                            else
                                timeLeftMsg = timeM + " M"
                        } else {
                            timeLeftMsg = `[${interaction.client.getWordLanguage(serverSettings.lang, 'no_time_limit_u')}](https://obelisk.club/)`;
                        }

                        for (index = 0; index < task.length; index++) {
                            todo += "⦿ " + task[index] + " - " + taskQuantity[index] + "\n";
                        }


                        var reward = "";

                        if (mission.mission_reward_credit > 0) reward += `Credit - ${mission.mission_reward_credit}`;

                        if (mission.mission_reward_units > 0) {
                            if (reward != "") {
                                reward += ` | Units - ${mission.mission_reward_units}`;
                            } else {
                                reward += `Units - ${mission.mission_reward_units}`;
                            }
                        }

                        if (mission.mission_reward_exp > 0) {
                            if (reward != "") {
                                reward += ` | Exp - ${mission.mission_reward_exp}`;
                            } else {
                                reward += `Exp - ${mission.mission_reward_exp}`;
                            }
                        }

                        if (mission.mission_reward_honor > 0) {
                            if (reward != "") {
                                reward += ` | ${interaction.client.getWordLanguage(serverSettings.lang, 'honor_c')} - ${mission.mission_reward_honor}`;
                            } else {
                                reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'honor_c')} - ${mission.mission_reward_honor}`;
                            }
                        }

                        if (mission.mission_reward_items != null && mission.mission_reward_items !== "") {
                            if (reward != "") {
                                reward += ` | ${interaction.client.getWordLanguage(serverSettings.lang, 'material_c')}: ${mission.mission_reward_items}`;
                            } else {
                                reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'material_c')}: - ${mission.mission_reward_items}`;
                            }
                        }

                        currentData += `**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_info')}**\n**ID :**  ${mission.mission_id} \n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_type')}:** [${mission.mission_type}](https://obelisk.club/)\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_restiction')}:** ${availableMap}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_rewards')}**\n${reward}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_duration')}:** ${timeLeftMsg}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_o')}:**\`\`\`${todo}\`\`\``;

                        if (count == missionsPerPage) {
                            missionList.push([currentData, mission.mission_id, mission.mission_task_quantity]);
                            count = 0;
                            currentData = "";
                        }
                    });
                } else {
                    await missionListDB.forEach((mission, index) => {

                        if (mission.mission_type.toLowerCase().includes(searchMission.toLowerCase()) || mission.mission_task.toLowerCase().includes(searchMission.toLowerCase())
                            || mission.mission_reward_items.toLowerCase().includes(searchMission.toLowerCase()) || mission.mission_id == parseInt(searchMission)) {
                            count++;

                            var todo = "";
                            var task = mission.mission_task.split(";");
                            var taskQuantity = mission.mission_task_quantity.split(";");
                            var timeLeftMsg = "";
                            var availableMap = interaction.client.getWordLanguage(serverSettings.lang, 'missions_no_map')
                        }


                        if (mission.map_id > 0) {
                            availableMap = mission.map_id;
                        }

                        if (mission.mission_limit > 0) {
                            timeLeftMsg = mission.mission_limit + " H";
                        } else {
                            timeLeftMsg = `[${interaction.client.getWordLanguage(serverSettings.lang, 'no_time_limit_u')}](https://obelisk.club/)`;
                        }

                        for (index = 0; index < task.length; index++) {
                            todo += "⦿ " + task[index] + " - " + taskQuantity[index] + "\n";
                        }

                        var reward = "";

                        if (mission.mission_reward_credit > 0) reward += `Credit - ${mission.mission_reward_credit}`;

                        if (mission.mission_reward_units > 0) {
                            if (reward != "") {
                                reward += ` | Units - ${mission.mission_reward_units}`;
                            } else {
                                reward += `Units - ${mission.mission_reward_units}`;
                            }
                        }

                        if (mission.mission_reward_exp > 0) {
                            if (reward != "") {
                                reward += ` | Exp - ${mission.mission_reward_exp}`;
                            } else {
                                reward += `Exp - ${mission.mission_reward_exp}`;
                            }
                        }

                        if (mission.mission_reward_honor > 0) {
                            if (reward != "") {
                                reward += ` | ${interaction.client.getWordLanguage(serverSettings.lang, 'honor_c')} - ${mission.mission_reward_honor}`;
                            } else {
                                reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'honor_c')} - ${mission.mission_reward_honor}`;
                            }
                        }

                        if (mission.mission_reward_items != null && mission.mission_reward_items !== "") {
                            if (reward != "") {
                                reward += ` | ${interaction.client.getWordLanguage(serverSettings.lang, 'material_c')}: ${mission.mission_reward_items}`;
                            } else {
                                reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'material_c')}: - ${mission.mission_reward_items}`;
                            }
                        }

                        currentData += `**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_info')}**\n**ID :**  ${mission.mission_id} \n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_type')}:** [${mission.mission_type}](https://obelisk.club/)\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_restiction')}:** ${availableMap}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_rewards')}**\n${reward}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_duration')}:** ${timeLeftMsg}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_o')}:**\`\`\`${todo}\`\`\``;

                        if (count == missionsPerPage) {
                            missionList.push([currentData, mission.mission_id, mission.mission_task_quantity]);
                            count = 0;
                            currentData = "";
                        }
                    });
                }


                var maxPages = missionList.length;

                if (missionList == "") {
                    embed = interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_nf'));
                } else {
                    embed = interaction.client.yellowPagesImageEmbed(missionList[0][0], interaction.client.getWordLanguage(serverSettings.lang, 'mission_board_u'), interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`, "https://obelisk.club/npc/missions.png");
                }

                if (missionList.length > 1) {
                    await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true });
                    buttonHandler(interaction, missionList, userInfo, serverSettings, msg);
                } else {
                    await interaction.editReply({ embeds: [embed], fetchReply: true });
                }


            }
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

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('left')
            .setEmoji('887811358509379594')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('right')
            .setEmoji('887811358438064158')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('get')
            .setLabel('GET')
            .setStyle('SUCCESS'),
    );

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

function buttonHandler(interaction, missionsData, userInfo, serverSettings, msg) {
    let maxIndex = missionsData.length - 1;
    let index = 0;
    let selectedMissionID = -1;
    var hasActiveMission = false;
    var activeMissionID = 0;


    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
        i.deferUpdate();


        collector.resetTimer({ time: 15000 });
        try {
            if (i.user.id == interaction.user.id) {
                if (i.customId == 'left') {
                    index--;
                } else if (i.customId == 'right') {
                    index++;
                } else if (i.customId == "get") {
                    if (userInfo.missions_id != null) {
                        var userMission = await interaction.client.databaseSelectData("SELECT * from user_missions where user_id = ? and id = ?", [interaction.user.id, userInfo.missions_id]);
                        userMission = userMission[0];

                        if (typeof userMission !== 'undefined' && userMission.mission_status != "completed") {
                            var userMissionInfo = await interaction.client.databaseSelectData("SELECT * from missions where mission_id = ?", [userMission.mission_id]);
                            userMissionInfo = userMissionInfo[0];
                            var mySqlTimeStamp = userMission.mission_started_at;
                            var nowTimeStamp = new Date();
                            var resolutionTime = ((((nowTimeStamp - mySqlTimeStamp) / 1000) / 60) / 60);
                            if (userMissionInfo.mission_limit > resolutionTime) {
                                hasActiveMission = true;
                                activeMissionID = userInfo.missions_id;
                            } else {
                                await interaction.client.databaseEditData(`update user_missions set mission_status = ? where user_id = ? and id = ?`, ["expired", interaction.user.id, userInfo.missions_id])
                            }
                        }
                    }
                    selectedMissionID = missionsData[index][1];
                    if (hasActiveMission) {
                        if (i.replied) {
                            await i.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_active'))], components: [rowYesNo] });
                        } else {
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_active'))], components: [rowYesNo] });
                        }

                    } else {
                        if (i.replied) {
                            await i.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_start_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'mission_start'))], components: [rowYesNo] });
                        } else {
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_start_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'mission_start'))], components: [rowYesNo] });
                        }

                    }
                } else if (i.customId == "yes") {
                    var query = `insert into user_missions (mission_id, mission_task_left, user_id) values (?,?,?)`;
                    var missionId = await interaction.client.databaseEditDataReturnID(query, [selectedMissionID, missionsData[index][2], interaction.user.id])
                    await interaction.client.databaseEditData(`update users set missions_id = ? where user_id = ?`, [missionId, interaction.user.id])
                    if (i.replied) {
                        await i.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_started'), interaction.client.getWordLanguage(serverSettings.lang, 'successful_c'))], components: [] })
                    } else {
                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_started'), interaction.client.getWordLanguage(serverSettings.lang, 'successful_c'))], components: [] })
                    }
                    if (hasActiveMission) {
                        await interaction.client.databaseEditData(`update user_missions set mission_status = ? where user_id = ? and id = ?`, ["cancelled", interaction.user.id, activeMissionID])
                    }
                    return collector.stop();
                } else {
                    interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'interactionCancel'), interaction.client.getWordLanguage(serverSettings.lang, 'cancelled_c'))], components: [] })
                }

                if (["left", "right"].includes(i.customId)) {
                    if (index < 0) {
                        index += maxIndex + 1;
                    }
                    if (index > maxIndex) {
                        index -= maxIndex + 1;
                    }
                    await interaction.editReply({ embeds: [interaction.client.yellowPagesImageEmbed(missionsData[index][0], interaction.client.getWordLanguage(serverSettings.lang, 'mission_board_u'), interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} ${index + 1} of ${maxIndex + 1}`, "https://obelisk.club/npc/missions.png")] });
                }
            }

        }
        catch (error) {
            await errorLog.error(error, interaction);
        }

    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}