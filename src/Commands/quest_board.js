const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Get a quest and level up faster!')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Please enter quest type, id or monster name...')
                .setRequired(false)),

    async execute(interaction, userInfo) {
        try {
            var questListDB = await interaction.client.databaseSelcetData("SELECT * from quests", [interaction.user.id]);
            if (questListDB === undefined || questListDB.length == 0) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any quests!")] });
            } else {
                var searchQuest = interaction.options.getString('search')
                var questList = [];
                var embed;
                var count = 0;
                var questsPerPage = 1;
                var currentData = "";

                if (searchQuest === null) {
                    await questListDB.forEach((quest, index) => {
                        count++;

                        var todo = "";
                        var task = quest.quest_task.split(";");
                        var taskQuantity = quest.quest_task_quantity.split(";");
                        var timeLeftMsg = "";

                        if (quest.quest_limit > 0) {
                            timeLeftMsg = quest.quest_limit + " H";
                        } else {
                            timeLeftMsg = "[NO TIME LIMIT](https://obelisk.club/)";
                        }

                        for (index = 0; index < task.length; index++) {
                            todo += "⦿ " + task[index] + " - " + taskQuantity[index] + "\n";
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

                        currentData += "**Quest Info**\n**ID :** `" + quest.quest_id + "`\n**Quest Type:** [" + quest.quest_type + "](https://obelisk.club/)\n**Quest Reward(s)**\n" + reward + "\n**Quest Duration:** " + timeLeftMsg + "\n**Quest Objective:**```" + todo + "```";

                        if (count === questsPerPage) {
                            questList.push([currentData, quest.quest_id, quest.quest_task_quantity]);
                            count = 0;
                            currentData = "";
                        }
                    });
                } else {
                    await questListDB.forEach((quest, index) => {

                        if (quest.quest_type.toLowerCase().includes(searchQuest.toLowerCase()) || quest.quest_task.toLowerCase().includes(searchQuest.toLowerCase())
                            || quest.quest_reward_items.toLowerCase().includes(searchQuest.toLowerCase()) || quest.quest_id === parseInt(searchQuest)) {
                            count++;

                            var todo = "";
                            var task = quest.quest_task.split(";");
                            var taskQuantity = quest.quest_task_quantity.split(";");
                            var timeLeftMsg = "";

                            if (quest.quest_limit > 0) {
                                timeLeftMsg = quest.quest_limit + " H";
                            } else {
                                timeLeftMsg = "[NO TIME LIMIT](https://obelisk.club/)";
                            }

                            for (index = 0; index < task.length; index++) {
                                todo += "⦿ " + task[index] + " - " + taskQuantity[index] + "\n";
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

                            currentData += "**Quest Info**\n**ID :** `" + quest.quest_id + "`\n**Quest Type:** [" + quest.quest_type + "](https://obelisk.club/)\n**Quest Reward(s)**\n" + reward + "\n**Quest Duration:** " + timeLeftMsg + "\n**Quest Objective:**```" + todo + "```";

                            if (count === questsPerPage) {
                                questList.push([currentData, quest.quest_id, quest.quest_task_quantity]);
                                count = 0;
                                currentData = "";
                            }
                        }
                    });
                }


                var maxPages = questList.length;

                if (questList == "") {
                    embed = interaction.client.redEmbed("Quest not found!");
                } else {
                    embed = interaction.client.yellowPagesImageEmbed(questList[0][0], "QUESTS BOARD", interaction.user, `Page 1 of ${maxPages}`, "https://obelisk.club/npc/quests.png");
                }
                if (questList.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(interaction, questList, userInfo);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }


            }
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

function buttonHandler(interaction, questsData, userInfo) {
    let maxIndex = questsData.length - 1;
    let index = 0;
    let selectedQuestID = -1;
    var hasActiveQuest = false;
    var activeQuestID = 0;

    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (i.customId === 'left') {
            index--;
        } else if (i.customId === 'right') {
            index++;
        } else if (i.customId === "get") {
            if (userInfo.quests_id != null) {
                var userQuest = await interaction.client.databaseSelcetData("SELECT * from user_quests where user_id = ? and id = ?", [interaction.user.id, userInfo.quests_id]);
                var userQuest = userQuest[0];

                if (typeof userQuest !== 'undefined') {
                    var userQuestInfo = await interaction.client.databaseSelcetData("SELECT * from quests where quest_id = ?", [userQuest.quest_id]);
                    var userQuestInfo = userQuestInfo[0];
                    var mySqlTimeStamp = userQuest.quest_started_at;
                    var nowTimeStamp = new Date();
                    var resolutionTime = ((((nowTimeStamp - mySqlTimeStamp) / 1000) / 60) / 60);
                    if (userQuestInfo.quest_limit > resolutionTime) {
                        hasActiveQuest = true;
                        activeQuestID = userInfo.quests_id;
                    } else {
                        await interaction.client.databaseEditData(`update user_quests set quest_status = ? where user_id = ? and id = ?`, ["expired", interaction.user.id, userInfo.quests_id])
                    }
                }
            }
            selectedQuestID = questsData[index][1];
            if (hasActiveQuest) {
                if (i.replied) {
                    await i.editReply({ embeds: [interaction.client.blueEmbed("You already have active quest. Do you still want to continue?", "Active Quest Found")], components: [rowYesNo] });
                } else {
                    await i.update({ embeds: [interaction.client.blueEmbed("You already have active quest. Do you still want to continue?", "Active Quest Found")], components: [rowYesNo] });
                }

            } else {
                if (i.replied) {
                    await i.editReply({ embeds: [interaction.client.blueEmbed("Do you really want to accepted this quest?", "Start Quest")], components: [rowYesNo] });
                } else {
                    await i.update({ embeds: [interaction.client.blueEmbed("Do you really want to accepted this quest?", "Start Quest")], components: [rowYesNo] });
                }

            }
        } else if (i.customId === "yes") {
            var query = `insert into user_quests (quest_id, quest_task_left, user_id) values (?,?,?)`;
            var questId = await interaction.client.databaseEditDataReturnID(query, [selectedQuestID, questsData[index][2], interaction.user.id])
            await interaction.client.databaseEditData(`update users set quests_id = ? where user_id = ?`, [questId, interaction.user.id])
            if (i.replied) {
                await i.editReply({ embeds: [interaction.client.greenEmbed("You have successfully started the quest.", "Successfull")], components: [] })
            } else {
                await i.update({ embeds: [interaction.client.greenEmbed("You have successfully started the quest.", "Successfull")], components: [] })
            }
            if (hasActiveQuest) {
                await interaction.client.databaseEditData(`update user_quests set quest_status = ? where user_id = ? and id = ?`, ["cancelled", interaction.user.id, activeQuestID])
            }
            return collector.stop();
        } else {
            interaction.editReply({ embeds: [interaction.client.redEmbed("Interaction has been canceled.", "Cancelled")], components: [] })
        }

        if (["left", "right"].includes(i.customId)) {
            if (index < 0) {
                index += maxIndex + 1;
            }
            if (index > maxIndex) {
                index -= maxIndex + 1;
            }
            await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(questsData[index][0], "QUESTS BOARD", interaction.user, `Page ${index + 1} of ${maxIndex + 1}`, "https://obelisk.club/npc/quests.png")] });
        }

    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}