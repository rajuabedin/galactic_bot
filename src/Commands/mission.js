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

    async execute(interaction, userInfo) {
        try {
            if (userInfo.tutorial_counter < 5) {
                await interaction.reply({ embeds: [interaction.client.redEmbed("**Please finish the tutorial first**")] });
                return;
            }
            var missionListDB = []
            var searchMissionByStatus = interaction.options.getString('status')
            if (searchMissionByStatus !== null) {
                missionListDB = await interaction.client.databaseSelcetData("SELECT * from user_missions Inner JOIN missions on user_missions.mission_id= missions.mission_id where user_missions.user_id = ? and user_missions.mission_status = ?", [interaction.user.id, searchMissionByStatus.toLowerCase()]);
            } else {
                missionListDB = await interaction.client.databaseSelcetData("SELECT * from user_missions Inner JOIN missions on user_missions.mission_id= missions.mission_id where user_id = ? and id = ? and mission_status = ?", [interaction.user.id, userInfo.missions_id, "active"]);
            }
            if (missionListDB === undefined || missionListDB.length == 0) {
                if (searchMissionByStatus !== null) {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(`Unable to find any missions with status [${searchMissionByStatus.toUpperCase()}](https://obelisk.club/)!`)] });
                } else {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(`Unable to find any missions!`)] });
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
                var availableMap = "No Map Restriction";

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
                        timeLeftMsg = "[EXPIRED❗](https://obelisk.club/)";
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
                    timeLeftMsg = "[NO TIME LIMIT](https://obelisk.club/)"
                }




                for (index = 0; index < task.length; index++) {
                    todo += "⦿ " + task[index] + " - " + taskQuantityLeft[index] + "/" + taskQuantity[index] + "\n";
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
                        reward += ` | Honor - ${mission.mission_reward_honor}`;
                    } else {
                        reward += `Honor - ${mission.mission_reward_honor}`;
                    }
                }

                if (mission.mission_reward_items != null && mission.mission_reward_items !== "") {
                    if (reward != "") {
                        reward += ` | Materials: ${mission.mission_reward_items}`;
                    } else {
                        reward += `Materials: - ${mission.mission_reward_items}`;
                    }
                }

                currentData += "**Mission Info**\n**ID :** `" + mission.mission_id + "`\n**Mission Type:** [" + mission.mission_type + "](https://obelisk.club/)\n**Map Restriction:** " + availableMap + "\n**Mission Reward(s)**\n" + reward + "\n**Mission Time Left:** " + timeLeftMsg + "\n**Mission Objective Status:**```" + todo + "```";


                if (count === missionsPerPage) {
                    missionList.push([currentData, mission.mission_id, mission.mission_task_quantity]);
                    count = 0;
                    currentData = "";
                }
            };

            var maxPages = missionList.length;

            if (missionList == "") {
                if (!missionExpired) {
                    embed = interaction.client.redEmbed("Mission not found!");
                } else {
                    embed = interaction.client.redEmbed("Mission expired!");
                }

            } else {
                if (searchMissionByStatus === null) {
                    embed = interaction.client.yellowPagesImageEmbed(missionList[0][0], "MISSIONS LIST", interaction.user, `Page 1 of ${maxPages}`, "https://i.imgur.com/RBt8b5B.gif");
                } else {
                    embed = interaction.client.yellowPagesImageEmbed(missionList[0][0], `MISSIONS LIST <${searchMissionByStatus.toUpperCase()}>`, interaction.user, `Page 1 of ${maxPages}`, "https://i.imgur.com/RBt8b5B.gif");
                }


            }
            if (searchMissionByStatus === null) {
                if (missionExpired === false && missionListDB.length > 0) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                } else {
                    await interaction.reply({ embeds: [embed], components: [] });
                }

            } else {
                await interaction.reply({ embeds: [embed], components: [rowLeftRight] });
            }

            buttonHandler(interaction, missionList, userInfo, searchMissionByStatus);
        } catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            }
            errorLog.error(error.message, { 'command_name': interaction.commandName });
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

function buttonHandler(interaction, missionsData, userInfo, searchMissionByStatus) {
    let maxIndex = missionsData.length - 1;
    let index = 0;

    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (i.customId === 'left') {
            index--;
        } else if (i.customId === 'right') {
            index++;
        } else if (i.customId === "cancel") {
            if (i.replied) {
                await i.editReply({ embeds: [interaction.client.blueEmbed("Do you really want to stop this mission?", "Mission Cancellation")], components: [rowYesNo] });
            } else {
                await i.update({ embeds: [interaction.client.blueEmbed("Do you really want to stop this mission?", "Mission Cancellation")], components: [rowYesNo] });
            }
        } else if (i.customId === "yes") {
            if (i.replied) {
                await i.editReply({ embeds: [interaction.client.greenEmbed("You have successfully cancelled the mission.", "Cancelled")], components: [] })
            } else {
                await i.update({ embeds: [interaction.client.greenEmbed("You have successfully cancelled the mission.", "Cancelled")], components: [] })
            }
            await interaction.client.databaseEditData(`update user_missions set mission_status = ? where user_id = ? and id = ?`, ["cancelled", interaction.user.id, userInfo.missions_id])
            return collector.stop();
        } else {
            interaction.editReply({ embeds: [interaction.client.redEmbed("Interaction has been canceled.", "Stopped")], components: [] })
        }

        if (["left", "right"].includes(i.customId)) {
            if (index < 0) {
                index += maxIndex + 1;
            }
            if (index > maxIndex) {
                index -= maxIndex + 1;
            }
            if (searchMissionByStatus === null) {
                await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(missionsData[index][0], "MISSIONS LIST", interaction.user, `Page ${index + 1} of ${maxIndex + 1}`, "https://i.imgur.com/RBt8b5B.gif")] });
            } else {
                await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(missionsData[index][0], `MISSIONS LIST <${searchMissionByStatus.toUpperCase()}>`, interaction.user, `Page ${index + 1} of ${maxIndex + 1}`, "https://i.imgur.com/RBt8b5B.gif")] });
            }
        }

    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}