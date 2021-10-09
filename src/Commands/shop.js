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
            var itemsPerPage = 3;
            var currentData = "";

            // check if its a valid category
            if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });

            if (interaction.options.getString('category').toLowerCase() === "ships") {
                itemsPerPage = 1
                if (searchItem === null) {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1`);
                } else {
                    shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [searchItem.toUpperCase()]);
                }

                if (shipsList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed("Unable to find any item with: `" + searchItem.toUpperCase() + "`", "Error!!")], ephemeral: true });

                await shipsList.forEach((ship, index) => {
                    count++;

                    currentData = `**SHIP MODEL:** **[${ship.ship_model}](https://obelisk.club/)**\n**PRICE: **`

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

                console.log(lasersList);

            } else if (interaction.options.getString('category').toLowerCase() === "shields") {
                if (searchItem === null) {
                    shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1`);
                } else {
                    shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1 and shield_model = ?`, [searchItem.toLowerCase()]);
                }
                console.log(shieldsList);

            } else if (interaction.options.getString('category').toLowerCase() === "engines") {
                if (searchItem === null) {
                    enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1`);
                } else {
                    enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1 and engine_model = ?`, [searchItem.toUpperCase()]);
                }
                console.log(enginesList);

            } else if (interaction.options.getString('category').toLowerCase() === "ammunition") {
                if (searchItem === null) {
                    ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1`);
                } else {
                    ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1 and ammo_id = ?`, [searchItem.toUpperCase()]);
                }
                console.log(ammunitionList);

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