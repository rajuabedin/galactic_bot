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
        try {
            var searchItem = interaction.options.getString('search')
            var items = [];
            var embed;
            var count = 0;
            var itemsPerPage = 1;
            var currentData = "";

            // check if its a valid category
            if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });

            if (interaction.options.getString('category').toLowerCase() === "ships") {
                if (searchItem === null) {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1`);
                } else {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [searchItem.toUpperCase()]);
                }

                if (shipsList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });

                await shipsList.forEach((ship, index) => {
                    count++;

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
                    buttonHandler(interaction, items, "SHIPS");
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

                await lasersList.forEach((laser, index) => {
                    count++;

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
                    buttonHandler(interaction, items, "LASERS");
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

                await shieldsList.forEach((shield, index) => {
                    count++;

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
                    buttonHandler(interaction, items, "SHIELDS");
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

                await enginesList.forEach((engine, index) => {
                    count++;

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
                    buttonHandler(interaction, items, "ENGINE");
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

                await ammunitionList.forEach((ammunition, index) => {
                    count++;

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
                    buttonHandler(interaction, items, "AMMUNITION");
                } else {
                    await interaction.reply({ embeds: [embed] });
                }

            }
        }
        catch (error) {
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
            //.setLabel('Left')
            .setEmoji('887811358509379594')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('right')
            //.setLabel('Right')
            .setEmoji('887811358438064158')
            .setStyle('PRIMARY'),
    );

function buttonHandler(interaction, inventoryData, category) {
    let maxIndex = inventoryData.length - 1;
    let index = 0;

    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (i.customId === 'left') {
            index--;
        }
        else if (i.customId === 'right') {
            index++;
        }

        if (index < 0) {
            index += maxIndex + 1;
        }
        if (index > maxIndex) {
            index -= maxIndex + 1;
        }
        await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], `SHOP <${category}>`, interaction.user, `Page ${index + 1} of ${maxIndex + 1}`)] });
        embed = interaction.client;
    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
    });
}