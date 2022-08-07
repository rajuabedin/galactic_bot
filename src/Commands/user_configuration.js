const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt_configuration')
        .setDescription('Configure laser, missiles and hellstorm sequence')
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Select from configuration 1 or 2')
                .setRequired(true)
                .addChoice('1 (used in PVE)', 'hunt_configuration')
                .addChoice('2 (usually used in PVP)', 'pvp_configuration')
        ),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });


        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 4) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let selectedOption = interaction.options.getString('option');
            let discarded = false;
            let huntConfiguration = await interaction.client.databaseSelectData(`SELECT * FROM ${selectedOption} WHERE user_id = ?`, [interaction.user.id]);
            let [hp, sh] = await buttonHandler();
            let message = interaction.client.getWordLanguage(serverSettings.lang, 'user_config_desc');
            let storedMessage = "";
            let selectedAmmo = "";
            let ammoValue = 0;
            await interaction.editReply({ embeds: [interaction.client.yellowEmbed(message, interaction.client.getWordLanguage(serverSettings.lang, 'user_config_msg'))], components: [row, settingRow], fetchReply: true });
            message = null;
            let activateDeactivate = await buttonHandlerOnOff(0);
            let missileHellstorm = 0;
            let isMissile = false;
            let mothership = 0;
            let pvpEnable = 0;

            let index = 0;

            const collector = msg.createMessageComponentCollector({ time: 20000 });
            collector.on('collect', async i => {
                i.deferUpdate();


                if (i.user.id == interaction.user.id) {
                    index = 0;
                    collector.resetTimer({ time: 20000 });
                    if (!i.replied) {
                        try {
                            if (i.customId == "select") {
                                message = `**${i.values[0]}:**`;
                                selectedAmmo = `${i.values[0]}`;
                                //console.log(huntConfiguration[0][i.values[0]]);
                                index = (huntConfiguration[0][selectedAmmo]) / 20;
                                ammoValue = (index) * 20;
                                mothership = 0;
                                missileHellstorm = 0;
                                pvpEnable = userInfo.pvp_enable;
                                //console.log(index);
                                if (selectedAmmo == "missile" || selectedAmmo == "hellstorm") {
                                    if (selectedAmmo == "missile") {
                                        missileHellstorm = 2;
                                        isMissile = true;
                                    }
                                    else {
                                        missileHellstorm = 6;
                                        isMissile = false;
                                    }
                                    activateDeactivate = await buttonHandlerOnOff(index);
                                    if (index == 0) {
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${i.values[0]})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                        missileHellstorm = 1;
                                    }
                                    else {
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${i.values[0]})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                        if (isMissile)
                                            missileHellstorm = 2;
                                        else
                                            missileHellstorm = 6;
                                    }
                                }
                                else if (selectedAmmo == "mothership") {
                                    message = interaction.client.getWordLanguage(serverSettings.lang, "user_config_hunt_a");
                                    activateDeactivate = await buttonHandlerOnOff(index);
                                    if (index == 0) {
                                        mothership = 1;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                    }
                                    else {
                                        mothership = 2;
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                    }
                                }
                                else if (selectedAmmo == "pvpEnable") {
                                    message = interaction.client.getWordLanguage(serverSettings.lang, "user_config_pvp");
                                    activateDeactivate = await buttonHandlerOnOff(pvpEnable);
                                    if (pvpEnable) {
                                        pvpEnable = 1;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                    }
                                    else {
                                        pvpEnable = 2;
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                    }
                                }
                                else if (index < 0) {
                                    [hp, sh] = await buttonHandler(-1, "DANGER");
                                    await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [hp, sh, row, settingRow] });
                                    storedMessage = `**(${i.values[0]})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                }
                                else if (index == 0) {
                                    [hp, sh] = await buttonHandler();
                                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(`**HP: 0 || SH: 0**`, message)], components: [hp, sh, row, settingRow] });
                                    storedMessage = `**(${i.values[0]})**` + `\t**HP: 0 || SH: 0**`;
                                }
                                else if (index < 5) {
                                    [hp, sh] = await buttonHandler(index - 1);
                                    await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**HP: ${index * 20} || SH: 0**`, message)], components: [hp, sh, row, settingRow] });
                                    storedMessage = `**(${i.values[0]})**` + `\t**HP: ${index * 20} || SH: 0**`;
                                }
                                else {
                                    [hp, sh] = await buttonHandler(index - 1);
                                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**HP: 100 || SH: ${(index - 5) * 20}**`, message)], components: [hp, sh, row, settingRow] });
                                    storedMessage = `**(${i.values[0]})**` + `\t**HP: 100 || SH: ${(index - 5) * 20}**`;
                                }
                            }

                            else if (message !== null) {
                                index = parseInt(i.customId);
                                if (missileHellstorm > 0) {
                                    if (i.customId == "save2") {
                                        huntConfiguration[0][selectedAmmo] = missileHellstorm - 1;
                                        if (missileHellstorm == 1) {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\t${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            storedMessage = `**(${selectedAmmo})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                            await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [0, interaction.user.id]);
                                        }
                                        else {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\t${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            if (isMissile) {
                                                await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [1, interaction.user.id]);
                                                storedMessage = `**(${selectedAmmo})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                            }
                                            else {
                                                await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [huntConfiguration[0].helstorm_missiles_number, interaction.user.id]);
                                                if (huntConfiguration[0].helstorm_missiles_number == 0)
                                                    storedMessage = `**(${selectedAmmo})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**\n${interaction.client.getWordLanguage(serverSettings.lang, 'user_config_no_hellstorm')}`;
                                                else
                                                    storedMessage = `**(${selectedAmmo})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                            }
                                        }
                                    }
                                    else if (i.customId == "discard2") {
                                        discarded = true;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(storedMessage, `**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionEnded')}**`)], components: [] });
                                        collector.stop("Ended");
                                    }
                                    else if (i.customId == "deactivateButton") {
                                        missileHellstorm = 1;
                                        activateDeactivate = await buttonHandlerOnOff(0);
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                    }
                                    else {
                                        //activateDeactivate = await buttonHandlerOnOff(1);
                                        //await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang , 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        if (isMissile) {
                                            missileHellstorm = 2;
                                            activateDeactivate = await buttonHandlerOnOff(1);
                                            await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                        }
                                        else {
                                            if (huntConfiguration[0].helstorm_missiles_number == 0) {
                                                activateDeactivate = await buttonHandlerOnOff(0);
                                                await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**\n${interaction.client.getWordLanguage(serverSettings.lang, 'user_config_no_hellstorm')}`, message)], components: [row, activateDeactivate] });
                                                missileHellstorm = 1;
                                            }
                                            else {
                                                activateDeactivate = await buttonHandlerOnOff(0);
                                                await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                                missileHellstorm = 6;
                                            }

                                        }
                                    }
                                }

                                else if (mothership > 0) {
                                    if (i.customId == "save2") {
                                        huntConfiguration[0][selectedAmmo] = mothership - 1;
                                        if (mothership == 1) {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${message})\t${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [0, interaction.user.id]);
                                            storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                        }
                                        else {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${message})\t${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [1, interaction.user.id]);
                                            storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                        }
                                    }
                                    else if (i.customId == "discard2") {
                                        discarded = true;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(storedMessage, `**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionEnded')}**`)], components: [] });
                                        collector.stop("Ended");
                                    }
                                    else if (i.customId == "deactivateButton") {
                                        mothership = 1;
                                        activateDeactivate = await buttonHandlerOnOff(0);
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                    }
                                    else {
                                        mothership = 2;
                                        activateDeactivate = await buttonHandlerOnOff(1);
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                    }
                                }

                                else if (pvpEnable > 0) {
                                    if (i.customId == "save2") {
                                        if (pvpEnable == 1) {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${message})\t${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            await interaction.client.databaseEditData("UPDATE users SET pvp_enable = 0 WHERE user_id = ?", [interaction.user.id]);
                                            storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                        }
                                        else {
                                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${message})\t${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [row, activateDeactivate] });
                                            await interaction.client.databaseEditData("UPDATE users SET pvp_enable = 1 WHERE user_id = ?", [interaction.user.id]);
                                            storedMessage = `**(${message})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`;
                                        }
                                    }
                                    else if (i.customId == "discard2") {
                                        discarded = true;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(storedMessage, `**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionEnded')}**`)], components: [] });
                                        collector.stop("Ended");
                                    }
                                    else if (i.customId == "deactivateButton") {
                                        pvpEnable = 1;
                                        activateDeactivate = await buttonHandlerOnOff(0);
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [row, activateDeactivate] });
                                    }
                                    else {
                                        pvpEnable = 2;
                                        activateDeactivate = await buttonHandlerOnOff(1);
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'enabled_u')}**`, message)], components: [row, activateDeactivate] });
                                    }
                                }

                                else if (i.customId == "save") {
                                    await interaction.client.databaseEditData(`UPDATE ${selectedOption} SET ${selectedAmmo} = ? WHERE user_id = ?`, [ammoValue, interaction.user.id]);
                                    huntConfiguration[0][selectedAmmo] = ammoValue;
                                    if (ammoValue < 0) {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\t${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [hp, sh, row, settingRow] });
                                        storedMessage = `**(${selectedAmmo})**` + `\t**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`;
                                    }
                                    else if (ammoValue < 101) {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\tHP: ${ammoValue} || SH: 0**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [hp, sh, row, settingRow] });
                                        storedMessage = `**(${selectedAmmo})**` + `\tHP: ${ammoValue} || SH: 0**`;
                                    }
                                    else {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**(${selectedAmmo})\tHP: 100 || SH: ${ammoValue - 100}**`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'saved_u')}**`)], components: [hp, sh, row, settingRow] });
                                        storedMessage = `**(${selectedAmmo})**` + `\tHP: 100 || SH: ${ammoValue - 100}**`;
                                    }
                                }
                                else if (i.customId == "disable" || index == 9) {
                                    [hp, sh] = await buttonHandler(-1, "DANGER");
                                    await interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'disabled_u')}**`, message)], components: [hp, sh, row, settingRow] });
                                    ammoValue = -3;
                                }
                                else if (i.customId == "empty") {
                                    [hp, sh] = await buttonHandler();
                                    await interaction.editReply({ embeds: [interaction.client.yellowEmbed(`**HP: 0 || SH: 0**`, message)], components: [hp, sh, row, settingRow] });
                                    ammoValue = 0;
                                }
                                else if (index < 5) {
                                    [hp, sh] = await buttonHandler(index);
                                    ammoValue = (index + 1) * 20;
                                    await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**HP: ${ammoValue} || SH: 0**`, message)], components: [hp, sh, row, settingRow] });
                                }
                                else if (index < 9) {
                                    [hp, sh] = await buttonHandler(index);
                                    ammoValue = (index + 1) * 20;
                                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(`**HP: 100 || SH: ${ammoValue - 100}**`, message)], components: [hp, sh, row, settingRow] });
                                }
                                else if (i.customId == "discard") {
                                    discarded = true;
                                    await interaction.editReply({ embeds: [interaction.client.redEmbed(storedMessage, `**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionEnded')}**`)], components: [] });
                                    collector.stop("Ended");
                                }
                            }
                            else if (i.customId == "discard" || i.customId == "discard2") {
                                discarded = true;
                                await interaction.editReply({ embeds: [interaction.client.redEmbed(`\n*${interaction.client.getWordLanguage(serverSettings.lang, 'interactionAbortedUser')}*`, `**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionAborted')}**`)], components: [] });
                                collector.stop("Ended");
                            }
                        }
                        catch (error) { }
                    }
                }
            });
            collector.on('end', collected => {
                if (!discarded)
                    interaction.editReply({ embeds: [interaction.client.redEmbed(`**${interaction.client.getWordLanguage(serverSettings.lang, 'interactionTOut')}**`)], components: [] });
            });
        }
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}


async function buttonHandler(selected_index = -1, button_styile = "SECONDARY") {

    let hp = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("0")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("1")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("2")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("3")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("4")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
        );
    let sh = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("5")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("6")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("7")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("8")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
            new MessageButton()
                .setCustomId("9")
                .setEmoji("902212836770598922")
                .setStyle(button_styile),
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
    return [hp, sh];
}

async function buttonHandlerOnOff(value) {
    let activateDeactivate = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("discard2")
                .setEmoji("🔚")
                .setStyle("DANGER"),
            new MessageButton()
                .setCustomId("deactivateButton")
                .setLabel("DISABLE")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("activateButton")
                .setLabel("ENABLE")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("save2")
                .setEmoji("💾")
                .setStyle("SUCCESS"),
        );
    if (value == 0) {
        activateDeactivate.components[2].setStyle("SECONDARY");
        activateDeactivate.components[1].setStyle("DANGER");
    }
    return activateDeactivate;
}

const settingRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("discard")
            .setEmoji("🔚")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("disable")
            .setEmoji("887979580013563914")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("21")
            .setEmoji("902212836770598922")
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

const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId('select')
            .setPlaceholder('Select ammo to configure')
            .addOptions([
                {
                    label: 'hunt_mothership',
                    description: 'Activate/Deactivate chance to hunt aliens mothership',
                    value: 'mothership',
                },
                {
                    label: 'pvp_togle',
                    description: 'Activate/Deactivate pvp',
                    value: 'pvpEnable',
                },
                {
                    label: 'missile',
                    description: 'Activate/Deactivate missiles',
                    value: 'missile',
                },
                {
                    label: 'hellstorm',
                    description: 'Activate/Deactivate hellstorm',
                    value: 'hellstorm',
                },
                {
                    label: 'x2',
                    description: 'Use laser x2 until... ',
                    value: 'x2',
                },
                {
                    label: 'x3',
                    description: 'Use laser x3 until... ',
                    value: 'x3',
                },
                {
                    label: 'x4',
                    description: 'Use laser x4 until... ',
                    value: 'x4',
                },
                {
                    label: 'xS1',
                    description: 'Use laser xS1 until... ',
                    value: 'xS1',
                },
                {
                    label: 'm2',
                    description: 'Use missile m2 until... ',
                    value: 'm2',
                },
                {
                    label: 'm3',
                    description: 'Use missile m3 until... ',
                    value: 'm3',
                },
                {
                    label: 'm4',
                    description: 'Use missile m4 until... ',
                    value: 'm4',
                },
                {
                    label: 'h2',
                    description: 'Use hellstorm h2 until... ',
                    value: 'h2',
                },
                {
                    label: 'hS1',
                    description: 'Use hellstorm hS1 until... ',
                    value: 'hS1',
                },
                {
                    label: 'hS2',
                    description: 'Use hellstorm hS2 until... ',
                    value: 'hS2',
                },
            ]),
    )

