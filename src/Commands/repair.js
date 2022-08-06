const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repair')
        .setDescription('repair current ship'),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });



        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        try {
            if (userInfo.tutorial_counter < 8) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let ship = await interaction.client.databaseSelectData("SELECt ships_info.credit, ships_info.units, ships_info.ship_hp, user_ships.durability FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE user_ships.user_id = ? AND equipped = 1", [interaction.user.id]);
            let durability = 100 - ship[0].durability;
            let price = 0;
            let unit = "credit"
            if (ship[0].credit > 0) {
                price = ship[0].credit * 0.075;
            }
            else if (ship[0].units > 0) {
                price = ship[0].units * 0.5;
                //unit = "units"
            }
            else {
                if (ship[0].durability == 0) {
                    await interaction.client.databaseEditData(`UPDATE users SET user_hp = ? WHERE user_id = ?`, [ship[0].ship_hp, interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ?, durability = 100 WHERE equipped = 1 AND user_id = ?", [ship[0].ship_hp, interaction.user.id]);
                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairDone'), interaction.client.getWordLanguage(serverSettings.lang, 'repairSuccesful'))] });
                    return;
                }
                else {
                    await interaction.client.databaseEditData("UPDATE user_ships SET durability = 100 WHERE equipped = 1 AND user_id = ?", [interaction.user.id]);
                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairDone'), interaction.client.getWordLanguage(serverSettings.lang, 'repairSuccesful'))] });
                    return;
                }
            }
            price = Math.ceil(price * (durability / 25));
            await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repair').format(interaction.client.defaultEmojis[unit], price, interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units), "Repair")], components: [rowYesNo], fetchReply: true });

            if (ship[0].ship_hp == 0) {
                if (ship[0].units > 0) {
                    price = ship[0].units * 0.01;
                    unit = "units"
                } else {
                    price = ~~(price * 1.2);
                }
            }


            const collector = msg.createMessageComponentCollector({ time: 15000 });

            collector.on('collect', async i => {
                i.deferUpdate();


                try {
                    if (i.user.id == interaction.user.id) {
                        if (i.customId == 'yes') {
                            if ((unit == "credit" && userInfo.credit >= price) || (unit == "units" && userInfo.units >= price)) {
                                if (ship[0].durability == 0) {
                                    await interaction.client.databaseEditData(`UPDATE users SET user_hp = ?, ${unit} = ${unit} - ? WHERE user_id = ?`, [ship[0].ship_hp, price, interaction.user.id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ?, durability = 100 WHERE equipped = 1 AND user_id = ?", [ship[0].ship_hp, interaction.user.id]);
                                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairDone'), interaction.client.getWordLanguage(serverSettings.lang, 'repairSuccesful'))], components: [] });
                                    collector.stop("repaired");
                                    return;
                                }
                                else {
                                    await interaction.client.databaseEditData(`UPDATE users SET ${unit} = ${unit} - ? WHERE user_id = ?`, [price, interaction.user.id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET durability = 100 WHERE equipped = 1 AND user_id = ?", [interaction.user.id]);
                                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairDone'), interaction.client.getWordLanguage(serverSettings.lang, 'repairSuccesful'))], components: [] });
                                    collector.stop("repaired");
                                    return;
                                }
                            } else {
                                await interaction.editReply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairFail').format(interaction.client.defaultEmojis[unit], price), "ERROR!")], components: [] });
                                collector.stop("fail");
                                return;
                            }
                        }
                        else {
                            await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'interactionCancel'), interaction.client.getWordLanguage(serverSettings.lang, 'cancel'))], components: [] })
                            collector.stop("ended");
                            return;
                        }
                    }
                    else
                        await interaction.editReply({});
                }
                catch (error) { }
            });

            collector.on('end', collected => {
                interaction.editReply({ components: [] })
            });
        }
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}

const rowYesNo = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('yes')
            .setLabel('YES')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('no')
            .setLabel('NO')
            .setStyle('DANGER'),
    );