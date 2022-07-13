const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Shop to spend some money.!')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Select category [ ships - lasers - shields - engines - ammunition ]')
                .setRequired(true)
                .addChoice('ships', 'ships')
                .addChoice('lasers', 'lasers')
                .addChoice('shields', 'shields')
                .addChoice('engines', 'engines')
                .addChoice('ammunition', 'ammunition')
                .addChoice('extra', 'extra'))
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Enter the item you want to search')
                .setRequired(false)),


    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            //if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition', 'extra'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });
            if (userInfo.tutorial_counter < 5) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            var searchItem = interaction.options.getString('search')
            var items = [];
            var embed;
            var count = 0;
            var itemsPerPage = 1;
            var currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
            let priceCredit = [];
            let priceUnits = [];
            let itemName = [];
            let itemTable = 0;
            let itemColumn = 0;
            let shipsList = 0;
            let lasersList = 0;
            let shieldsList = 0;
            let enginesList = 0;
            let ammunitionList = 0;
            let extrasList = 0;
            let maxPages = 0;

            // check if its a valid category            

            if (interaction.options.getString('category').toLowerCase() == "ships") {
                if (searchItem == null) {
                    shipsList = await interaction.client.databaseSelectData(`SELECT * FROM ships_info WHERE available = 1`);
                } else {
                    shipsList = await interaction.client.databaseSelectData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [searchItem.toUpperCase()]);
                }

                if (shipsList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });

                itemTable = "user_ships";
                itemColumn = "ship_model";
                await shipsList.forEach((ship, index) => {
                    count++;
                    priceCredit.push(ship.credit);
                    priceUnits.push(ship.units);
                    itemName.push(ship.ship_model);

                    currentData += `**${ship.emoji_id} SHIP MODEL:** **[${ship.ship_model}](https://obelisk.club/)** `

                    if (ship.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${ship.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${ship.credit}**__ \n`
                    }

                    currentData += `<a:hp:896118360125870170> **HP **[${ship.ship_hp}](https://obelisk.club/) \n`
                    currentData += `<a:sp:896440044456378398> **Speed **[${ship.ship_base_speed}](https://obelisk.club/) \n`
                    currentData += `<a:LS:896440044464767036> **Lasers **[${ship.laser_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ex:896440044515106846> **Exstras **[${ship.extra_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:hs:896442508207341598> **HellStorm **[${ship.hellstorm_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ca:896440044536102983> **Cargo **[${ship.max_cargo}](https://obelisk.club/) \n`

                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < shipsList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }

                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <SHIPS>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "SHIPS", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() == "lasers") {
                if (searchItem == null) {
                    lasersList = await interaction.client.databaseSelectData(`SELECT * FROM lasers_info WHERE available = 1`);
                } else {
                    lasersList = await interaction.client.databaseSelectData(`SELECT * FROM lasers_info WHERE available = 1 and laser_model = ?`, [searchItem.toUpperCase()]);
                }

                if (lasersList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });

                itemTable = "user_lasers";
                itemColumn = "laser_model";
                await lasersList.forEach((laser, index) => {
                    count++;
                    priceCredit.push(laser.credit);
                    priceUnits.push(laser.units);
                    itemName.push(laser.laser_model);

                    currentData += `**${laser.emoji_id} LASER MODEL:** **[${laser.laser_model}](https://obelisk.club/)** `

                    if (laser.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${laser.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${laser.credit}**__ \n`
                    }

                    currentData += `<a:dmg:896724820149035048> **DMG **[${laser.damage_value}](https://obelisk.club/) \n`
                    currentData += `<a:up:896725276023717958> **DMG ${interaction.client.getWordLanguage(serverSettings.lang, 'upgrade_lvl')} **[${laser.per_increase_by_level}](https://obelisk.club/) \n`

                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < lasersList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <LASERS>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "LASERS", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() == "shields") {
                if (searchItem == null) {
                    shieldsList = await interaction.client.databaseSelectData(`SELECT * FROM shields_info WHERE available = 1`);
                } else {
                    shieldsList = await interaction.client.databaseSelectData(`SELECT * FROM shields_info WHERE available = 1 and shield_model = ?`, [searchItem.toLowerCase()]);
                }

                if (shieldsList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });


                itemTable = "user_shields";
                itemColumn = "shield_model";
                await shieldsList.forEach((shield, index) => {
                    count++;
                    priceCredit.push(shield.credit);
                    priceUnits.push(shield.units);
                    itemName.push(shield.shield_model);

                    currentData += `**${shield.emoji_id} SHIELD MODEL:** **[${shield.shield_model}](https://obelisk.club/)** `

                    if (shield.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${shield.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${shield.credit}**__ \n`
                    }

                    currentData += `<a:sd:896118359966511104> **Shield **[${shield.shield_value}](https://obelisk.club/) \n`
                    currentData += `<a:ab:896726792944119828> **${interaction.client.getWordLanguage(serverSettings.lang, 'absortion_%')} **[${shield.absorption_rate}](https://obelisk.club/) \n`
                    currentData += `<a:up:896725276023717958> **Shield ${interaction.client.getWordLanguage(serverSettings.lang, 'upgrade_lvl')} **[${shield.per_increase_by_level}](https://obelisk.club/) \n`

                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < shieldsList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <SHIELDS>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "SHIELDS", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() == "engines") {
                //itemsPerPage = 3;
                count = 0;
                if (searchItem == null) {
                    enginesList = await interaction.client.databaseSelectData(`SELECT * FROM engines_info WHERE available = 1`);
                } else {
                    enginesList = await interaction.client.databaseSelectData(`SELECT * FROM engines_info WHERE available = 1 and engine_model = ?`, [searchItem.toUpperCase()]);
                }

                if (enginesList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });

                itemTable = "user_engines";
                itemColumn = "engine_model";
                await enginesList.forEach((engine, index) => {
                    count++;
                    priceCredit.push(engine.credit);
                    priceUnits.push(engine.units);
                    itemName.push(engine.engine_model);


                    currentData += `**${engine.emoji_id} ENGINE MODEL:** **[${engine.engine_model}](https://obelisk.club/)** `

                    if (engine.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${engine.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${engine.credit}**__ \n`
                    }

                    currentData += `<a:sp:896440044456378398> **Speed **[${engine.speed_value}](https://obelisk.club/) \n`

                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < enginesList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <ENGINE>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "ENGINE", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() == "ammunition") {
                if (searchItem == null) {
                    ammunitionList = await interaction.client.databaseSelectData(`SELECT * FROM ammunition_info WHERE available = 1`);
                } else {
                    ammunitionList = await interaction.client.databaseSelectData(`SELECT * FROM ammunition_info WHERE available = 1 and ammo_id = ?`, [searchItem.toUpperCase()]);
                }
                count = 0;
                //itemsPerPage = 4;
                if (ammunitionList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });


                itemTable = "ammunition";
                itemColumn = "ammunition";
                await ammunitionList.forEach((ammunition, index) => {
                    count++;
                    priceCredit.push(ammunition.credit);
                    priceUnits.push(ammunition.units);
                    itemName.push(ammunition.ammo_id);

                    currentData += `**⦿ Ammunition ID:** **[${ammunition.ammo_id}](https://obelisk.club/)** `

                    if (ammunition.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${ammunition.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${ammunition.credit}**__ \n`
                    }

                    currentData += `**${interaction.client.getWordLanguage(serverSettings.lang, 'description')}**\n${ammunition.description}\n`



                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < ammunitionList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <AMMUNITION>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "AMMUNITION", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else {
                if (searchItem == null) {
                    extrasList = await interaction.client.databaseSelectData(`SELECT * FROM extra_info WHERE available = 1`);
                } else {
                    extrasList = await interaction.client.databaseSelectData(`SELECT * FROM extra_info WHERE available = 1 and extra_model = ?`, [searchItem.toUpperCase()]);
                }

                if (extrasList.length == 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'itemNotFound').format(searchItem.toUpperCase()), "Error!!")], ephemeral: true });

                itemColumn = "extra_model";
                itemTable = [];
                await extrasList.forEach((extra, index) => {
                    count++;
                    priceCredit.push(extra.credit);
                    priceUnits.push(extra.units);
                    itemName.push(extra.extra_model);

                    currentData += `**${extra.emoji_id} EXTRA MODEL:** **[${extra.extra_model}](https://obelisk.club/)** `

                    itemColumn = "extra_model";
                    if (extra.credit == 0) {
                        currentData += `${interaction.client.defaultEmojis['units']} __**${extra.units}**__ \n`
                    } else {
                        currentData += `${interaction.client.defaultEmojis['credit']} __**${extra.credit}**__ \n`
                    }

                    if (extra.item_type == "repair") {
                        itemTable.push(["repair_bot", extra.function]);
                        currentData += `<a:RR:933406090077560852> **${interaction.client.getWordLanguage(serverSettings.lang, 'repair_rate')}**[${extra.function}](https://obelisk.club/) \n`
                        currentData += `\n*${interaction.client.getWordLanguage(serverSettings.lang, 'repair_rate_desc')}* \n`
                    } else {
                        itemTable.push(["hellstorm_model", extra.function]);
                        currentData += `<a:CS:933406089863626802> **${interaction.client.getWordLanguage(serverSettings.lang, 'clip_size')}**[${extra.function}](https://obelisk.club/) \n`
                        currentData += `\n*${interaction.client.getWordLanguage(serverSettings.lang, 'clip_size_desc')}* \n`
                    }

                    if (count == itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        if (index < extrasList.length - 1) {
                            currentData = interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);
                        } else {
                            currentData = ``;
                        }

                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <EXTRAS>", interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "EXTRAS", serverSettings);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }
            }
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

const row = new MessageActionRow()
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
            .setCustomId('buy')
            .setLabel('BUY')
            .setStyle('SUCCESS'),
    );

function buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, inventoryData, category, serverSettings) {
    let maxIndex = inventoryData.length - 1;
    let index = 0;
    let buyBool = false;
    let quantity = 1;

    const filter = i => i.user.id == interaction.user.id && i.message.interaction.id == interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        try {
            if (!buyBool) {
                quantity = 1;
                if (i.customId == 'left')
                    index--;
                else if (i.customId == 'right')
                    index++;
                if (index < 0)
                    index += maxIndex + 1;
                if (index > maxIndex)
                    index -= maxIndex + 1;
                if (i.customId == "buy") {
                    if (itemTable == "ammunition")
                        itemColumn = `${itemName[index]}_magazine`;
                    if (priceCredit[index] > 0)
                        if (priceCredit[index] > userInfo.credit)
                            return await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, `no_credit`), "ERROR!")], components: [] });
                        else {
                            if (itemTable == "user_ships") {
                                let ownedShip = await interaction.client.databaseSelectData('select * from user_ships where ship_model = ? and user_id = ?', [itemName[index], interaction.user.id]);
                                if (typeof ownedShip == 'undefined' || ownedShip.length == 0) {
                                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                    collector.stop("Bought");
                                    let itemInfo = await interaction.client.databaseSelectData('select * from ships_info where ship_model = ?', [itemName[index]])
                                    itemInfo = itemInfo[0];
                                    let query = `insert into user_ships (ship_emoji, ship_damage, ship_hp, ship_shield, ship_speed, ship_penetration, ship_absortion_rate, ship_cargo, ship_model, user_id) VAlUES (${itemInfo.emoji_id},0,${itemInfo.ship_hp},0,${itemInfo.ship_base_speed},0,0,${itemInfo.max_cargo},'${itemInfo.ship_model}','${interaction.user.id}')`
                                    await interaction.client.databaseEditData(query)
                                    await interaction.client.databaseEditData(`UPDATE users SET credit = credit - ?  WHERE user_id = ?`, [priceCredit[index], interaction.user.id]);
                                    return;
                                }
                                else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_ship'), "ERROR!")], components: [] });
                                    return;
                                }
                            }
                            else if (itemColumn == "extra_model") {
                                if (itemTable[index][0] == "repair_bot") {
                                    if (userInfo.repair_rate < itemTable[index][1]) {
                                        await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                        collector.stop("Bought");
                                        await interaction.client.databaseEditData(`UPDATE users SET credit = credit - ?, repair_rate = ? WHERE user_id = ?`, [priceCredit[index], itemTable[index][1], interaction.user.id]);
                                        return;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_robot'), "ERROR!")], components: [] });
                                        return;
                                    }
                                }
                                else if (itemTable[index][0] == "hellstorm_model") {
                                    let currentClipRate = await interaction.client.databaseSelectData('select * from hunt_configuration where user_id = ?', [interaction.user.id])
                                    currentClipRate = currentClipRate[0].helstorm_missiles_number;
                                    if (currentClipRate < itemTable[index][1]) {
                                        await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                        collector.stop("Bought");
                                        await interaction.client.databaseEditData(`UPDATE users SET credit = credit - ? WHERE user_id = ?`, [priceCredit[index], interaction.user.id]);
                                        await interaction.client.databaseEditData(`UPDATE hunt_configuration SET helstorm_missiles_number =  ? WHERE user_id = ?`, [itemTable[index][1], interaction.user.id]);
                                        return;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_hellstorm'), "ERROR!")], components: [] });
                                        return;
                                    }
                                }
                            }
                            await i.update({ embeds: [interaction.client.blueEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units)}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_b_quantity')}** ${quantity}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_total_p')}** ${interaction.client.defaultEmojis['credit']}${quantity * priceCredit[index]}`, `${interaction.client.getWordLanguage(serverSettings.lang, 'buying_c')} [${itemColumn.toUpperCase()} - ${itemName[index]}]`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                            buyBool = true;

                        }
                    else
                        if (priceUnits[index] > userInfo.units)
                            return await i.update({ embeds: [interaction.client.redEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, 'no_unit')}`, "ERROR!")], components: [] });
                        else {
                            if (itemTable == "user_ships") {
                                let ownedShip = await interaction.client.databaseSelectData('select * from user_ships where ship_model = ? and user_id = ?', [itemName[index], interaction.user.id]);
                                if (typeof ownedShip == 'undefined' || ownedShip.length == 0) {
                                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                    collector.stop("Bought");
                                    let itemInfo = await interaction.client.databaseSelectData('select * from ships_info where ship_model = ?', [itemName[index]])
                                    itemInfo = itemInfo[0];
                                    let query = `insert into user_ships (ship_emoji, ship_damage, ship_hp, ship_shield, ship_speed, ship_penetration, ship_absortion_rate, ship_cargo, ship_model, user_id) VAlUES (${itemInfo.emoji_id},0,${itemInfo.ship_hp},0,${itemInfo.ship_base_speed},0,0,${itemInfo.max_cargo},'${itemInfo.ship_model}','${interaction.user.id}')`
                                    await interaction.client.databaseEditData(query)
                                    await interaction.client.databaseEditData(`UPDATE users SET units = units - ? WHERE user_id = ?`, [priceUnits[index], interaction.user.id]);
                                    return;
                                }
                                else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_ship'), "ERROR!")], components: [] });
                                    return;
                                }
                            }
                            else if (itemColumn == "extra_model") {
                                if (itemTable[index][0] == "repair_bot") {
                                    if (userInfo.repair_rate < itemTable[index][1]) {
                                        await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                        collector.stop("Bought");
                                        await interaction.client.databaseEditData(`UPDATE users SET units = units - ?, repair_rate = ? WHERE user_id = ?`, [priceUnits[index], itemTable[index][1], interaction.user.id]);
                                        return;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_robot'), "ERROR!")], components: [] });
                                        return;
                                    }
                                }
                                else if (itemTable[index][0] == "hellstorm_model") {
                                    let currentClipRate = await interaction.client.databaseSelectData('select * from hunt_configuration where user_id = ?', [interaction.user.id])
                                    currentClipRate = currentClipRate[0].helstorm_missiles_number;
                                    if (currentClipRate < itemTable[index][1]) {
                                        await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                                        collector.stop("Bought");
                                        await interaction.client.databaseEditData(`UPDATE users SET units = units - ? WHERE user_id = ?`, [priceUnits[index], interaction.user.id]);
                                        await interaction.client.databaseEditData(`UPDATE hunt_configuration SET helstorm_missiles_number =  ? WHERE user_id = ?`, [itemTable[index][1], interaction.user.id]);
                                        return;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_error_hellstorm'), "ERROR!")], components: [] });
                                        return;
                                    }
                                }
                            }
                            await i.update({ embeds: [interaction.client.blueEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units)}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_b_quantity')}** ${quantity}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_total_p')}** ${interaction.client.defaultEmojis['units']}${quantity * priceUnits[index]}`, `${interaction.client.getWordLanguage(serverSettings.lang, 'buying_c')} [${itemTable.toUpperCase()} - ${itemName[index]}]`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                            buyBool = true;
                        }
                }
                else
                    await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], `SHOP <${category}>`, interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} ${index + 1} of ${maxIndex + 1}`)] });
            }
            else {
                if (i.customId == "cancelItem") {
                    buyBool = false;
                    await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], `SHOP <${category}>`, interaction.user, `${interaction.client.getWordLanguage(serverSettings.lang, 'page_u')} ${index + 1} of ${maxIndex + 1}`)], components: [row] });
                }
                else if (i.customId == "buyItem") {
                    if (priceCredit[index] > 0)
                        if (priceCredit[index] * quantity > userInfo.credit)
                            return await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'no_credit'), "ERROR!")], components: [] });
                        else {
                            await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                            if (itemTable == "ammunition")
                                await interaction.client.databaseEditData(`UPDATE ammunition SET ${itemColumn} = ${itemColumn} + ?  WHERE user_id = ?`, [quantity, interaction.user.id]);
                            else
                                for (i = 0; i < quantity; i++)
                                    await interaction.client.databaseEditData(`INSERT INTO ${itemTable} (user_id, ${itemColumn}) VALUES (?, ?)`, [interaction.user.id, itemName[index]]);
                            collector.stop("Bought");
                            await interaction.client.databaseEditData(`UPDATE users SET credit = credit - ?  WHERE user_id = ?`, [quantity * priceCredit[index], interaction.user.id]);
                            return;
                        }
                    else
                        if (priceUnits[index] * quantity > userInfo.units)
                            return await i.update({ embeds: [interaction.client.redEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, 'no_unit')}`, "ERROR!")], components: [] });
                        else {
                            await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shop_bought'), interaction.client.getWordLanguage(serverSettings.lang, 'bought_c'))], components: [] });
                            if (itemTable == "ammunition")
                                await interaction.client.databaseEditData(`UPDATE ammunition SET ${itemColumn} = ${itemColumn} + ?  WHERE user_id = ?`, [quantity, interaction.user.id]);
                            else
                                for (i = 0; i < quantity; i++)
                                    await interaction.client.databaseEditData(`INSERT INTO ${itemTable} (user_id, ${itemColumn}) VALUES (?, ?)`, [interaction.user.id, itemName[index]]);
                            collector.stop("Bought");
                            await interaction.client.databaseEditData(`UPDATE users SET units = units - ?  WHERE user_id = ?`, [quantity * priceUnits[index], interaction.user.id]);
                            return;
                        }
                }
                else {
                    let add = parseInt(i.customId);
                    if (Number.isInteger(add))
                        quantity += add
                    if (quantity < 1) {
                        quantity -= add;
                        await i.update({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_low_quantity')}**\n**${interaction.client.getWordLanguage(serverSettings.lang, 'quantity_c')}**: ${quantity}`, "ERROR!")], components: [quantityButtonUp, quantityButtonDown] });
                    }
                    else if (priceCredit[index] > 0)
                        await i.update({ embeds: [interaction.client.blueEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units)}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_b_quantity')}** ${quantity}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_total_p')}** ${interaction.client.defaultEmojis['credit']}${quantity * priceCredit[index]}`, `${interaction.client.getWordLanguage(serverSettings.lang, 'buying_c')} [${itemTable.toUpperCase()} - ${itemName[index]}]`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                    else
                        await i.update({ embeds: [interaction.client.blueEmbed(`${interaction.client.getWordLanguage(serverSettings.lang, "shop_currency").format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units)}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_b_quantity')}** ${quantity}\n**${interaction.client.getWordLanguage(serverSettings.lang, 'shop_total_p')}** ${interaction.client.defaultEmojis['units']}${quantity * priceUnits[index]}`, `${interaction.client.getWordLanguage(serverSettings.lang, 'buying_c')} [${itemTable.toUpperCase()} - ${itemName[index]}]`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                }
            }
        }
        catch (error) {
            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}

const quantityButtonUp = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('1')
            .setLabel('+1     ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10')
            .setLabel('+10  ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('100')
            .setLabel('+100')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('1000')
            .setLabel('+1K   ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10000')
            .setLabel('+10K')
            .setStyle('PRIMARY'),
    );
const quantityButtonDown = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('-1')
            .setLabel('-1      ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10')
            .setLabel('-10   ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-100')
            .setLabel('-100 ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-1000')
            .setLabel('-1K    ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10000')
            .setLabel('-10K ')
            .setStyle('DANGER'),
    );
const buySetting = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('cancelItem')
            .setLabel('CANCELL')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('buyItem')
            .setLabel('CONFIRM')
            .setStyle('SUCCESS'),
    );