const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('To check your inventory!')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Enter the item you want to search')
                .setRequired(false)),

    async execute(interaction) {
        try {
            let user = await interaction.client.getUserAccount(interaction.user.id);
            if (typeof user === 'undefined') {
                return await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
            }

            var user_lasers = await interaction.client.databaseSelcetData("SELECT user_lasers.laser_model as item_name, user_lasers.level, user_lasers.equipped, lasers_info.sell_price, lasers_info.description from user_lasers INNER JOIN lasers_info on user_lasers.laser_model = lasers_info.laser_model WHERE user_lasers.user_id = ? ORDER BY user_lasers.laser_model", [interaction.user.id]);
            var user_shields = await interaction.client.databaseSelcetData("SELECT user_shields.shield_model as item_name, user_shields.level, user_shields.equipped, shields_info.sell_price, shields_info.description from user_shields INNER JOIN shields_info on user_shields.shield_model = shields_info.shield_model WHERE user_shields.user_id = ? ORDER BY user_shields.shield_model", [interaction.user.id]);
            var user_engines = await interaction.client.databaseSelcetData("SELECT user_engines.engine_model as item_name, user_engines.level, user_engines.equipped, engines_info.sell_price, engines_info.description from user_engines INNER JOIN engines_info on user_engines.engine_model = engines_info.engine_model WHERE user_engines.user_id = ? ORDER BY user_engines.engine_model", [interaction.user.id]);

            var user_inventory = user_lasers.concat(user_shields).concat(user_engines);
            if (user_inventory === undefined || user_inventory.length == 0) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed("Your Inventory is empty!")] });
            } else {
                var searchItem = interaction.options.getString('search')
                var items = [];
                var embed;
                var count = 0;
                var itemsPerPage = 3;
                var currentData = "";

                if (searchItem === null) {
                    await user_inventory.forEach((item, index) => {
                        count++;
                        currentData += "`LVL " + item.level + "` " + `**${item.item_name} [<:coin2:784486506051010561> ${item.sell_price}]** ${(item.equipped == '1') ? '<a:equipped:888574837746987098>' : ''}\n${item.description}\n`;
                        if (count === itemsPerPage) {

                            items.push(currentData);
                            count = 0;
                            currentData = "";
                        }
                    });
                } else {
                    await user_inventory.forEach((item, index) => {
                        if (item.item_name.toLowerCase().includes(searchItem.toLowerCase()) || item.description.toLowerCase().includes(searchItem.toLowerCase())) {
                            count++;
                            currentData += "`LVL " + item.level + "` " + `**${item.item_name} [<:coin2:784486506051010561> ${item.sell_price}]** ${(item.equipped == '1') ? '<a:equipped:888574837746987098>' : ''}\n${item.description}\n`;
                            if (count === itemsPerPage) {
                                items.push(currentData);
                                count = 0;
                                currentData = "";
                            }
                        }
                    });
                }

                if (currentData !== "") {
                    items.push(currentData);
                }

                var maxPages = items.length;

                if (items == "") {
                    embed = interaction.client.redEmbed("Item not found!");
                } else {
                    embed = interaction.client.bluePagesEmbed(items[0], "INVENTORY", interaction.user, `Page 1 of ${maxPages}`);
                }
                if (items.length > 1) {
                    await interaction.reply({ embeds: [embed], components: [row] });
                    buttonHandler(interaction, items);
                } else {
                    await interaction.reply({ embeds: [embed] });
                }


            }
        } catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
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

function buttonHandler(interaction, inventoryData) {
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
        await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], "INVENTORY", interaction.user, `Page ${index + 1} of ${maxIndex + 1}`)] });
        embed = interaction.client;
    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
        //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
    });
}