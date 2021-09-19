const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('choose the map to warp to'),
    async execute(interaction) {
        try {
            let user = await interaction.client.getUserAccount(interaction.user.id);
            let userCd = await interaction.client.databaseSelcetData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            if (typeof user === 'undefined') {
                await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
                return;
            }

            let mapId = 1;
            if (Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && user.next_map_id !== 1) {
                mapId = user.next_map_id;
                await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [mapId, interaction.user.id]);
            }
            else
                mapId = user.map_id;

            if (mapId === 1) {
                await interaction.reply({ embeds: [interaction.client.redEmbed("**Please finish the tutorial first**")] });
                return;
            }

            let map = await interaction.client.databaseSelcetData("SELECT linked_map_id_1, linked_map_id_2, linked_map_id_3, linked_map_id_4 FROM map WHERE map_id = ?", [mapId]);
            let row = await selectMenu(map[0].linked_map_id_1, map[0].linked_map_id_2, map[0].linked_map_id_3, map[0].linked_map_id_4);
            interaction.reply({ embeds: [interaction.client.yellowEmbed(" ", "Select map")], components: [row] });
            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
            let selected = false;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

            collector.on('collect', async i => {
                selected = true;
                mapId = i.values[0].replace("-", "");
                if (i.values[0] === "111" || i.values[0] === "222" || i.values[0] === "333" || i.values[0] === "444")
                    i.update({ embeds: [interaction.client.redEmbed("Command cancelled",)], components: [] });
                else {
                    await interaction.client.databaseEditData("UPDATE users SET next_map_id = ? WHERE user_id = ?", [mapId, interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_cd SET 	moving_to_map = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                    i.update({ embeds: [interaction.client.greenEmbed(`Moving toward the portal of map ${i.values[0]}`,)], components: [] });
                }
                collector.stop("Selected");
            });

            collector.on('end', collected => {
                if (!selected)
                    interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] });
            });

        } catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
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