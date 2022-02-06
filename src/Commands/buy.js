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
                .setRequired(true)),


    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        
        try {
            // check if its a valid category
            if (!(['ships', 'lasers', 'shields', 'engines', 'ammunition'].includes(interaction.options.getString('category').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct category.", "Error!!")], ephemeral: true });

            var quantity = interaction.options.getInteger('quantity');

            if (quantity < 1) return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'sellNot'), "Error!!")], ephemeral: true });

            if (interaction.options.getString('category').toLowerCase() === "ships") {
                shipsList = await interaction.client.databaseSelcetData(`SELECT * FROM ships_info WHERE available = 1 and ship_model = ?`, [interaction.options.getString('item').toUpperCase()]);

                shipsList = shipsList[0]

                if (typeof shipsList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shipFoundNot'), "Error!!")], ephemeral: true });

                let cost = "for "

                if (shipsList.credit > 0) {
                    cost += `__**${shipsList.credit * quantity} Credits**__`
                } else {
                    cost += `__**${shipsList.units * quantity} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shipBuy').format(shipsList.ship_model, cost), interaction.client.getWordLanguage(serverSettings.lang, 'buy'))], components: [row] });
                buttonHandler(interaction, shipsList, "SHIPS", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "lasers") {
                lasersList = await interaction.client.databaseSelcetData(`SELECT * FROM lasers_info WHERE available = 1 and laser_model = ?`, [interaction.options.getString('item').toUpperCase()]);

                lasersList = await lasersList[0];

                if (typeof lasersList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'laserFoundNot'), "Error!!")], ephemeral: true });

                let cost = "for "

                if (lasersList.credit > 0) {
                    cost += `__**${lasersList.credit * quantity} Credits**__`
                } else {
                    cost += `__**${lasersList.units * quantity} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${lasersList.laser_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, lasersList, "LASERS", quantity);



            } else if (interaction.options.getString('category').toLowerCase() === "shields") {
                shieldsList = await interaction.client.databaseSelcetData(`SELECT * FROM shields_info WHERE available = 1 and shield_model = ?`, [interaction.options.getString('item').toUpperCase()]);

                shieldsList = shieldsList[0];

                if (typeof shieldsList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'shieldFoundNot'), "Error!!")], ephemeral: true });

                let cost = "for "

                if (shieldsList.credit > 0) {
                    cost += `__**${shieldsList.credit * quantity} Credits**__`
                } else {
                    cost += `__**${shieldsList.units * quantity} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${shieldsList.shield_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, shieldsList, "SHIELDS", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "engines") {

                enginesList = await interaction.client.databaseSelcetData(`SELECT * FROM engines_info WHERE available = 1 and engine_model = ?`, [interaction.options.getString('item').toUpperCase()]);

                enginesList = enginesList[0];

                if (typeof enginesList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'engineFoundNot'), "Error!!")], ephemeral: true });

                let cost = "for "

                if (enginesList.credit > 0) {
                    cost += `__**${enginesList.credit * quantity} Credits**__`
                } else {
                    cost += `__**${enginesList.units * quantity} Units**__`
                }

                await interaction.reply({ embeds: [interaction.client.blueEmbed(`Do you want to buy **${quantity}**x **[${enginesList.engine_model}]('https://obelisk.club/')** ${cost} ?`, "Buy Item")], components: [row] });
                buttonHandler(interaction, enginesList, "ENGINE", quantity);


            } else if (interaction.options.getString('category').toLowerCase() === "ammunition") {
                ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1 and ammo_id = ?`, [interaction.options.getString('item').toUpperCase()]);

                ammunitionList = ammunitionList[0];

                if (typeof ammunitionList === 'undefined') return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ammoFoundNot'), "Error!!")], ephemeral: true });

                let cost = "for "

                if (ammunitionList.credit > 0) {
                    cost += `__**${ammunitionList.credit * quantity} Credits**__`
                } else {
                    cost += `__**${ammunitionList.units * quantity} Units**__`
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
                costCredit = itemInfo.credit * quantity;
                costUnit = itemInfo.units * quantity;
            }


            if (costCredit > 0) {
                if (costCredit > userInfo.credit) return await i.reply({ embeds: [interaction.client.redEmbed("Error! You do not have enough credits.", "Declined")], components: [] });
            } else {
                if (costUnit > userInfo.units) return await i.reply({ embeds: [interaction.client.redEmbed("Error! You do not have enough units.", "Declined")], components: [] });
            }

            // deduct the currency

            let updatedFields = await interaction.client.databaseEditData(`update users SET credit = credit - ?, units = units - ? where user_id = ?`, [costCredit, costUnit, interaction.user.id])

            var query = ""

            if (category === "SHIPS") {
                query = `insert into user_ships (ship_damage, ship_hp, ship_shield, ship_speed, ship_penetration, ship_absortion_rate, ship_cargo, ship_model, user_id) VAlUES (0,${itemInfo.ship_hp},0,${itemInfo.ship_base_speed},0,0,${itemInfo.max_cargo},'${itemInfo.ship_model}','${interaction.user.id}')`
            } else if (category === "LASERS") {
                query = `insert into user_lasers (laser_model, user_id) VAlUES ('${itemInfo.laser_model}', '${interaction.user.id}')`
            } else if (category === "SHIELDS") {
                query = `insert into user_shields (shield_model, user_id) VAlUES ('${itemInfo.laser_model}', '${interaction.user.id}')`
            } else if (category === "ENGINE") {
                query = `insert into user_engines (engine_model, user_id) VAlUES ('${itemInfo.laser_model}', '${interaction.user.id}')`
            } else if (category === "AMMUNITION") {
                query = `update ammunition set ${itemInfo.ammo_id}_magazine = ${itemInfo.ammo_id}_magazine + ${quantity} where user_id = ${interaction.user.id}`
            }

            await interaction.client.databaseEditData(query);
            return await i.reply({ embeds: [interaction.client.greenEmbed("You have successfully bought the item.", "Successfull")], components: [] })

        }


    });

    collector.on('end', collected => {
        interaction.editReply({ embeds: [interaction.client.redEmbed("Transaction has been canceled.", "Cancelled")], components: [] })
    });
}