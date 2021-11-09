const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('choose the map to warp to'),
    async execute(interaction, userInfo) {
        try {
            /*
            let date = new Date();
            console.log(date);
            date.setMinutes(date.getMinutes() + 60);
            console.log(date.toJSON()); 
            */
            if (userInfo.tutorial_counter < 2) {
                await interaction.reply({ embeds: [interaction.client.redEmbed("**Please finish the tutorial first**")] });
                return;
            }
            let userCd = await interaction.client.databaseSelcetData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            let mapId = 1;
            let map = 0;
            let row = 0;
            let nextMapName = 1;
            let elapsedTimeFromWarp = Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000);
            let elapsedTimeFromWarpMinutes = 0;
            let elapsedTimeFromWarpSeconds = 0;
            if (elapsedTimeFromWarp >= 0 && userInfo.next_map_id !== 1) {
                mapId = userInfo.next_map_id;
                await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [mapId, interaction.user.id]);
                map = await interaction.client.databaseSelcetData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(`Currently at **${map[0].map_name}**\nSelect destination:`, "Select map")], components: [row] });
            }
            else if (userInfo.next_map_id !== 1) {
                mapId = userInfo.map_id;
                map = await interaction.client.databaseSelcetData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                nextMapName = userInfo.next_map_id / 10;
                nextMapName = `${Math.floor(nextMapName)}-${Math.floor((nextMapName % 1.0) * 10)}`;
                elapsedTimeFromWarpMinutes = elapsedTimeFromWarp / -60;
                elapsedTimeFromWarpSeconds = Math.floor((elapsedTimeFromWarpMinutes % 1.0) * 60);
                elapsedTimeFromWarpMinutes = Math.floor(elapsedTimeFromWarpMinutes);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(`Currently at **${map[0].map_name}**\n**${elapsedTimeFromWarpMinutes}m and ${elapsedTimeFromWarpSeconds}s** to reach **${nextMapName}**\nChange destination to:`, "Select map")], components: [row] });
            }
            else {
                mapId = userInfo.map_id;
                map = await interaction.client.databaseSelcetData("SELECT map_name, linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
                row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
                interaction.reply({ embeds: [interaction.client.yellowEmbed(`Currently at **${map[0].map_name}**\nSelect destination:`, "Select map")], components: [row] });
            }


            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
            let selected = false;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

            collector.on('collect', async i => {
                selected = true;
                if (nextMapName === i.values[0]) {
                    userCd = await interaction.client.databaseSelcetData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
                    elapsedTimeFromWarp = Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / -1000);
                    elapsedTimeFromWarpMinutes = elapsedTimeFromWarp / 60;
                    elapsedTimeFromWarpSeconds = Math.floor((elapsedTimeFromWarpMinutes % 1.0) * 60);
                    elapsedTimeFromWarpMinutes = Math.floor(elapsedTimeFromWarpMinutes);
                    i.update({ embeds: [interaction.client.greenEmbed(`**${elapsedTimeFromWarpMinutes}m and ${elapsedTimeFromWarpSeconds}s** to warp to map **${i.values[0]}**`,)], components: [] });
                }
                else {
                    mapId = i.values[0].split("-");
                    if (i.values[0] === "111" || i.values[0] === "222" || i.values[0] === "333" || i.values[0] === "444")
                        i.update({ embeds: [interaction.client.redEmbed("Command cancelled",)], components: [] });
                    else {
                        let level_requirement = 0;
                        if ((userInfo.firm === "Moon" && mapId[0] === "1") || (userInfo.firm === "Earth" && mapId[0] === "2") || (userInfo.firm === "Mars" && mapId[0] === "3")) {
                            level_requirement = await interaction.client.databaseSelcetData("SELECT level_requirement FROM map WHERE map_id = ?", [mapId[0] + mapId[1]]);
                            level_requirement = level_requirement[0].level_requirement;
                        }
                        else {
                            level_requirement = await interaction.client.databaseSelcetData("SELECT enemy_level_requirement FROM map WHERE map_id = ?", [mapId[0] + mapId[1]]);
                            level_requirement = level_requirement[0].enemy_level_requirement;
                        }

                        let timeToReachMapMinutes = 400000 / (userInfo.user_speed * userInfo.user_speed);
                        let timeToReachMapSeconds = Math.floor((timeToReachMapMinutes % 1.0) * 60);
                        timeToReachMapMinutes = Math.floor(timeToReachMapMinutes);
                        let dateToReachMap = new Date();
                        dateToReachMap.setMinutes(dateToReachMap.getMinutes() + timeToReachMapMinutes);
                        dateToReachMap.setSeconds(dateToReachMap.getSeconds() + timeToReachMapSeconds);
                        dateToReachMap = dateToReachMap.toJSON().split(".");
                        dateToReachMap = dateToReachMap[0];

                        if (userInfo.level >= level_requirement) {
                            await interaction.client.databaseEditData("UPDATE users SET next_map_id = ? WHERE user_id = ?", [mapId[0] + mapId[1], interaction.user.id]);
                            await interaction.client.databaseEditData("UPDATE user_cd SET moving_to_map = ? WHERE user_id = ?", [dateToReachMap, interaction.user.id]);
                            i.update({ embeds: [interaction.client.greenEmbed(`**${timeToReachMapMinutes}m and ${timeToReachMapSeconds}s** to warp to map **${i.values[0]}**`,)], components: [] });
                        }
                        else {
                            i.update({ embeds: [interaction.client.redEmbed(`**You do not meet the level requirement.**\n*Reach level ${level_requirement} to unlock*`, "ERROR!")], components: [] });
                        }

                    }
                }
                collector.stop("Selected");
            });

            collector.on('end', collected => {
                if (!selected)
                    interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] });
            });

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
async function selectMenu(optionOne, optionTwo, optionThree, optionFour) {
    let descriptionOne = optionOne;
    let descriptionTwo = optionTwo;
    let descriptionThree = optionThree;
    let descriptionFour = optionFour;
    if (optionOne === "1") {
        descriptionOne = "Cancel";
        optionOne = "111";
    }
    if (optionTwo === "1") {
        descriptionTwo = "Cancel";
        optionTwo = "222";
    }
    if (optionThree === "1") {
        descriptionThree = "Cancel";
        optionThree = "333";
    }
    if (optionFour === "1") {
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