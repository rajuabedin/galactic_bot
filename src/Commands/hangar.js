const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanger')
        .setDescription('Equipment Hanger!'),

    async execute(interaction) {
        //try {
        let user = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof user === 'undefined') {
            await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
            return;
        }

        let maxEquipableLaser = await interaction.client.databaseSelcetData("SELECT ships_info.laser_quantity FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);
        maxEquipableLaser = maxEquipableLaser[0].laser_quantity;

        let rawEquippedLaser = await interaction.client.databaseSelcetData("SELECT lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 1", [interaction.user.id]);
        let rawUnequippedLaser = await interaction.client.databaseSelcetData("SELECT lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 0", [interaction.user.id]);
        let laserItemsToEquip = [];
        let laserItemsEquipped = [];
        for (laser in rawEquippedLaser) {
            laserItemsEquipped.push([rawEquippedLaser[laser].damage_value * (1 + rawEquippedLaser[laser].per_increase_by_level / 1000 * rawEquippedLaser[laser].level), rawEquippedLaser[laser].laser_model + `_${rawEquippedLaser[laser].level}`, rawEquippedLaser[laser].laser_id]);
        }
        for (laser in rawUnequippedLaser) {
            laserItemsToEquip.push([rawUnequippedLaser[laser].damage_value * (1 + rawUnequippedLaser[laser].per_increase_by_level / 1000 * rawUnequippedLaser[laser].level), rawUnequippedLaser[laser].laser_model + `_${rawUnequippedLaser[laser].level}`, rawUnequippedLaser[laser].laser_id]);
        }
        let storedLaserItemsToEquip = laserItemsToEquip.slice();
        let storedLaserItemsEquipped = laserItemsEquipped.slice();
        console.log(laserItemsToEquip);
        //laserItemsToEquip = [[150, "lf3_1", "q1"], [100, "lf2_1", "q2"], [150, "lf3_1", "q3"], [155, "lf3_2", "q4"], [165, "lf3_4", "q5"], [160, "lf3_3", "q6"]];
        //laserItemsEquipped = [[50, "lf1_1", "q1"], [60, "lf1_3", "q2"], [55, "lf1_2", "q1"], [70, "lf1_5", "q2"], [80, "lf1_7", "q1"], [65, "lf1_4", "q2"]];
        let equippedLaserLength = laserItemsEquipped.length - 1;

        let [row, row1, row2, row3, message] = [0, 0, 0, 0, 0];
        if (equippedLaserLength === maxEquipableLaser - 1)
            [row, row1, row2, row3, message] = await buttonHandler(laserItemsToEquip, laserItemsEquipped, "DANGER");
        else
            [row, row1, row2, row3, message] = await buttonHandler(laserItemsToEquip, laserItemsEquipped);

        let equippedLaserMessage = `**You have equipped ${equippedLaserLength + 1}/${maxEquipableLaser} lasers:**`;
        let storedMessage = `**Data returned to:**\nEquipped ${equippedLaserLength + 1}/${maxEquipableLaser} lasers:\n ${message}`;
        await interaction.reply({ embeds: [interaction.client.yellowEmbed(message, equippedLaserMessage)], ephemeral: true, components: [row, row1, row2, row3, row4] });

        const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

        let discardedMessage = true;

        collector.on('collect', async i => {
            collector.resetTimer({ time: 10000 });
            let index = parseInt(i.customId);
            //console.log(i.component.style);
            if (i.component.customId === "save") {
                await i.update({ embeds: [interaction.client.greenEmbed(`${equippedLaserMessage}\n${message}`, "SAVED")], components: [] });
                discardedMessage = false;
                let totalDamage = 0;
                await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                for (laser in laserItemsEquipped){
                    totalDamage += laserItemsEquipped[laser][0];
                    await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 1 WHERE laser_id = ?`, [laserItemsEquipped[laser][2]]);                    
                }
                totalDamage = Math.floor(totalDamage)
                await interaction.client.databaseEditData(`UPDATE user_ships SET ship_damage = ? WHERE user_id = ?`, [totalDamage, interaction.user.id]);
                await interaction.client.databaseEditData(`UPDATE users SET user_damage = ? WHERE user_id = ?`, [totalDamage, interaction.user.id]);
                //Send data to database

                collector.stop("Saved");
            }
            else if (i.component.customId === "discard") {
                await i.update({ embeds: [interaction.client.redEmbed(storedMessage, "DISCARDED")], components: [] });
                discardedMessage = false;
                collector.stop("Discarded");
            }
            else if (i.component.label === "          " || i.component.label === "            ") {
                await i.update({});
            }
            else if (i.component.style === "PRIMARY") {
                equippedLaserLength++;
                laserItemsEquipped = laserItemsEquipped.concat(laserItemsToEquip.splice(index - equippedLaserLength, 1));
                if (equippedLaserLength === maxEquipableLaser - 1)
                    [row, row1, row2, row3, message] = await buttonHandler(laserItemsToEquip, laserItemsEquipped, "DANGER");
                else
                    [row, row1, row2, row3, message] = await buttonHandler(laserItemsToEquip, laserItemsEquipped);
                equippedLaserMessage = `**You have equipped ${equippedLaserLength + 1}/${maxEquipableLaser} lasers**\n`;
                await i.update({ embeds: [interaction.client.greenEmbed(message, equippedLaserMessage)], components: [row, row1, row2, row3, row4] });
            }
            else if (i.component.style === "SUCCESS") {
                equippedLaserLength--;
                laserItemsToEquip = laserItemsToEquip.concat(laserItemsEquipped.splice(index, 1));
                [row, row1, row2, row3, message] = await buttonHandler(laserItemsToEquip, laserItemsEquipped);
                equippedLaserMessage = `**You have equipped ${equippedLaserLength + 1}/${maxEquipableLaser} lasers**\n`;
                await i.update({ embeds: [interaction.client.blueEmbed(message, equippedLaserMessage)], components: [row, row1, row2, row3, row4] });
            }
            else {
                await i.update({ embeds: [interaction.client.redEmbed(message, "**ERROR! Max capacity reached!**")], components: [row, row1, row2, row3, row4] });
            }
        });

        collector.on('end', collected => {
            if (discardedMessage)
                interaction.editReply({ embeds: [interaction.client.redEmbed(storedMessage, "DISCARDED")], components: [] });
            else
                interaction.editReply({ components: [] })
            //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
        });
        /*}
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
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

    let message = "";
    for (item in laser_items_equipped)
        message += `${laser_items_equipped[item][1]} `;
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

