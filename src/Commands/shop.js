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
                .addChoice('ammunition', 'ammunition'))
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Enter the item you want to search')
                .setRequired(false)),


    async execute(interaction, userInfo) {
        //try {
            var searchItem = interaction.options.getString('search')
            var items = [];
            var embed;
            var count = 0;
            var itemsPerPage = 1;
            var currentData = "";
            let priceCredit = [];
            let priceUnits = [];
            let itemName = [];
            let itemTable = 0;
            let itemColumn = 0;

            // check if its a valid category
            if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });

            if (interaction.options.getString('category').toLowerCase() === "ships") {
                if (searchItem === null) {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1`);
                } else {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [searchItem.toUpperCase()]);
                }

                if (shipsList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });

                itemTable = "user_ships";
                itemColumn = "ship_model";
                await shipsList.forEach((ship, index) => {
                    count++;
                    priceCredit.push(ship.credit);
                    priceUnits.push(ship.units);
                    itemName.push(ship.ship_model);

                    currentData = `**${ship.emoji_id} SHIP MODEL:** **[${ship.ship_model}](https://obelisk.club/)**\n**PRICE: **`

                    if (ship.credit === 0) {
                        currentData += `<:ObeliskGift:815706852670046248> __**${ship.units}**__ \n`
                    } else {
                        currentData += `<:coin:746503546173784095> __**${ship.credit}**__ \n`
                    }

                    currentData += `<a:hp:896118360125870170> **HP **[${ship.ship_hp}](https://obelisk.club/) \n`
                    currentData += `<a:sp:896440044456378398> **Speed **[${ship.ship_base_speed}](https://obelisk.club/) \n`
                    currentData += `<a:LS:896440044464767036> **Lasers **[${ship.laser_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ex:896440044515106846> **Exstras **[${ship.extra_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:hs:896442508207341598> **HellStorm **[${ship.hellstorm_quantity}](https://obelisk.club/) \n`
                    currentData += `<a:ca:896440044536102983> **Cargo **[${ship.max_cargo}](https://obelisk.club/) \n`

                    if (count === itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        currentData = "";
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <SHIPS>", interaction.user, `Page 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "SHIPS");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() === "lasers") {
                if (searchItem === null) {
                    lasersList = await interaction.client.databaseSelcetData(`SELECT * FROM lasers_info WHERE available = 1`);
                } else {
                    lasersList = await interaction.client.databaseSelcetData(`SELECT * FROM lasers_info WHERE available = 1 and laser_model = ?`, [searchItem.toUpperCase()]);
                }

                if (lasersList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });

                itemTable = "user_lasers";
                itemColumn = "laser_model";
                await lasersList.forEach((laser, index) => {
                    count++;
                    priceCredit.push(laser.credit);
                    priceUnits.push(laser.units);
                    itemName.push(laser.laser_model);

                    currentData = `**${laser.emoji_id} LASER MODEL:** **[${laser.laser_model}](https://obelisk.club/)**\n**PRICE: **`

                    if (laser.credit === 0) {
                        currentData += `<:ObeliskGift:815706852670046248> __**${laser.units}**__ \n`
                    } else {
                        currentData += `<:coin:746503546173784095> __**${laser.credit}**__ \n`
                    }

                    currentData += `<a:dmg:896724820149035048> **Damage **[${laser.damage_value}](https://obelisk.club/) \n`
                    currentData += `<a:up:896725276023717958> **DMG Increse per LvL **[${laser.per_increase_by_level}](https://obelisk.club/) \n`

                    if (count === itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        currentData = "";
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <LASERS>", interaction.user, `Page 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "LASERS");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() === "shields") {
                if (searchItem === null) {
                    shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1`);
                } else {
                    shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1 and shield_model = ?`, [searchItem.toLowerCase()]);
                }

                if (shieldsList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });


                itemTable = "user_shields";
                itemColumn = "shield_model"
                await shieldsList.forEach((shield, index) => {
                    count++;
                    priceCredit.push(shield.credit);
                    priceUnits.push(shield.units);
                    itemName.push(shield.shield_model);

                    currentData = `**${shield.emoji_id} SHIELD MODEL:** **[${shield.shield_model}](https://obelisk.club/)**\n**PRICE: **`

                    if (shield.credit === 0) {
                        currentData += `<:ObeliskGift:815706852670046248> __**${shield.units}**__ \n`
                    } else {
                        currentData += `<:coin:746503546173784095> __**${shield.credit}**__ \n`
                    }

                    currentData += `<a:sd:896118359966511104> **Shield **[${shield.shield_value}](https://obelisk.club/) \n`
                    currentData += `<a:ab:896726792944119828> **Absortion Percentage **[${shield.absorption_rate}](https://obelisk.club/) \n`
                    currentData += `<a:up:896725276023717958> **Shield increse per LvL **[${shield.per_increase_by_level}](https://obelisk.club/) \n`

                    if (count === itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        currentData = "";
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <SHIELDS>", interaction.user, `Page 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "SHIELDS");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() === "engines") {
                itemsPerPage = 3;
                count = 0;
                if (searchItem === null) {
                    enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1`);
                } else {
                    enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1 and engine_model = ?`, [searchItem.toUpperCase()]);
                }

                if (enginesList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });

                itemTable = "user_engines";
                itemColumn = "engine_model"
                await enginesList.forEach((engine, index) => {
                    count++;
                    priceCredit.push(engine.credit);
                    priceUnits.push(engine.units);
                    itemName.push(engine.engine_model);


                    currentData += `**${engine.emoji_id} ENGINE MODEL:** **[${engine.engine_model}](https://obelisk.club/)**\n**PRICE: **`

                    if (engine.credit === 0) {
                        currentData += `<:ObeliskGift:815706852670046248> __**${engine.units}**__ \n`
                    } else {
                        currentData += `<:coin:746503546173784095> __**${engine.credit}**__ \n`
                    }

                    currentData += `<a:sp:896440044456378398> **Speed **[${engine.speed_value}](https://obelisk.club/) \n`

                    if (count === itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        currentData = "";
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <ENGINE>", interaction.user, `Page 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, items, "ENGINE");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            } else if (interaction.options.getString('category').toLowerCase() === "ammunition") {
                if (searchItem === null) {
                    ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1`);
                } else {
                    ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1 and ammo_id = ?`, [searchItem.toUpperCase()]);
                }
                count = 0;
                itemsPerPage = 4;
                if (ammunitionList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });


                itemTable = "ammunition";
                await ammunitionList.forEach((ammunition, index) => {
                    count++;
                    priceCredit.push(ammunition.credit);
                    priceUnits.push(ammunition.units);
                    itemName.push(ammunition.ammo_id);

                    currentData += `**⦿ Ammunition ID:** **[${ammunition.ammo_id}](https://obelisk.club/)**\n**PRICE: **`

                    if (ammunition.credit === 0) {
                        currentData += `<:ObeliskGift:815706852670046248> __**${ammunition.units}**__ \n`
                    } else {
                        currentData += `<:coin:746503546173784095> __**${ammunition.credit}**__ \n`
                    }

                    currentData += `**Description**\n${ammunition.description}\n`



                    if (count === itemsPerPage) {
                        items.push(currentData);
                        count = 0;
                        currentData = "";
                    }
                });

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                embed = interaction.client.bluePagesEmbed(items[0], "SHOP <AMMUNITION>", interaction.user, `Page 1 of ${maxPages}`);
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, priceCredit, priceUnits, interaction, items, "AMMUNITION");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            }
        /*}
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
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

function buttonHandler(userInfo, itemName, itemTable, itemColumn, priceCredit, priceUnits, interaction, inventoryData, category) {
    let maxIndex = inventoryData.length - 1;
    let index = 0;
    let buyBool = false;
    let quantity = 1;

    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (!buyBool) {
            if (i.customId === 'left')
                index--;
            else if (i.customId === 'right')
                index++;
            if (index < 0)
                index += maxIndex + 1;
            if (index > maxIndex)
                index -= maxIndex + 1;
            if (i.customId === "buy") {
                if (itemTable === "ammunition")
                    itemColumn = `${itemName[index]}_magazine`;
                if (priceCredit[index] > 0)
                    if (priceCredit[index] > userInfo.credit)
                        await i.update({ embeds: [interaction.client.redEmbed(`Not enough Credit`, "ERROR!")], components: [row] });
                    else {
                        if (itemTable === "user_ships") {
                            await i.update({ embeds: [interaction.client.greenEmbed(`item bought`, "bought!")], components: [] });
                            collector.stop("Bought");
                            return;
                        }
                        await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** ${itemName[index]} || **Quantity:** ${quantity}\n**Total Credit:** ${quantity * priceCredit[index]}\n**Owned Credit**: ${userInfo.credit}`, "Buying")], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                        buyBool = true;

                    }
                else
                    if (priceUnits[index] > userInfo.units)
                        await i.update({ embeds: [interaction.client.redEmbed(`Not enough Units`, "ERROR!")], components: [row] });
                    else {
                        if (itemTable === "user_ships") {
                            await i.update({ embeds: [interaction.client.greenEmbed(`item bought`, "bought!")], components: [] });
                            collector.stop("Bought");
                            //DATABASE INFO
                            return;
                        }
                        await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** ${itemName[index]} || **Quantity:** ${quantity}\n**Total Units:** ${quantity * priceUnits[index]}\n**Owned Units**: ${userInfo.units}`, "Buying")], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                        buyBool = true;
                    }
            }
            else
                await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], `SHOP <${category}>`, interaction.user, `Page ${index + 1} of ${maxIndex + 1}`)] });
        }
        else {
            if (i.customId === "cancelItem") {
                buyBool = false;
                await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], `SHOP <${category}>`, interaction.user, `Page ${index + 1} of ${maxIndex + 1}`)], components: [row] });
            }
            else if (i.customId === "buyItem") {
                if (priceCredit[index] > 0)
                    if (priceCredit[index] > userInfo.credit)
                        await i.update({ embeds: [interaction.client.redEmbed(`Not enough Credit`, "ERROR!")], components: [row] });
                    else {
                        await i.update({ embeds: [interaction.client.greenEmbed(`item bought`, "bought!")], components: [] });
                        collector.stop("Bought");
                        //DATABASE INFO
                        return;
                    }
                else
                    if (priceUnits[index] > userInfo.units)
                        await i.update({ embeds: [interaction.client.redEmbed(`Not enough Units`, "ERROR!")], components: [row] });
                    else {
                        await i.update({ embeds: [interaction.client.greenEmbed(`item bought`, "bought!")], components: [] });
                        collector.stop("Bought");
                        //DATABASE INFO
                        return;
                    }
            }
            else {
                let add = parseInt(i.customId);
                if (Number.isInteger(add))
                    quantity += add
                if (quantity < 1) {
                    quantity -= add;
                    await i.update({ embeds: [interaction.client.redEmbed(`**Quantity can not be less than 1!**\n**Item**: testing || **Quantity**: ${quantity}`, "ERROR!")], components: [quantityButtonUp, quantityButtonDown] });
                }
                else if (priceCredit[index] > 0)
                    await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** ${itemName[index]} || **Quantity:** ${quantity}\n**Total Credit:** ${quantity * priceCredit[index]}\n**Owned Credit**: ${userInfo.credit}`, "Buying")], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                else
                    await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** ${itemName[index]} || **Quantity:** ${quantity}\n**Total Units:** ${quantity * priceUnits[index]}\n**Owned Units**: ${userInfo.units}`, "Buying")], components: [quantityButtonUp, quantityButtonDown, buySetting] });
            }
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