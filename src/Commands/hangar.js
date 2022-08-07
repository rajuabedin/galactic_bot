const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

let itemRank = ["E-", "E ", "E+", "D-", "D ", "D+", "C-", "C ", "C+", "B-", "B ", "B+", "A-", "A ", "A+", "S-", "S "];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanger')
        .setDescription('Edit ship equipment')
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Select from [ ship - laser - shield - engine ]')
                .setRequired(true)
                .addChoice('ship', 'ship')
                .addChoice('laser', 'laser')
                .addChoice('shield', 'shield')
                .addChoice('engine', 'engine')
        ),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });


        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 3) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let userCd = await interaction.client.databaseSelectData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            if (~~((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1 && userInfo.next_map_id != userInfo.map_id) {
                await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [interaction.user.id]);
                userInfo.map_id = userInfo.next_map_id;
                await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [userInfo.map_id, interaction.user.id]);
            }
            if (userInfo.map_id != 11 && userInfo.map_id != 21 && userInfo.map_id != 31 && userInfo.map_id != 18 && userInfo.map_id != 28 && userInfo.map_id != 38) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'noHangar'), "ERROR!!")] });
                return;
            }
            let baseSpeed = 0;
            let displayEquippedItemlength = 0;
            let maxEquipableItem = 0;
            let itemsToEquip = [];
            let itemsEquipped = [];
            let unequipableItems = [];
            let selectedOption = interaction.options.getString('option').toLowerCase();
            let shipList = [];
            let shipIndex = 0;
            let shipLenght = 0;

            if (selectedOption == 'ship') {
                let currentData = "";

                let shipArray = await interaction.client.databaseSelectData("SELECt ships_info.*, user_ships.ship_id, user_ships.ship_current_hp, user_ships.equipped FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE user_ships.user_id = ?", [interaction.user.id]);
                shipList = [""];
                //console.log(shipArray);
                shipArray.forEach(ship => {
                    currentData = `**[${ship.emoji_id}]** \n`;
                    currentData += `<a:hp:896118360125870170> **` + interaction.client.getWordLanguage(serverSettings.lang, 'currentHP') + ` **[${ship.ship_current_hp}](https://obelisk.club/) \n`
                    currentData += `<a:sp:896440044456378398> **` + interaction.client.getWordLanguage(serverSettings.lang, 'speed') + ` **[${ship.ship_base_speed}](https://obelisk.club/) \n`
                    currentData += `<a:LS:896440044464767036> **` + interaction.client.getWordLanguage(serverSettings.lang, 'lasers') + ` **[${ship.laser_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ex:896440044515106846> **Exstras **[${ship.extra_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:hs:896442508207341598> **HellStorm **[${ship.hellstorm_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ca:896440044536102983> **` + interaction.client.getWordLanguage(serverSettings.lang, 'cargo') + ` **[${ship.max_cargo}](https://obelisk.club/) \n`
                    if (ship.equipped != 1)
                        shipList.push([currentData, ship.ship_id, ship.ship_current_hp, ship.ship_base_speed, ship.max_cargo, ship.ship_hp]);
                    else
                        shipList[0] = [currentData, ship.ship_id, ship.ship_current_hp, ship.ship_base_speed, ship.max_cargo, ship.ship_hp];
                })
                shipLenght = shipList.length - 1;
            }
            else if (selectedOption == 'laser') {
                let rawEquippedLaser = await interaction.client.databaseSelectData("SELECT lasers_info.emoji_id, lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedLaser = await interaction.client.databaseSelectData("SELECT lasers_info.emoji_id, lasers_info.damage_value, lasers_info.per_increase_by_level, user_lasers.level, user_lasers.laser_model, user_lasers.laser_id FROM user_lasers INNER JOIN lasers_info ON user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? AND equipped = 0", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelectData("SELECT ships_info.laser_quantity FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE user_ships.user_id = ? AND user_ships.equipped = 1", [interaction.user.id]);

                for (item in rawEquippedLaser) {
                    itemsEquipped.push([rawEquippedLaser[item].damage_value * (1 + rawEquippedLaser[item].per_increase_by_level / 1000 * rawEquippedLaser[item].level), rawEquippedLaser[item].laser_model + `${itemRank[rawEquippedLaser[item].level]}`, rawEquippedLaser[item].laser_id, rawEquippedLaser[item].emoji_id]);
                }
                for (item in rawUnequippedLaser) {
                    itemsToEquip.push([rawUnequippedLaser[item].damage_value * (1 + rawUnequippedLaser[item].per_increase_by_level / 1000 * rawUnequippedLaser[item].level), rawUnequippedLaser[item].laser_model + `${itemRank[rawUnequippedLaser[item].level]}`, rawUnequippedLaser[item].laser_id, rawUnequippedLaser[item].emoji_id]);
                }
                displayEquippedItemlength = itemsEquipped.length;
                maxEquipableItem = maxEquipableItem[0].laser_quantity;
            }
            else if (selectedOption == 'shield') {
                let rawEquippedShield = await interaction.client.databaseSelectData("SELECT shields_info.emoji_id, shields_info.absorption_rate, shields_info.shield_value, shields_info.per_increase_by_level, user_shields.level, user_shields.shield_model, user_shields.shield_id FROM user_shields INNER JOIN shields_info ON user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedShield = await interaction.client.databaseSelectData("SELECT shields_info.emoji_id, shields_info.absorption_rate, shields_info.shield_value, shields_info.per_increase_by_level, user_shields.level, user_shields.shield_model, user_shields.shield_id FROM user_shields INNER JOIN shields_info ON user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? AND equipped = 0", [interaction.user.id]);
                let rawEquippedEngine = await interaction.client.databaseSelectData("SELECT engines_info.emoji_id FROM user_engines INNER JOIN engines_info ON user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? AND equipped = 1", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelectData("SELECT ships_info.extra_quantity, user_ships.equipped_extra FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ? AND user_ships.equipped = 1", [interaction.user.id]);

                for (item in rawEquippedEngine) {
                    unequipableItems.push([0, 1, 2, rawEquippedEngine[item].emoji_id]);
                }
                for (item in rawEquippedShield) {
                    itemsEquipped.push([rawEquippedShield[item].shield_value * (1 + rawEquippedShield[item].per_increase_by_level / 1000 * rawEquippedShield[item].level), rawEquippedShield[item].shield_model + `${itemRank[rawEquippedShield[item].level]}`, rawEquippedShield[item].shield_id, rawEquippedShield[item].emoji_id, rawEquippedShield[item].absorption_rate]);
                }
                for (item in rawUnequippedShield) {
                    itemsToEquip.push([rawUnequippedShield[item].shield_value * (1 + rawUnequippedShield[item].per_increase_by_level / 1000 * rawUnequippedShield[item].level), rawUnequippedShield[item].shield_model + `${itemRank[rawUnequippedShield[item].level]}`, rawUnequippedShield[item].shield_id, rawUnequippedShield[item].emoji_id, rawUnequippedShield[item].absorption_rate]);
                }
                displayEquippedItemlength = maxEquipableItem[0].equipped_extra;
                maxEquipableItem = maxEquipableItem[0].extra_quantity;
            }
            else {
                let rawEquippedEngine = await interaction.client.databaseSelectData("SELECT engines_info.emoji_id, engines_info.speed_value, user_engines.engine_model, user_engines.engine_id FROM user_engines INNER JOIN engines_info ON user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? AND equipped = 1", [interaction.user.id]);
                let rawUnequippedEngine = await interaction.client.databaseSelectData("SELECT engines_info.emoji_id, engines_info.speed_value, user_engines.engine_model, user_engines.engine_id FROM user_engines INNER JOIN engines_info ON user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? AND equipped = 0", [interaction.user.id]);
                let rawEquippedShield = await interaction.client.databaseSelectData("SELECT shields_info.emoji_id FROM user_shields INNER JOIN shields_info ON user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? AND equipped = 1", [interaction.user.id]);
                maxEquipableItem = await interaction.client.databaseSelectData("SELECT ships_info.ship_base_speed, ships_info.extra_quantity, user_ships.equipped_extra FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE user_ships.user_id = ? AND user_ships.equipped = 1", [interaction.user.id]);

                for (item in rawEquippedShield) {
                    unequipableItems.push([0, 1, 2, rawEquippedShield[item].emoji_id]);
                }
                for (item in rawEquippedEngine) {
                    itemsEquipped.push([rawEquippedEngine[item].speed_value, "  " + rawEquippedEngine[item].engine_model + "  ", rawEquippedEngine[item].engine_id, rawEquippedEngine[item].emoji_id]);
                }
                for (item in rawUnequippedEngine) {
                    itemsToEquip.push([rawUnequippedEngine[item].speed_value, "  " + rawUnequippedEngine[item].engine_model + "  ", rawUnequippedEngine[item].engine_id, rawUnequippedEngine[item].emoji_id]);
                }
                displayEquippedItemlength = maxEquipableItem[0].equipped_extra;
                baseSpeed = maxEquipableItem[0].ship_base_speed;
                maxEquipableItem = maxEquipableItem[0].extra_quantity;
            }

            let equippedItemLength = itemsEquipped.length - 1;


            let [row, row1, row2, row3, message] = [0, 0, 0, 0, 0];
            let shipRow = await shipButton("SECONDARY");
            if (displayEquippedItemlength == maxEquipableItem)
                [row, row1, row2, row3, message] = await buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems, "DANGER");
            else
                [row, row1, row2, row3, message] = await buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems);


            if (selectedOption == 'ship')
                await interaction.editReply({ embeds: [interaction.client.yellowEmbed(`${shipList[0][0]}`, "Hanger ships")], /*ephemeral: true,*/ components: [shipRow], fetchReply: true });
            else
                await interaction.editReply({ content: message, /*ephemeral: true,*/ components: [row, row1, row2, row3, row4], fetchReply: true });


            const collector = msg.createMessageComponentCollector({ time: 25000 });

            let discardedMessage = true;
            let index = 0;

            collector.on('collect', async i => {
                i.deferUpdate();


                collector.resetTimer({ time: 25000 });
                if (!i.replied) {
                    try {
                        if (i.user.id == interaction.user.id) {
                            index = parseInt(i.customId);
                            if (i.component.customId == "save") {
                                await interaction.editReply({ content: message, components: [] });
                                discardedMessage = false;
                                if (selectedOption == 'laser') {
                                    let totalDamage = 0;
                                    await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    for (laser in itemsEquipped) {
                                        totalDamage += itemsEquipped[laser][0];
                                        await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 1 WHERE laser_id = ?`, [itemsEquipped[laser][2]]);
                                    }
                                    totalDamage = Math.floor(totalDamage)
                                    await interaction.client.databaseEditData(`UPDATE user_ships SET ship_damage = ? WHERE user_id = ?`, [totalDamage, interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE users SET user_damage = ?, laser_quantity = ? WHERE user_id = ?`, [totalDamage, displayEquippedItemlength, interaction.user.id]);
                                    //Send data to database
                                }
                                else if (selectedOption == 'shield') {
                                    let totalShield = 0;
                                    let absortionRate = 0;
                                    await interaction.client.databaseEditData(`UPDATE user_shields SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    for (shield in itemsEquipped) {
                                        totalShield += itemsEquipped[shield][0];
                                        absortionRate += itemsEquipped[shield][4] * itemsEquipped[shield][0];
                                        await interaction.client.databaseEditData(`UPDATE user_shields SET equipped = 1 WHERE shield_id = ?`, [itemsEquipped[shield][2]]);
                                    }
                                    if (absortionRate > 0)
                                        absortionRate = Math.floor(absortionRate / totalShield);
                                    //totalShield = Math.floor(totalShield)
                                    await interaction.client.databaseEditData(`UPDATE user_ships SET ship_shield = ?, ship_absortion_rate = ?, equipped_extra = ? WHERE user_id = ? AND equipped = 1`, [totalShield, absortionRate, displayEquippedItemlength, interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE users SET max_shield = ?, user_shield = ?, absorption_rate = ? WHERE user_id = ?`, [totalShield, totalShield, absortionRate, interaction.user.id]);
                                }
                                else {
                                    await interaction.client.databaseEditData(`UPDATE user_engines SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    for (engine in itemsEquipped) {
                                        baseSpeed += itemsEquipped[engine][0];
                                        await interaction.client.databaseEditData(`UPDATE user_engines SET equipped = 1 WHERE engine_id = ?`, [itemsEquipped[engine][2]]);
                                    }
                                    await interaction.client.databaseEditData(`UPDATE user_ships SET ship_speed = ?, equipped_extra = ? WHERE user_id = ? AND equipped = 1`, [baseSpeed, displayEquippedItemlength, interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE users SET user_speed = ? WHERE user_id = ?`, [baseSpeed, interaction.user.id]);
                                }
                                collector.stop("Saved");
                            }
                            else if (selectedOption == 'ship') {
                                if (i.component.customId == "left") {
                                    shipIndex--;
                                    if (shipIndex < 0)
                                        shipIndex = shipLenght;
                                }
                                else if (i.component.customId == "right") {
                                    shipIndex++;
                                    if (shipIndex > shipLenght)
                                        shipIndex = 0;
                                }
                                else if (i.component.customId == "discard2") {
                                    await interaction.editReply({ content: "**DISCARDED**", components: [] });
                                    discardedMessage = false;
                                    collector.stop("Discarded");
                                }
                                else if (i.component.customId == "equip" && shipIndex > 0) {
                                    await interaction.client.databaseEditData(`UPDATE user_ships SET equipped = 0, equipped_extra = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET equipped = 1 WHERE user_id = ? and ship_id = ?", [interaction.user.id, shipList[shipIndex][1]]);
                                    await interaction.client.databaseEditData(`UPDATE users SET user_damage = 0, max_hp = ?, user_hp = ?, user_shield = 0, max_shield = 0, absorption_rate = 0, laser_quantity = 0, user_speed = ?, max_cargo = ?, user_penetration = 0 WHERE user_id = ?`, [shipList[shipIndex][5], shipList[shipIndex][2], shipList[shipIndex][3], shipList[shipIndex][4], interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE user_engines SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE user_shields SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 0 WHERE user_id = ?`, [interaction.user.id]);
                                    discardedMessage = false;
                                    collector.stop("Saved");
                                    return
                                }
                                if (shipIndex == 0)
                                    shipRow = await shipButton("SECONDARY");
                                else
                                    shipRow = await shipButton();
                                await interaction.editReply({ embeds: [interaction.client.yellowEmbed(`${shipList[shipIndex][0]}`, "Hanger ships")], /*ephemeral: true,*/ components: [shipRow] });
                            }
                            else if (i.component.customId == "discard") {
                                await interaction.editReply({ content: "**DISCARDED**", components: [] });
                                discardedMessage = false;
                                collector.stop("Discarded");
                            } else if (i.component.style == "PRIMARY") {
                                equippedItemLength++;
                                displayEquippedItemlength++;
                                itemsEquipped = itemsEquipped.concat(itemsToEquip.splice(index - equippedItemLength, 1));
                                if (displayEquippedItemlength == maxEquipableItem)
                                    [row, row1, row2, row3, message] = await buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems, "DANGER");
                                else
                                    [row, row1, row2, row3, message] = await buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems);
                                await interaction.editReply({ content: message, components: [row, row1, row2, row3, row4] });
                            }
                            else if (i.component.style == "SUCCESS") {
                                equippedItemLength--;
                                displayEquippedItemlength--;
                                itemsToEquip = itemsToEquip.concat(itemsEquipped.splice(index, 1));
                                [row, row1, row2, row3, message] = await buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems);
                                await interaction.editReply({ content: message, components: [row, row1, row2, row3, row4] });
                            }
                            else {
                                await interaction.editReply({ content: interaction.client.getWordLanguage(serverSettings.lang, 'maxCapacity'), components: [] });
                                await interaction.client.wait(1000);
                                await interaction.editReply({ content: message, components: [row, row1, row2, row3, row4] });
                            }
                        }

                    }
                    catch (error) { }
                }
            });

            collector.on('end', collected => {
                if (discardedMessage)
                    interaction.editReply({ content: "**Discarded**", components: [] });
                else
                    interaction.editReply({ components: [] })
            });
        }
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}


async function buttonHandler(maxEquipableItem, itemsToEquip, itemsEquipped, unequipableItems, buttonStyile = "PRIMARY") {

    itemsToEquip = itemsToEquip.sort(function (a, b) {
        return b[0] - a[0];
    });
    itemsEquipped = itemsEquipped.sort(function (a, b) {
        return b[0] - a[0];
    });

    let laser_items = itemsEquipped.concat(itemsToEquip);

    let equippedItemsLength = itemsEquipped.length - 1;

    let array_length = laser_items.length;
    if (array_length < 20) {
        laser_items.length = 20;
        laser_items.fill([0, "          ", "          "], array_length);
        //console.log(laser_items);
    }

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

    itemsEquipped = unequipableItems.concat(itemsEquipped);

    equippedItemsLength = itemsEquipped.length - 1;

    let message = "";
    for (item = 0; item < 18; item++) {
        if (item <= equippedItemsLength)
            message += `${itemsEquipped[item][3]}`;
        else if (item < maxEquipableItem)
            message += `<:Slot:895013272082853951>`;
        else
            message += `<:No_Slot:895013272208670790>`;
        if ((item + 1) % 6 == 0)
            message += "\n";
    }
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
            .setEmoji("888579708114059334")
            .setStyle("SUCCESS"),
    );

async function shipButton(buttonStyile = "SUCCESS") {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('left')
                //.setLabel('Left')
                .setEmoji('887811358509379594')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('right')
                //.setLabel('Right')
                .setEmoji('887811358438064158')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId("discard2")
                .setEmoji("887979580013563914")
                .setStyle("DANGER"),
            new MessageButton()
                .setCustomId('equip')
                .setEmoji("888579708114059334")
                .setStyle(buttonStyile),
        );
}

