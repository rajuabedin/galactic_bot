const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageButton } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('repair')
        .setDescription('repair current ship'),

    async execute(interaction, userInfo, serverSettings) {

        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        try {
            let price = 1000;
            let unit = "credit"
            await interaction.reply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repair').format(interaction.client.defaultEmojis[unit], price, interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units), "Repair")], components: [rowYesNo] });
            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'yes') {
                    if (userInfo.credit >= 1000) {
                        let maxHP = await interaction.client.databaseSelcetData(`SELECT * FROM user_ships WHERE equipped = 1 AND user_id = ?`, [interaction.user.id]);
                        maxHP = maxHP[0].ship_hp;
                        await interaction.client.databaseEditData("UPDATE users SET user_hp = ?, ? = ? - ? WHERE user_id = ?", [maxHP, unit, unit, price, interaction.user.id]);
                        await interaction.client.databaseEditData("UPDATE user_ships SET ship_hp = ? WHERE equipped = 1 AND user_id = ?", [maxHP, interaction.user.id]);
                        await i.update({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairDone'), interaction.client.getWordLanguage(serverSettings.lang, 'repairSuccesful'))], components: [] });
                        collector.stop("repaired");
                    } else {
                        await i.update({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'repairFail').format(interaction.client.defaultEmojis[unit], price), "ERROR!")], components: [] });
                        collector.stop("fail");
                    }
                }
                else {
                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'interactionCancel'), interaction.client.getWordLanguage(serverSettings.lang, 'cancel'))], components: [] })
                    collector.stop("ended");
                }
            });

            collector.on('end', collected => {
                interaction.editReply({ components: [] })
            });
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
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