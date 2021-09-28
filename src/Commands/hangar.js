const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanger')
        .setDescription('Edit ship equipment')
        .addSubcommand(subcommand =>
            subcommand
                .setName('laser')
                .setDescription('Edit lasers on ship'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('shield')
                .setDescription('Edit shields on ship'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('engine')
                .setDescription('Edit engines on ship')),

    async execute(interaction, userInfo) {
        try {
            let maxEquipableItem = 0;
            let itemsToEquip = [];
            let itemsEquipped = [];
            let baseSpeed = 0;
            let displayEquippedItemlenght = 0;

            if (interaction.options.getSubcommand() === 'laser') {
                let rawEquippedLaser = await interaction.client.databaseSelcetData("SELECT lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedLaser = await interaction.client.databaseSelcetData("SELECT lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 0", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelcetData("SELECT ships_info.laser_quantity FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);


                for (item in rawEquippedLaser) {
                    itemsEquipped.push([rawEquippedLaser[item].damage_value * (1 + rawEquippedLaser[item].per_increase_by_level / 1000 * rawEquippedLaser[item].level), rawEquippedLaser[item].laser_model + `_${rawEquippedLaser[item].level}`, rawEquippedLaser[item].laser_id]);
                }
                for (item in rawUnequippedLaser) {
                    itemsToEquip.push([rawUnequippedLaser[item].damage_value * (1 + rawUnequippedLaser[item].per_increase_by_level / 1000 * rawUnequippedLaser[item].level), rawUnequippedLaser[item].laser_model + `_${rawUnequippedLaser[item].level}`, rawUnequippedLaser[item].laser_id]);
                }
                displayEquippedItemlenght = itemsEquipped.length;
                maxEquipableItem = maxEquipableItem[0].laser_quantity;
            }
            else if (interaction.options.getSubcommand() === 'shield') {
                let rawEquippedShield = await interaction.client.databaseSelcetData("SELECT shields_info.absorption_rate, shields_info.shield_value, shields_info.per_increase_by_level, user_shields.level, user_shields.shield_model, user_shields.shield_id FROM user_shields INNER JOIN shields_info ON user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedShield = await interaction.client.databaseSelcetData("SELECT shields_info.absorption_rate, shields_info.shield_value, shields_info.per_increase_by_level, user_shields.level, user_shields.shield_model, user_shields.shield_id FROM user_shields INNER JOIN shields_info ON user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? AND equipped = 0", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelcetData("SELECT ships_info.extra_quantity, user_ships.equipped_extra FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);

                for (item in rawEquippedShield) {
                    itemsEquipped.push([rawEquippedShield[item].shield_value * (1 + rawEquippedShield[item].per_increase_by_level / 1000 * rawEquippedShield[item].level), rawEquippedShield[item].shield_model + `_${rawEquippedShield[item].level}`, rawEquippedShield[item].shield_id, rawEquippedShield[item].absorption_rate]);
                }
                for (item in rawUnequippedShield) {
                    itemsToEquip.push([rawUnequippedShield[item].shield_value * (1 + rawUnequippedShield[item].per_increase_by_level / 1000 * rawUnequippedShield[item].level), rawUnequippedShield[item].shield_model + `_${rawUnequippedShield[item].level}`, rawUnequippedShield[item].shield_id, rawUnequippedShield[item].absorption_rate]);
                }
                displayEquippedItemlenght = maxEquipableItem[0].equipped_extra;
                maxEquipableItem = maxEquipableItem[0].extra_quantity;
            }
            else {
                let rawEquippedEngine = await interaction.client.databaseSelcetData("SELECT engines_info.speed_value, user_engines.engine_model, user_engines.engine_id FROM user_engines INNER JOIN engines_info ON user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedEngine = await interaction.client.databaseSelcetData("SELECT engines_info.speed_value, user_engines.engine_model, user_engines.engine_id FROM user_engines INNER JOIN engines_info ON user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? AND equipped = 0", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelcetData("SELECT ships_info.ship_base_speed, ships_info.extra_quantity, user_ships.equipped_extra FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);

                for (item in rawEquippedEngine) {
                    itemsEquipped.push([rawEquippedEngine[item].speed_value, rawEquippedEngine[item].engine_model, rawEquippedEngine[item].engine_id]);
                }
                for (item in rawUnequippedEngine) {
                    itemsToEquip.push([rawUnequippedEngine[item].speed_value, rawUnequippedEngine[item].engine_model, rawUnequippedEngine[item].engine_id]);
                }
                displayEquippedItemlenght = maxEquipableItem[0].equipped_extra;
                baseSpeed = maxEquipableItem[0].ship_base_speed;
                maxEquipableItem = maxEquipableItem[0].extra_quantity;
            }

            let equippedItemLength = itemsEquipped.length - 1;


            let [row, row1, row2, row3, message] = [0, 0, 0, 0, 0];
            if (displayEquippedItemlenght === maxEquipableItem)
                [row, row1, row2, row3, message] = await buttonHandler(itemsToEquip, itemsEquipped, "DANGER");
            else
                [row, row1, row2, row3, message] = await buttonHandler(itemsToEquip, itemsEquipped);

            let equippedItemMessage = `**You have equipped ${displayEquippedItemlenght}/${maxEquipableItem} items:**`;
            let storedMessage = `**Data returned to:**\nEquipped ${displayEquippedItemlenght}/${maxEquipableItem} items:\n ${message}`;
            await interaction.reply({ embeds: [interaction.client.yellowEmbed(message, equippedItemMessage)], ephemeral: true, components: [row, row1, row2, row3, row4] });

            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

            let discardedMessage = true;

            collector.on('collect', async i => {
                collector.resetTimer({ time: 25000 });
                let index = parseInt(i.customId);
                if (i.component.customId === "save") {
                    await i.update({ embeds: [interaction.client.greenEmbed(`${equippedItemMessage}\n${message}`, "SAVED")], components: [] });
                    discardedMessage = false;
                    if (interaction.options.getSubcommand() === 'laser') {
                        let totalDamage = 0;
                        await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                        for (laser in itemsEquipped) {
                            totalDamage += itemsEquipped[laser][0];
                            await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 1 WHERE laser_id = ?`, [itemsEquipped[laser][2]]);
                        }
                        totalDamage = Math.floor(totalDamage)
                        await interaction.client.databaseEditData(`UPDATE user_ships SET ship_damage = ? WHERE user_id = ?`, [totalDamage, interaction.user.id]);
                        await interaction.client.databaseEditData(`UPDATE users SET user_damage = ?, laser_quantity = ? WHERE user_id = ?`, [totalDamage, displayEquippedItemlenght, interaction.user.id]);
                        //Send data to database
                    }
                    else if (interaction.options.getSubcommand() === 'shield') {
                        let totalShield = 0;
                        let absortionRate = 0;
                        await interaction.client.databaseEditData(`UPDATE user_shields SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                        for (shield in itemsEquipped) {
                            totalShield += itemsEquipped[shield][0];
                            absortionRate += itemsEquipped[shield][3] * itemsEquipped[shield][0];
                            await interaction.client.databaseEditData(`UPDATE user_shields SET equipped = 1 WHERE shield_id = ?`, [itemsEquipped[shield][2]]);
                        }
                        absortionRate = Math.floor(absortionRate / totalShield);
                        totalDamage = Math.floor(totalShield)
                        await interaction.client.databaseEditData(`UPDATE user_ships SET ship_shield = ?, ship_absortion_rate = ?, equipped_extra = ? WHERE user_id = ?`, [totalShield, absortionRate, displayEquippedItemlenght, interaction.user.id]);
                        await interaction.client.databaseEditData(`UPDATE users SET max_shield = ?, user_shield = ?, absorption_rate = ? WHERE user_id = ?`, [totalShield, totalShield, absortionRate, interaction.user.id]);
                    }
                    else {
                        await interaction.client.databaseEditData(`UPDATE user_engines SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                        for (engine in itemsEquipped) {
                            baseSpeed += itemsEquipped[engine][0];
                            await interaction.client.databaseEditData(`UPDATE user_engines SET equipped = 1 WHERE engine_id = ?`, [itemsEquipped[engine][2]]);
                        }
                        await interaction.client.databaseEditData(`UPDATE user_ships SET ship_speed = ?, equipped_extra = ? WHERE user_id = ?`, [baseSpeed, displayEquippedItemlenght, interaction.user.id]);
                        await interaction.client.databaseEditData(`UPDATE users SET user_speed = ? WHERE user_id = ?`, [baseSpeed, interaction.user.id]);
                    }
                    collector.stop("Saved");
                }
                else if (i.component.customId === "discard") {
                    await i.update({ embeds: [interaction.client.redEmbed(storedMessage, "DISCARDED")], components: [] });
                    discardedMessage = false;
                    collector.stop("Discarded");
                }
                else if (!i.component.label.trim()) {
                    await i.update({});
                }
                else if (i.component.style === "PRIMARY") {
                    equippedItemLength++;
                    displayEquippedItemlenght++;
                    itemsEquipped = itemsEquipped.concat(itemsToEquip.splice(index - equippedItemLength, 1));
                    if (displayEquippedItemlenght === maxEquipableItem)
                        [row, row1, row2, row3, message] = await buttonHandler(itemsToEquip, itemsEquipped, "DANGER");
                    else
                        [row, row1, row2, row3, message] = await buttonHandler(itemsToEquip, itemsEquipped);
                    equippedItemMessage = `**You have equipped ${displayEquippedItemlenght}/${maxEquipableItem} items**\n`;
                    await i.update({ embeds: [interaction.client.greenEmbed(message, equippedItemMessage)], components: [row, row1, row2, row3, row4] });
                }
                else if (i.component.style === "SUCCESS") {
                    equippedItemLength--;
                    displayEquippedItemlenght--;
                    itemsToEquip = itemsToEquip.concat(itemsEquipped.splice(index, 1));
                    [row, row1, row2, row3, message] = await buttonHandler(itemsToEquip, itemsEquipped);
                    equippedItemMessage = `**You have equipped ${displayEquippedItemlenght}/${maxEquipableItem} items**\n`;
                    await i.update({ embeds: [interaction.client.blueEmbed(message, equippedItemMessage)], components: [row, row1, row2, row3, row4] });
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


async function buttonHandler(itemsToEquip, itemsEquipped, buttonStyile = "PRIMARY") {

    itemsToEquip = itemsToEquip.sort(function (a, b) {
        return b[0] - a[0];
    });
    itemsEquipped = itemsEquipped.sort(function (a, b) {
        return b[0] - a[0];
    });

    let laser_items = itemsEquipped.concat(itemsToEquip);

    let array_length = laser_items.length;
    if (array_length < 20) {
        laser_items.length = 20;
        laser_items.fill([0, "           ", "           "], array_length);
        //console.log(laser_items);
    }

    let equippedItemsLength = itemsEquipped.length - 1;

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("0")
                .setLabel(laser_items[0][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("1")
                .setLabel(laser_items[1][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("2")
                .setLabel(laser_items[2][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("3")
                .setLabel(laser_items[3][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("4")
                .setLabel(laser_items[4][1])
                .setStyle(buttonStyile),
        );
    let row1 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("5")
                .setLabel(laser_items[5][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("6")
                .setLabel(laser_items[6][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("7")
                .setLabel(laser_items[7][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("8")
                .setLabel(laser_items[8][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("9")
                .setLabel(laser_items[9][1])
                .setStyle(buttonStyile),
        );
    let row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("10")
                .setLabel(laser_items[10][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("11")
                .setLabel(laser_items[11][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("12")
                .setLabel(laser_items[12][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("13")
                .setLabel(laser_items[13][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("14")
                .setLabel(laser_items[14][1])
                .setStyle(buttonStyile),
        );
    let row3 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("15")
                .setLabel(laser_items[15][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("16")
                .setLabel(laser_items[16][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("17")
                .setLabel(laser_items[17][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("18")
                .setLabel(laser_items[18][1])
                .setStyle(buttonStyile),
            new MessageButton()
                .setCustomId("19")
                .setLabel(laser_items[19][1])
                .setStyle(buttonStyile),
        );

    if (equippedItemsLength < 5) {
        for (index in itemsEquipped) {
            row.components[index].setStyle('SUCCESS');
            index++;
        }
    }
    else if (equippedItemsLength < 10) {
        row.components[0].setStyle('SUCCESS');
        row.components[1].setStyle('SUCCESS');
        row.components[2].setStyle('SUCCESS');
        row.components[3].setStyle('SUCCESS');
        row.components[4].setStyle('SUCCESS');
        for (index = 0; index <= equippedItemsLength - 5; index++) {
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
        for (index = 0; index <= equippedItemsLength - 10; index++) {
            row2.components[index].setStyle('SUCCESS');
        }
    }

    let message = "";
    for (item in itemsEquipped)
        message += `${itemsEquipped[item][1]} `;
    return [row, row1, row2, row3, message];
}

const row4 = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("discard")
            .setEmoji("887979580013563914")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("20")
            .setLabel("              ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("21")
            .setLabel("             ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("22")
            .setLabel("              ")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("save")
            .setEmoji("888579708114059334")
            .setStyle("SUCCESS"),
    );

