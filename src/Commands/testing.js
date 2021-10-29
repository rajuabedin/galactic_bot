const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('testing'),

    async execute(interaction) {
        //try {
        await interaction.reply({ embeds: [interaction.client.blueEmbed(`testing`, "Buy Item")], components: [buy] });
        let quantity = 1;
        let priceCredit = 4;
        let priceUnits = 0;

        const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 20000 });
        collector.on('collect', async i => {
            collector.resetTimer({ time: 20000 });
            let add = parseInt(i.customId);
            if (Number.isInteger(add))
                quantity += add
            if (quantity < 1) {
                quantity -= add;
                await i.update({ embeds: [interaction.client.redEmbed(`**Quantity can not be less than 1!**\n**Item**: testing || **Quantity**: ${quantity}`, "ERROR!")], components: [quantityButtonUp, quantityButtonDown] });
            }
            else if (priceCredit > 0)
                await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** testing || **Quantity:** ${quantity}\n**Total Credit:** ${quantity * priceCredit}`, "Buying")], components: [quantityButtonUp, quantityButtonDown] });
            else
                await i.update({ embeds: [interaction.client.blueEmbed(`**Item:** testing || **Quantity:** ${quantity}\n**Total Units:** ${quantity * priceUnits}`, "Buying")], components: [quantityButtonUp, quantityButtonDown] });
            //collector.stop("Ended");
        });
        collector.on('end', collected => {
            interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] });
        });
        /*} catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
    }
}

const buy = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('buy')
            .setLabel('BUY')
            .setStyle('SUCCESS'),
    );

const quantityButtonUp = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('1')
            .setLabel('+1')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10')
            .setLabel('+10')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('100')
            .setLabel('+100')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('1000')
            .setLabel('+1K')
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
            .setLabel('-1')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10')
            .setLabel('-10')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-100')
            .setLabel('-100')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-1000')
            .setLabel('-1K')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10000')
            .setLabel('-10K')
            .setStyle('DANGER'),
    );