const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt_configuration')
        .setDescription('Configure laser, missiles and hellstorm in hunt!'),

    async execute(interaction) {
        try {
            let discarded = false;


            let user = await interaction.client.getUserAccount(interaction.user.id);
            if (typeof user === 'undefined') {
                await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
                return;
            }
            let huntConfiguration = await interaction.client.databaseSelcetData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
            let [hp, sh, setting_row] = await buttonHandler();
            let message = "\n\n*Select __untill__ when to use selected ammo\nDisable: won't use selected ammo\nEmpty: will use the selected ammo till enemy dies*";
            let storedMessage = "";
            let selectedAmmo = "";
            let ammoValue = 0;
            await interaction.reply({ embeds: [interaction.client.yellowEmbed(message, "**Select which ammunition you want to configure**")], ephemeral: true, components: [hp, sh, row, setting_row] });
            message = null;

            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 20000 });
            collector.on('collect', async i => {
                let index = 0;
                collector.resetTimer({ time: 20000 });
                if (i.customId === "select") {
                    message = `**${i.values[0]}:**`;
                    selectedAmmo = `${i.values[0]}`;
                    //console.log(huntConfiguration[0][i.values[0]]);
                    index = (huntConfiguration[0][i.values[0]]) / 20;
                    //console.log(index);
                    if (index < 0) {
                        [hp, sh, setting_row] = await buttonHandler(-1, "DANGER");
                        await i.update({ embeds: [interaction.client.redEmbed(`**DISABLED**`, message)], components: [hp, sh, row, setting_row] });
                        storedMessage = `**(${i.values[0]})**` + "\t**DISABLED**";
                    }
                    else if (index === 0) {
                        [hp, sh, setting_row] = await buttonHandler();
                        await i.update({ embeds: [interaction.client.yellowEmbed("**HP: 0 || SH: 0**", message)], components: [hp, sh, row, setting_row] });
                        storedMessage = `**(${i.values[0]})**` + "\t**HP: 0 || SH: 0**";
                    }
                    else if (index < 5) {
                        [hp, sh, setting_row] = await buttonHandler(index - 1);
                        await i.update({ embeds: [interaction.client.greenEmbed(`**HP: ${index * 20} || SH: 0**`, message)], components: [hp, sh, row, setting_row] });
                        storedMessage = `**(${i.values[0]})**` + `\t**HP: ${index * 20} || SH: 0**`;
                    }
                    else {
                        [hp, sh, setting_row] = await buttonHandler(index - 1);
                        await i.update({ embeds: [interaction.client.blueEmbed(`**HP: 100 || SH: ${(index - 5) * 20}**`, message)], components: [hp, sh, row, setting_row] });
                        storedMessage = `**(${i.values[0]})**` + `\t**HP: 100 || SH: ${(index - 5) * 20}**`;
                    }
                }
                else if (message !== null) {
                    index = parseInt(i.customId);
                    if (i.customId === "save") {
                        await interaction.client.databaseEditData(`UPDATE hunt_configuration SET ${selectedAmmo} = ? WHERE user_id = ?`, [ammoValue, interaction.user.id]);
                        if (ammoValue < 0) {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\tDISABLED**`, "**SAVED**")], components: [hp, sh, row, setting_row] });
                        }
                        else if (ammoValue < 101) {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\tHP: ${ammoValue} || SH: 0**`, "**SAVED**")], components: [hp, sh, row, setting_row] });
                        }
                        else {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\tHP: 100 || SH: ${ammoValue - 80}**`, "**SAVED**")], components: [hp, sh, row, setting_row] });
                        }
                    }
                    else if (i.customId === "disable") {
                        [hp, sh, setting_row] = await buttonHandler(-1, "DANGER");
                        await i.update({ embeds: [interaction.client.redEmbed(`**DISABLED**`, message)], components: [hp, sh, row, setting_row] });
                        ammoValue = -3;
                    }
                    else if (i.customId === "empty") {
                        [hp, sh, setting_row] = await buttonHandler();
                        await i.update({ embeds: [interaction.client.yellowEmbed("**HP: 0 || SH: 0**", message)], components: [hp, sh, row, setting_row] });
                        ammoValue = 0;
                    }
                    else if (index < 5) {
                        [hp, sh, setting_row] = await buttonHandler(index);
                        ammoValue = (index + 1) * 20
                        await i.update({ embeds: [interaction.client.greenEmbed(`**HP: ${ammoValue} || SH: 0**`, message)], components: [hp, sh, row, setting_row] });
                    }
                    else if (index < 10) {
                        [hp, sh, setting_row] = await buttonHandler(index);
                        ammoValue = (index + 1) * 20
                        await i.update({ embeds: [interaction.client.blueEmbed(`**HP: 100 || SH: ${ammoValue - 100}**`, message)], components: [hp, sh, row, setting_row] });
                    }
                    else if (i.customId === "discard") {
                        discarded = true;
                        await i.update({ embeds: [interaction.client.redEmbed(storedMessage, "**Restored to previous state**")], components: [] });
                        collector.stop("Ended");
                    }
                    else
                        await i.update({});
                }
                else if (i.customId === "discard") {
                    discarded = true;
                    await i.update({ embeds: [interaction.client.redEmbed("\n*Aborted by user*", "**Interaction aborted**")], components: [] });
                    collector.stop("Ended");
                }
                else
                    await i.update({});
            });
            collector.on('end', collected => {
                if (!discarded)
                    interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] });
            });
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
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
                .setEmoji("887979580013563914")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("21")
                .setLabel("                      ")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("empty")
                .setEmoji("887979579854168075")
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
                    label: 'xS1',
                    description: 'Use laser xS1 utill... ',
                    value: 'xS1',
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

