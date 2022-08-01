const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('choose the map to warp to'),
    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 2) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let userCd = await interaction.client.databaseSelectData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            let mapId = 1;
            let map = 0;
            let row = 0;
            let nextMapName = 1;
            let elapsedTimeFromWarp = Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000);
            let elapsedTimeFromWarpMinutes = 0;
            let elapsedTimeFromWarpSeconds = 0;
            if (elapsedTimeFromWarp >= 0 && userInfo.next_map_id !== 1) {
                await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [interaction.user.id]);
                mapId = userInfo.next_map_id;
                await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [mapId, interaction.user.id]);
                map = await interaction.client.databaseSelectData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'currentMap').format(map[0].map_name), interaction.client.getWordLanguage(serverSettings.lang, 'selectedMap'))], components: [row] });
            }
            else if (userInfo.next_map_id !== 1) {
                mapId = userInfo.map_id;
                map = await interaction.client.databaseSelectData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                nextMapName = userInfo.next_map_id / 10;
                nextMapName = `${~~(nextMapName)}-${~~((nextMapName - ~~(nextMapName)) * 10)}`;
                elapsedTimeFromWarpMinutes = elapsedTimeFromWarp / -60;
                elapsedTimeFromWarpSeconds = Math.floor((elapsedTimeFromWarpMinutes % 1.0) * 60);
                elapsedTimeFromWarpMinutes = Math.floor(elapsedTimeFromWarpMinutes);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'currentMap_2').format(map[0].map_name, elapsedTimeFromWarpMinutes, elapsedTimeFromWarpSeconds, nextMapName,), interaction.client.getWordLanguage(serverSettings.lang, 'selectedMap'))], components: [row] });
            }
            else {
                mapId = userInfo.map_id;
                map = await interaction.client.databaseSelectData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'currentMap').format(map[0].map_name), interaction.client.getWordLanguage(serverSettings.lang, 'selectedMap'))], components: [row] });
            }


            const filter = i => i.user.id == interaction.user.id && i.message.interaction.id == interaction.id;
            let selected = false;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

            collector.on('collect', async i => {
                try {
                    selected = true;
                    if (nextMapName == i.values[0]) {
                        userCd = await interaction.client.databaseSelectData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
                        elapsedTimeFromWarp = Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / -1000);
                        elapsedTimeFromWarpMinutes = elapsedTimeFromWarp / 60;
                        elapsedTimeFromWarpSeconds = Math.floor((elapsedTimeFromWarpMinutes % 1.0) * 60);
                        elapsedTimeFromWarpMinutes = Math.floor(elapsedTimeFromWarpMinutes);
                        i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'warp').format(elapsedTimeFromWarpMinutes, elapsedTimeFromWarpSeconds, i.values[0]))], components: [] });
                    }
                    else {
                        mapId = i.values[0].split("-");
                        if (i.values[0] == "111" || i.values[0] == "222" || i.values[0] == "333" || i.values[0] == "444")
                            i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'cancel'))], components: [] });
                        else {
                            let levelRequirement = 0;
                            if ((userInfo.firm == "Luna" && mapId[0] == "2") || (userInfo.firm == "Terra" && mapId[0] == "1") || (userInfo.firm == "Marte" && mapId[0] == "3")) {
                                levelRequirement = await interaction.client.databaseSelectData("SELECT level_requirement FROM map WHERE map_id = ?", [mapId[0] + mapId[1]]);
                                levelRequirement = levelRequirement[0].level_requirement;
                            }
                            else {
                                levelRequirement = await interaction.client.databaseSelectData("SELECT enemy_level_requirement FROM map WHERE map_id = ?", [mapId[0] + mapId[1]]);
                                levelRequirement = levelRequirement[0].enemy_level_requirement;
                            }

                            let timeToReachMapMinutes = 400000 / (userInfo.user_speed * userInfo.user_speed);
                            let timeToReachMapSeconds = Math.floor((timeToReachMapMinutes % 1.0) * 60);
                            timeToReachMapMinutes = Math.floor(timeToReachMapMinutes);
                            let dateToReachMap = new Date();
                            dateToReachMap.setMinutes(dateToReachMap.getMinutes() + timeToReachMapMinutes);
                            dateToReachMap.setSeconds(dateToReachMap.getSeconds() + timeToReachMapSeconds);
                            //dateToReachMap = dateToReachMap.toJSON().split(".");
                            //dateToReachMap = dateToReachMap[0];

                            if (userInfo.level >= levelRequirement) {
                                await interaction.client.databaseEditData("UPDATE users SET next_map_id = ? WHERE user_id = ?", [mapId[0] + mapId[1], interaction.user.id]);
                                await interaction.client.databaseEditData("UPDATE user_cd SET moving_to_map = ? WHERE user_id = ?", [dateToReachMap, interaction.user.id]);
                                i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'warp').format(timeToReachMapMinutes, timeToReachMapSeconds, i.values[0]),)], components: [] });
                            }
                            else {
                                i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'warpFail').format(levelRequirement), "ERROR!")], components: [] });
                            }

                        }
                    }
                    collector.stop("Selected");
                }
                catch (error) { }
            });

            collector.on('end', collected => {
                if (!selected)
                    interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] });
            });

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
async function selectMenu(optionOne, optionTwo, optionThree, optionFour) {
    let descriptionOne = optionOne;
    let descriptionTwo = optionTwo;
    let descriptionThree = optionThree;
    let descriptionFour = optionFour;
    if (optionOne == "1") {
        descriptionOne = "Cancel";
        optionOne = "111";
    }
    if (optionTwo == "1") {
        descriptionTwo = "Cancel";
        optionTwo = "222";
    }
    if (optionThree == "1") {
        descriptionThree = "Cancel";
        optionThree = "333";
    }
    if (optionFour == "1") {
        descriptionFour = "Cancel";
        optionFour = "444";
    }


    let row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('select')
                .setPlaceholder('Select map')
                .addOptions([
                    {
                        label: 'Option 1:',
                        description: descriptionOne,
                        value: optionOne,
                    },
                    {
                        label: 'Option 2:',
                        description: descriptionTwo,
                        value: optionTwo,
                    },
                    {
                        label: 'Option 3:',
                        description: descriptionThree,
                        value: optionThree,
                    },
                    {
                        label: 'Option 4:',
                        description: descriptionFour,
                        value: optionFour,
                    },
                ]),
        )
    return row;
}