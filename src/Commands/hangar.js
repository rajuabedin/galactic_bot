const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanger')
        .setDescription('Equipment Hanger!'),

    async execute(interaction) {
        try {
            let user = await interaction.client.getUserAccount(interaction.user.id);
            if (typeof user === 'undefined') {
                await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
                return;
            }

            let timestamp = Math.floor(interaction.createdTimestamp / 1000);
            const filter = i => i.user.id === interaction.user.id && Math.floor(i.message.createdTimestamp / 1000) === timestamp;

            let max_equipable_laser = 6;
            let laser_items_to_equip = [[150, "lf3_1", "q1"], [100, "lf2_1", "q2"], [150, "lf3_1", "q3"], [155, "lf3_2", "q4"], [165, "lf3_4", "q5"], [160, "lf3_3", "q6"]];
            let laser_items_equipped = [[50, "lf1_1", "q1"], [60, "lf1_3", "q2"], [55, "lf1_2", "q1"], [70, "lf1_5", "q2"], [80, "lf1_7", "q1"], [65, "lf1_4", "q2"]];
            let equipped_laser_length = laser_items_equipped.length - 1;

            let [row, row1, row2, row3, message] = [0, 0, 0, 0, 0];
            if (equipped_laser_length === max_equipable_laser - 1)
                [row, row1, row2, row3, message] = await buttonHandler(laser_items_to_equip, laser_items_equipped, "DANGER");
            else
                [row, row1, row2, row3, message] = await buttonHandler(laser_items_to_equip, laser_items_equipped);

            let equipped_laser_message = `**You have equipped ${equipped_laser_length + 1}/${max_equipable_laser} lasers**`;
            let stored_message = `**Data returned to:**\nEquipped ${equipped_laser_length + 1}/${max_equipable_laser} lasers\n ${message}`;
            await interaction.reply({ embeds: [interaction.client.yellowEmbed(message, equipped_laser_message)], ephemeral: true, components: [row, row1, row2, row3, row4] });

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

            let discarded_message = true;

            collector.on('collect', async i => {
                collector.resetTimer({ time: 10000 });
                let index = parseInt(i.customId);
                //console.log(i.component.style);
                if (i.component.customId === "save") {
                    await i.update({ embeds: [interaction.client.greenEmbed(`${equipped_laser_message}\n${message}`, "SAVED")], components: [] });
                    discarded_message = false;

                    //Send data to database

                    collector.stop("Saved");
                }
                else if (i.component.customId === "discard") {
                    await i.update({ embeds: [interaction.client.redEmbed(stored_message, "DISCARDED")], components: [] });
                    discarded_message = false;
                    collector.stop("Discarded");
                }
                else if (i.component.label === "          " || i.component.label === "            ") {
                    await i.update({});
                }
                else if (i.component.style === "PRIMARY") {
                    equipped_laser_length++;
                    laser_items_equipped = laser_items_equipped.concat(laser_items_to_equip.splice(index - equipped_laser_length, 1));
                    if (equipped_laser_length === max_equipable_laser - 1)
                        [row, row1, row2, row3, message] = await buttonHandler(laser_items_to_equip, laser_items_equipped, "DANGER");
                    else
                        [row, row1, row2, row3, message] = await buttonHandler(laser_items_to_equip, laser_items_equipped);
                    equipped_laser_message = `**You have equipped ${equipped_laser_length + 1}/${max_equipable_laser} lasers**\n`;
                    await i.update({ embeds: [interaction.client.greenEmbed(message, equipped_laser_message)], components: [row, row1, row2, row3, row4] });
                }
                else if (i.component.style === "SUCCESS") {
                    equipped_laser_length--;
                    laser_items_to_equip = laser_items_to_equip.concat(laser_items_equipped.splice(index, 1));
                    [row, row1, row2, row3, message] = await buttonHandler(laser_items_to_equip, laser_items_equipped);
                    equipped_laser_message = `**You have equipped ${equipped_laser_length + 1}/${max_equipable_laser} lasers**\n`;
                    await i.update({ embeds: [interaction.client.blueEmbed(message, equipped_laser_message)], components: [row, row1, row2, row3, row4] });
                }
                else {
                    await i.update({ embeds: [interaction.client.redEmbed(message, "**ERROR! Max capacity reached!**")], components: [row, row1, row2, row3, row4] });
                }
            });

            collector.on('end', collected => {
                if (discarded_message)
                    interaction.editReply({ embeds: [interaction.client.redEmbed(stored_message, "DISCARDED")], components: [] });
                else
                    interaction.editReply({ components: [] })
                //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
            });
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}


async function buttonHandler(laser_items_to_equip, laser_items_equipped, button_styile = "PRIMARY") {

    laser_items_to_equip = laser_items_to_equip.sort(function (a, b) {
        return b[0] - a[0];
    });
    laser_items_equipped = laser_items_equipped.sort(function (a, b) {
        return b[0] - a[0];
    });

    let laser_items = laser_items_equipped.concat(laser_items_to_equip);

    let array_length = laser_items.length;
    if (array_length < 20) {
        laser_items.length = 20;
        laser_items.fill([0, "          ", "          "], array_length);
        //console.log(laser_items);
    }

    let equipped_laser_length = laser_items_equipped.length - 1;

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("0")
                .setLabel(laser_items[0][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("1")
                .setLabel(laser_items[1][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("2")
                .setLabel(laser_items[2][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("3")
                .setLabel(laser_items[3][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("4")
                .setLabel(laser_items[4][1])
                .setStyle(button_styile),
        );
    let row1 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("5")
                .setLabel(laser_items[5][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("6")
                .setLabel(laser_items[6][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("7")
                .setLabel(laser_items[7][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("8")
                .setLabel(laser_items[8][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("9")
                .setLabel(laser_items[9][1])
                .setStyle(button_styile),
        );
    let row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("10")
                .setLabel(laser_items[10][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("11")
                .setLabel(laser_items[11][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("12")
                .setLabel(laser_items[12][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("13")
                .setLabel(laser_items[13][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("14")
                .setLabel(laser_items[14][1])
                .setStyle(button_styile),
        );
    let row3 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("15")
                .setLabel(laser_items[15][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("16")
                .setLabel(laser_items[16][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("17")
                .setLabel(laser_items[17][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("18")
                .setLabel(laser_items[18][1])
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("19")
                .setLabel(laser_items[19][1])
                .setStyle(button_styile),
        );

    let index = 0;

    if (equipped_laser_length < 5) {
        for (item in laser_items_equipped) {
            row.components[index].setStyle('SUCCESS');
            index++;
        }
    }
    else if (equipped_laser_length < 10) {
        row.components[0].setStyle('SUCCESS');
        row.components[1].setStyle('SUCCESS');
        row.components[2].setStyle('SUCCESS');
        row.components[3].setStyle('SUCCESS');
        row.components[4].setStyle('SUCCESS');
        for (index; index <= equipped_laser_length - 5; index++) {
            row1.components[index].setStyle('SUCCESS');
        }
    }
    else {
        row.components[0].setStyle('SUCCESS');
        row.components[1].setStyle('SUCCESS');
        row.components[2].setStyle('SUCCESS');
        row.components[3].setStyle('SUCCESS');
        row.components[4].setStyle('SUCCESS');
        row1.components[0].setStyle('SUCCESS');
        row1.components[1].setStyle('SUCCESS');
        row1.components[2].setStyle('SUCCESS');
        row1.components[3].setStyle('SUCCESS');
        row1.components[4].setStyle('SUCCESS');
        for (index; index <= equipped_laser_length - 10; index++) {
            row2.components[index].setStyle('SUCCESS');
        }
    }

    let message = "Hanger";
    for (item in laser_items_equipped)
        message += ` + ${laser_items_equipped[item][1]}`;

    return [row, row1, row2, row3, message];
}

const row4 = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("discard")
            .setEmoji("🗑️")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("20")
            .setLabel("            ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("21")
            .setLabel("            ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("22")
            .setLabel("            ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("save")
            .setEmoji("💾")
            .setStyle("SUCCESS"),
    );

