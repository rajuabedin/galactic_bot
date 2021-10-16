const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Check your quests')
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
            var questListDB = []
            var searchQuestByStatus = interaction.options.getString('status')
            if (searchQuestByStatus !== null) {
                questListDB = await interaction.client.databaseSelcetData("SELECT * from user_quests Inner JOIN quests on user_quests.quest_id= quests.quest_id where user_id = ? and quest_status = ?", [interaction.user.id, searchQuestByStatus.toLowerCase()]);
            } else {
                questListDB = await interaction.client.databaseSelcetData("SELECT * from user_quests Inner JOIN quests on user_quests.quest_id= quests.quest_id where user_id = ? and id = ? and quest_status = ?", [interaction.user.id, userInfo.quests_id, "active"]);
            }
            if (questListDB === undefined || questListDB.length == 0) {
                if (searchQuestByStatus !== null) {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(`Unable to find any quests with status [${searchQuestByStatus.toUpperCase()}](https://obelisk.club/)!`)] });
                } else {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(`Unable to find any quests!`)] });
                }
            }
            var questList = [];
            var embed;
            var count = 0;
            var questsPerPage = 1;
            var currentData = "";
            var questExpired = false;

            await questListDB.forEach(async (quest, index) => {
                count++;

                var todo = "";
                var task = quest.quest_task.split(";");
                var taskQuantity = quest.quest_task_quantity.split(";");
                var taskQuantityLeft = quest.quest_task_left.split(";");
                var availableMap = "No Map Restriction";

                if (quest.map_id > 0) {
                    availableMap = quest.map_id;
                }

                if (quest.quest_limit > 0) {
                    var questEndTime = Date.parse(quest.quest_started_at) + (quest.quest_limit * 60 * 60 * 1000);
                    var currentTime = new Date().getTime();

                    var distance = questEndTime - currentTime;

                    // Time calculations for days, hours, minutes and seconds
                    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                }




                var timeLeftMsg = ""
                if (quest.quest_limit > 0) {
                    if (distance < 0) {
                        timeLeftMsg = "[EXPIRED❗](https://obelisk.club/)";
                        questExpired = true;
                        await interaction.client.databaseEditData(`update user_quests set quest_status = ? where user_id = ? and id = ?`, ["expired", interaction.user.id, userInfo.quests_id])
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

                if (quest.quest_reward_credit > 0) reward += `Credit - ${quest.quest_reward_credit}`;

                if (quest.quest_reward_units > 0) {
                    if (reward != "") {
                        reward += ` | Units - ${quest.quest_reward_units}`;
                    } else {
                        reward += `Units - ${quest.quest_reward_units}`;
                    }
                }

                if (quest.quest_reward_exp > 0) {
                    if (reward != "") {
                        reward += ` | Exp - ${quest.quest_reward_exp}`;
                    } else {
                        reward += `Exp - ${quest.quest_reward_exp}`;
                    }
                }

                if (quest.quest_reward_honor > 0) {
                    if (reward != "") {
                        reward += ` | Honor - ${quest.quest_reward_honor}`;
                    } else {
                        reward += `Honor - ${quest.quest_reward_honor}`;
                    }
                }

                if (quest.quest_reward_items != null && quest.quest_reward_items !== "") {
                    if (reward != "") {
                        reward += ` | Materials: ${quest.quest_reward_items}`;
                    } else {
                        reward += `Materials: - ${quest.quest_reward_items}`;
                    }
                }

                currentData += "**Quest Info**\n**ID :** `" + quest.quest_id + "`\n**Quest Type:** [" + quest.quest_type + "](https://obelisk.club/)\n**Map Restriction:** " + availableMap + "\n**Quest Reward(s)**\n" + reward + "\n**Quest Time Left:** " + timeLeftMsg + "\n**Quest Objective Status:**```" + todo + "```";

                if (count === questsPerPage) {
                    questList.push([currentData, quest.quest_id, quest.quest_task_quantity]);
                    count = 0;
                    currentData = "";
                }
            });

            var maxPages = questList.length;

            if (questList == "") {
                if (!questExpired) {
                    embed = interaction.client.redEmbed("Quest not found!");
                } else {
                    embed = interaction.client.redEmbed("Quest expired!");
                }

            } else {
                if (searchQuestByStatus === null) {
                    embed = interaction.client.yellowPagesImageEmbed(questList[0][0], "QUESTS LIST", interaction.user, `Page 1 of ${maxPages}`, "https://i.imgur.com/RBt8b5B.gif");
                } else {
                    embed = interaction.client.yellowPagesImageEmbed(questList[0][0], `QUESTS LIST <${searchQuestByStatus.toUpperCase()}>`, interaction.user, `Page 1 of ${maxPages}`, "https://i.imgur.com/RBt8b5B.gif");
                }


            }
            if (searchQuestByStatus === null) {
                if (questExpired === false && questListDB.length > 0) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                } else {
                    await interaction.reply({ embeds: [embed], components: [] });
                }

            } else {
                await interaction.reply({ embeds: [embed], components: [rowLeftRight] });
            }

            buttonHandler(interaction, questList, userInfo, searchQuestByStatus);
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

function buttonHandler(interaction, questsData, userInfo) {
    let maxIndex = questsData.length - 1;
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
                await i.editReply({ embeds: [interaction.client.blueEmbed("Do you really want to stop this quest?", "Quest Cancellation")], components: [rowYesNo] });
            } else {
                await i.update({ embeds: [interaction.client.blueEmbed("Do you really want to stop this quest?", "Quest Cancellation")], components: [rowYesNo] });
            }
        } else if (i.customId === "yes") {
            if (i.replied) {
                await i.editReply({ embeds: [interaction.client.greenEmbed("You have successfully cancelled the quest.", "Cancelled")], components: [] })
            } else {
                await i.update({ embeds: [interaction.client.greenEmbed("You have successfully cancelled the quest.", "Cancelled")], components: [] })
            }
            await interaction.client.databaseEditData(`update user_quests set quest_status = ? where user_id = ? and id = ?`, ["cancelled", interaction.user.id, userInfo.quests_id])
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
            if (searchQuestByStatus === null) {
                await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(questsData[index][0], "QUESTS LIST", interaction.user, `Page ${index + 1} of ${maxIndex + 1}`, "https://i.imgur.com/RBt8b5B.gif")] });
            } else {
                await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(questsData[index][0], `QUESTS LIST <${searchQuestByStatus.toUpperCase()}>`, interaction.user, `Page ${index + 1} of ${maxIndex + 1}`, "https://i.imgur.com/RBt8b5B.gif")] });
            }
        }

    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}