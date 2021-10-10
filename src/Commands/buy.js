const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy items for credit/units.!')
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
            option.setName('item')
                .setDescription('Enter the item id/model_id you want to buy')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('Please enter the quantity you want to buy')
                .setRequired(false)),


    async execute(interaction, userInfo) {
        try {
            var quantity = 1;
            // check if its a valid category
            if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });

            if (!interaction.options.getInteger('quantity') === null) quantity = interaction.options.getInteger('quantity');

            if (interaction.options.getString('category').toLowerCase() === "ships") {
                shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [interaction.options.getString('item').toUpperCase()]);

                shipsList = shipsList[0]

                if (typeof shipsList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed("Sorry, I was not able to find the specified ship.", "Error!!")], ephemeral: true });

                let cost = "for "

                if (shipsList.credit > 0) {
                    cost += `__**${shipsList.credit} Credits**__`
                } else {
                    cost += `__**${shipsList.units} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${shipsList.ship_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, shipsList, "SHIPS", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "lasers") {
                lasersList = await interaction.client.databaseSelcetData(`SELECT * FROM lasers_info WHERE available = 1 and laser_model = ?`, [searchItem.toUpperCase()]);

                lasersList = await lasersList[0];

                if (typeof lasersList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed("Sorry, I was not able to find the specified ship.", "Error!!")], ephemeral: true });

                let cost = "for "

                if (lasersList.credit > 0) {
                    cost += `__**${lasersList.credit} Credits**__`
                } else {
                    cost += `__**${lasersList.units} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${lasersList.laser_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, lasersList, "LASERS", quantity);



            } else if (interaction.options.getString('category').toLowerCase() === "shields") {
                shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1 and shield_model = ?`, [searchItem.toLowerCase()]);

                shieldsList = shieldsList[0];

                if (typeof shieldsList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed("Sorry, I was not able to find the specified ship.", "Error!!")], ephemeral: true });

                let cost = "for "

                if (shieldsList.credit > 0) {
                    cost += `__**${shieldsList.credit} Credits**__`
                } else {
                    cost += `__**${shieldsList.units} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${shieldsList.shield_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, shieldsList, "SHIELDS", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "engines") {

                enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1 and engine_model = ?`, [searchItem.toUpperCase()]);

                enginesList = enginesList[0];

                if (typeof enginesList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed("Sorry, I was not able to find the specified ship.", "Error!!")], ephemeral: true });

                let cost = "for "

                if (enginesList.credit > 0) {
                    cost += `__**${enginesList.credit} Credits**__`
                } else {
                    cost += `__**${enginesList.units} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${enginesList.engine_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, enginesList, "ENGINE", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "ammunition") {
                ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1 and ammo_id = ?`, [searchItem.toUpperCase()]);

                ammunitionList = ammunitionList[0];

                if (typeof ammunitionList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed("Sorry, I was not able to find the specified ship.", "Error!!")], ephemeral: true });

                let cost = "for "

                if (ammunitionList.credit > 0) {
                    cost += `__**${ammunitionList.credit} Credits**__`
                } else {
                    cost += `__**${ammunitionList.units} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${ammunitionList.ammo_id}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, ammunitionList, "AMMUNITION", quantity);

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
            .setCustomId('cancel')
            //.setLabel('Right')
            .setLabel('Cancel')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('buy')
            //.setLabel('Left')
            .setLabel('Buy')
            .setStyle('SUCCESS'),
    );


function buttonHandler(interaction, itemInfo, category, quantity) {
    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (i.customId === "cancel") {
            return collector.stop();
        } else {
            const userInfo = await interaction.client.getUserAccount(interaction.user.id);

            let costCredit = 0;
            let costUnit = 0;


            if (!interaction.client.developersID.includes(interaction.user.id)) {
                costCredit = itemInfo.credit;
                costUnit = itemInfo.units;
            }


            if (costCredit > 0) {
                if (costCredit > userInfo.credit) return await i.reply({ embeds: [interaction.client.redEmbed("Error! You do not have enough credits.", "Declined")], components: [] });

                return await i.reply({ embeds: [interaction.client.greenEmbed("You have successfully bought the item.", "Successfull")], components: [] })
            } else {
                if (costUnit > userInfo.units) return await i.reply({ embeds: [interaction.client.redEmbed("Error! You do not have enough units.", "Declined")], components: [] });

                return await i.reply({ embeds: [interaction.client.greenEmbed("You have successfully bought the item.", "Successfull")], components: [] })
            }

        }


    });

    collector.on('end', collected => {
        interaction.editReply({ embeds: [interaction.client.redEmbed("Transaction has been canceled.", "Cancelled")], components: [] })
    });
}