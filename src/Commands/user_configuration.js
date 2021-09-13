const Command = require('../Structures/Command.js');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt_configuration')
        .setDescription('Configure laser, missiles and hellstorm in hunt!'),

    async execute(interaction) {
        let [hp, sh, setting_row] = await buttonHandler();
        let message = "Select which ammunition you want to configure";
        await interaction.reply({ embeds: [interaction.client.yellowEmbed(message)], ephemeral: true, components: [hp, sh, row, setting_row] });
        message = null;
        let timestamp = Math.floor(interaction.createdTimestamp /1000);
        const filter = i => i.user.id === interaction.user.id && Math.floor(i.message.createdTimestamp / 1000) === timestamp;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });
        collector.on('collect', async i => {
            collector.resetTimer({ time: 10000 });
            if (i.customId === "select") {
                message = `**${i.values[0]}:`;
                [hp, sh, setting_row] = await buttonHandler();
                await i.update({ embeds: [interaction.client.yellowEmbed(message + "     HP: 0     SH: 0**")], components: [hp, sh, row, setting_row] });
            }
            else if (message !== null) {
                let index = parseInt(i.customId);
                if (i.customId === "disable") {
                    [hp, sh, setting_row] = await buttonHandler(-1, "DANGER");
                    await i.update({ embeds: [interaction.client.redEmbed(message + ` is DISABLED**`)], components: [hp, sh, row, setting_row] });
                }
                else if (i.customId === "empty") {
                    [hp, sh, setting_row] = await buttonHandler();
                    await i.update({ embeds: [interaction.client.yellowEmbed(message + "     HP: 0     SH: 0**")], components: [hp, sh, row, setting_row] });
                }
                else if (index < 5) {
                    [hp, sh, setting_row] = await buttonHandler(index);
                    await i.update({ embeds: [interaction.client.greenEmbed(message + `     HP: ${index * 20 + 20}     SH: 0**`)], components: [hp, sh, row, setting_row] });
                }
                else if (index < 10) {
                    [hp, sh, setting_row] = await buttonHandler(index);
                    await i.update({ embeds: [interaction.client.blueEmbed(message + `     HP: 100     SH: ${(index - 4) * 20}**`)], components: [hp, sh, row, setting_row] });
                }
                else
                    await i.update({});
            }
            else
                await i.update({});
            if (i.customId === "discard")
                collector.stop("Ended");
        });
        collector.on('end', collected => {
            interaction.editReply({ components: [] });
        });
    }
}


async function buttonHandler(selected_index = -1, button_styile = "SECONDARY") {

    let hp = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("0")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("1")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("2")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("3")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("4")
                .setLabel("          ")
                .setStyle(button_styile),
        );
    let sh = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("5")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("6")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("7")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("8")
                .setLabel("          ")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("9")
                .setLabel("          ")
                .setStyle(button_styile),
        );
    let setting_row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("discard")
                .setEmoji("🔚")
                .setStyle("DANGER"),
            new MessageButton()
                .setCustomId("disable")
                .setEmoji("✖️")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("21")
                .setLabel("                      ")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("empty")
                .setEmoji("🗑️")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("save")
                .setEmoji("💾")
                .setStyle("SUCCESS"),
        );

    let index = 0;

    if (selected_index < 5 && selected_index !== -1) {
        for (index; index <= selected_index; index++) {
            hp.components[index].setStyle('SUCCESS');
        }
    }
    else if (selected_index >= 5) {
        hp.components[0].setStyle('SUCCESS');
        hp.components[1].setStyle('SUCCESS');
        hp.components[2].setStyle('SUCCESS');
        hp.components[3].setStyle('SUCCESS');
        hp.components[4].setStyle('SUCCESS');
        for (index; index <= selected_index - 5; index++) {
            sh.components[index].setStyle('PRIMARY');
        }
    }
    return [hp, sh, setting_row];
}

const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId('select')
            .setPlaceholder('Select ammo to configure')
            .addOptions([
                {
                    label: 'x2',
                    description: 'Use laser x2 utill... ',
                    value: 'x2',
                },
                {
                    label: 'x3',
                    description: 'Use laser x3 utill... ',
                    value: 'x3',
                },
                {
                    label: 'x4',
                    description: 'Use laser x4 utill... ',
                    value: 'x4',
                },
                {
                    label: 'lS1',
                    description: 'Use laser lS1 utill... ',
                    value: 'lS1',
                },
                {
                    label: 'm1',
                    description: 'Use missile m1 utill... ',
                    value: 'm1',
                },
                {
                    label: 'm2',
                    description: 'Use missile m2 utill... ',
                    value: 'm2',
                },
                {
                    label: 'm3',
                    description: 'Use missile m3 utill... ',
                    value: 'm3',
                },
                {
                    label: 'm4',
                    description: 'Use missile m4 utill... ',
                    value: 'm4',
                },
                {
                    label: 'h1',
                    description: 'Use hellstorm h1 utill... ',
                    value: 'h1',
                },
                {
                    label: 'h2',
                    description: 'Use hellstorm h2 utill... ',
                    value: 'h2',
                },
                {
                    label: 'hS1',
                    description: 'Use hellstorm hS1 utill... ',
                    value: 'hS1',
                },
                {
                    label: 'hS2',
                    description: 'Use hellstorm hS2 utill... ',
                    value: 'hS2',
                },
            ]),
    )

    