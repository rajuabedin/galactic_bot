const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mission')
        .setDescription('Check your missions')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Please status')
                .setRequired(false)
                .addChoice('active', 'active')
                .addChoice('completed', 'completed')
                .addChoice('expired', 'expired')
                .addChoice('cancelled', 'cancelled')),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });


        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 5) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            var missionListDB = []
            var searchMissionByStatus = interaction.options.getString('status')
            if (searchMissionByStatus !== null) {
                missionListDB = await interaction.client.databaseSelectData("SELECT * from user_missions Inner JOIN missions on user_missions.mission_id= missions.mission_id where user_missions.user_id = ? and user_missions.mission_status = ?", [interaction.user.id, searchMissionByStatus.toLowerCase()]);
            } else {
                missionListDB = await interaction.client.databaseSelectData("SELECT * from user_missions Inner JOIN missions on user_missions.mission_id= missions.mission_id where user_id = ? and id = ? and mission_status = ?", [interaction.user.id, userInfo.missions_id, "active"]);
            }
            if (missionListDB === undefined || missionListDB.length == 0) {
                if (searchMissionByStatus !== null) {
                    return await interaction.editReply({ embeds: [interaction.client.redEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, 'mission_error_status_s')} [${searchMissionByStatus.toUpperCase()}](https://obelisk.club/)!`)] });
                } else {
                    return await interaction.editReply({ embeds: [interaction.client.redEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_nf_active')}`)] });
                }
            }
            var missionList = [];
            var embed;
            var count = 0;
            var missionsPerPage = 1;
            var currentData = "";
            var missionExpired = false;


            for (let mission of missionListDB) {
                missionExpired = false;
                count++;

                var todo = "";
                var task = mission.mission_task.split(";");
                var taskQuantity = mission.mission_task_quantity.split(";");
                var taskQuantityLeft = mission.mission_task_left.split(";");
                var availableMap = interaction.client.getWordLanguage(serverSettings.lang, 'missions_no_map');

                if (mission.map_id > 0) {
                    availableMap = mission.map_id;
                }

                if (mission.mission_limit > 0) {
                    var missionEndTime = Date.parse(mission.mission_started_at) + (mission.mission_limit * 60 * 60 * 1000);
                    var currentTime = new Date().getTime();

                    var distance = missionEndTime - currentTime;

                    // Time calculations for days, hours, minutes and seconds
                    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                }




                var timeLeftMsg = ""
                if (mission.mission_limit > 0) {
                    if (distance < 0) {
                        timeLeftMsg = `[${interaction.client.getWordLanguage(serverSettings.lang, 'expired_u')}❗](https://obelisk.club/)`;
                        missionExpired = true;
                        await interaction.client.databaseEditData(`update user_missions set mission_status = ? where user_id = ? and id = ?`, ["expired", interaction.user.id, mission.id])
                    } else {
                        timeLeftMsg = "__"
                        if (days > 0) {
                            timeLeftMsg += `${days} **D** `
                        }
                        if (hours > 0) {
                            timeLeftMsg += `${hours} **H** `
                        }
                        if (minutes > 0) {
                            timeLeftMsg += `${minutes} **M** `
                        }
                        if (seconds > 0) {
                            timeLeftMsg += `${seconds} **S** `
                        }
                        timeLeftMsg += "__"
                    }
                } else {
                    timeLeftMsg = `[${interaction.client.getWordLanguage(serverSettings.lang, 'no_time_limit_u')}](https://obelisk.club/)`
                }




                for (let index = 0; index < task.length; index++) {
                    todo += "⦿ " + task[index] + " left - " + taskQuantityLeft[index] + "/" + taskQuantity[index] + "\n";
                }


                var reward = "";

                if (mission.mission_reward_credit > 0) reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'Credits_c')} - ${mission.mission_reward_credit}`;

                if (mission.mission_reward_units > 0) {
                    if (reward != "") {
                        reward += ` | ${interaction.client.getWordLanguage(serverSettings.lang, 'Units_c')} - ${mission.mission_reward_units}`;
                    } else {
                        reward += `${interaction.client.getWordLanguage(serverSettings.lang, 'Units_c')} - ${mission.mission_reward_units}`;
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

                currentData += `**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_info')}**\n**ID :**  ${mission.mission_id} \n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_type')}:** [${mission.mission_type}](https://obelisk.club/)\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_restiction')}:** ${availableMap}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_rewards')}**\n${reward}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_time_left')}:** ${timeLeftMsg}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'mission_o_status')}:**\`\`\`${todo}\`\`\``;


                if (count === missionsPerPage) {
                    missionList.push([currentData, mission.mission_id, mission.mission_task_quantity]);
                    count = 0;
                    currentData = "";
                }
            };

            var maxPages = missionList.length;

            if (missionList == "") {
                if (!missionExpired) {
                    embed = interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_nf'));
                } else {
                    embed = interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_error_exp'));
                }

            } else {
                if (searchMissionByStatus === null) {
                    embed = interaction.client.yellowPagesImageEmbed(missionList[0][0], interaction.client.getWordLanguage(serverSettings.lang, 'mission_list_u'), interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages} `, "https://i.imgur.com/RBt8b5B.gif");
                } else {
                    embed = interaction.client.yellowPagesImageEmbed(missionList[0][0], `${interaction.client.getWordLanguage(serverSettings.lang, 'mission_list_u')} < ${searchMissionByStatus.toUpperCase()}> `, interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages} `, "https://i.imgur.com/RBt8b5B.gif");
                }


            }

            if (searchMissionByStatus === null) {
                if (missionExpired === false && missionListDB.length > 0) {
                    await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true });
                } else {
                    await interaction.editReply({ embeds: [embed], components: [], fetchReply: true });
                }

            } else {
                await interaction.editReply({ embeds: [embed], components: [rowLeftRight], fetchReply: true });
            }

            buttonHandler(interaction, missionList, userInfo, searchMissionByStatus, serverSettings, msg);
        } catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }

}

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('cancel')
            .setLabel('CANCEL')
            .setStyle('DANGER'),
    );

const rowLeftRight = new MessageActionRow()
    .addComponents(

        new MessageButton()
            .setCustomId('left')
            .setEmoji('887811358509379594')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('right')
            .setEmoji('887811358438064158')
            .setStyle('PRIMARY'),
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

function buttonHandler(interaction, missionsData, userInfo, searchMissionByStatus, serverSettings, msg) {
    let maxIndex = missionsData.length - 1;
    let index = 0;


    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
        i.deferUpdate();


        if (i.user.id === interaction.user.id) {
            collector.resetTimer({ time: 15000 });
            if (i.customId === 'left') {
                index--;
            } else if (i.customId === 'right') {
                index++;
            } else if (i.customId === "cancel") {
                if (i.replied) {
                    await i.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_cancellation_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'missions_cancellation'))], components: [rowYesNo] });
                } else {
                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'missions_cancellation_conf'), interaction.client.getWordLanguage(serverSettings.lang, 'missions_cancellation'))], components: [rowYesNo] });
                }
            } else if (i.customId === "yes") {
                if (missionsData[index][1] == 0) {
                    if (i.replied) {
                        await i.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_cancelled_not'), "ERROR!!!")], components: [] })
                    } else {
                        await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_cancelled_not'), "ERROR!!!")], components: [] })
                    }
                    return collector.stop();
                }
                if (i.replied) {
                    await i.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_cancelled'), interaction.client.getWordLanguage(serverSettings.lang, 'cancelled_c'))], components: [] })
                } else {
                    await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'mission_cancelled'), interaction.client.getWordLanguage(serverSettings.lang, 'cancelled_c'))], components: [] })
                }
                await interaction.client.databaseEditData(`update user_missions set mission_status = ? where user_id = ? and id = ? `, ["cancelled", interaction.user.id, userInfo.missions_id])
                return collector.stop();
            } else {
                interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'interactionCancel'), interaction.client.getWordLanguage(serverSettings.lang, 'stopped_c'))], components: [] })
            }

            if (["left", "right"].includes(i.customId)) {
                if (index < 0) {
                    index += maxIndex + 1;
                }
                if (index > maxIndex) {
                    index -= maxIndex + 1;
                }
                if (searchMissionByStatus === null) {
                    await interaction.editReply({ embeds: [interaction.client.yellowPagesImageEmbed(missionsData[index][0], interaction.client.getWordLanguage(serverSettings.lang, 'mission_list_u'), interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} ${index + 1} of ${maxIndex + 1} `, "https://i.imgur.com/RBt8b5B.gif")] });
                } else {
                    await interaction.editReply({ embeds: [interaction.client.yellowPagesImageEmbed(missionsData[index][0], `${interaction.client.getWordLanguage(serverSettings.lang, 'mission_list_u')} < ${searchMissionByStatus.toUpperCase()}> `, interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} ${index + 1} of ${maxIndex + 1} `, "https://i.imgur.com/RBt8b5B.gif")] });
                }
            }

        }
        else
            await interaction.editReply({});
    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}