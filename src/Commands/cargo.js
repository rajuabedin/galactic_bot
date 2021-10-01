const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargo')
        .setDescription('To check what you have in your cargo!')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Enter the mineral you want to search')
                .setRequired(false)),

    async execute(interaction, userInfo) {
        try {


            var user_inventory = await interaction.client.databaseSelcetData("SELECT user_inventory.user_id, user_inventory.item_id, user_inventory.quantity,items_info.item_name, items_info.description, items_info.sell_price FROM user_inventory INNER join items_info on user_inventory.item_id = items_info.item_id WHERE user_inventory.user_id = ? ORDER by items_info.item_id ASC", [interaction.user.id]);
            if (user_inventory === undefined || user_inventory.length == 0) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed("Your cargo is empty!")] });
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
                        currentData += "`ID " + item.item_id + "` " + `**${item.item_name}  [<:coin2:784486506051010561> ${item.sell_price}]**\n${item.description} - **${item.quantity}**\n`;
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
                            currentData += "`ID " + item.item_id + "` " + `**${item.item_name}  [<:coin2:784486506051010561> ${item.sell_price}]**\n${item.description} - **${item.quantity}**\n`;
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
                    embed = interaction.client.bluePagesEmbed(items[0], "CARGO", interaction.user, `Page 1 of ${maxPages}`);
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
        await i.update({ embeds: [interaction.client.bluePagesEmbed(inventoryData[index], "CARGO", interaction.user, `Page ${index + 1} of ${maxIndex + 1}`)] });
        embed = interaction.client;
    });

    collector.on('end', collected => {
        interaction.editReply({ components: [] })
        //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
    });
}