const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutorial')
        .setDescription('introduces the game commands')
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Select which Tutorial you want to revisit')
                .addChoice('map', 'map')
                .addChoice('hanger', 'hanger')
                .addChoice('hunt configuration', 'hunt configuration')
                .addChoice('shop', 'shop')
                .addChoice('mission', 'mission')
                .addChoice('cargo', 'cargo')
        ),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        try {
            let selectedTutorial = 0;
            let selectedOption = interaction.options.getString('option');
            if (selectedOption != null)
                selectedOption.toLowerCase();
            let tutorialCounter = 0;
            let selectedFirm = "";
            let phaseCounter = 1;
            let laserEquipped = false;
            let boostedFirm = "none";
            let [message, row, hp, sh, index, maxIndex, quantity] = [0, 0, 0, 0, 0, 0, 0];
            let items = [];

            if (userInfo == undefined) {
                let firmCheck = await interaction.client.databaseSelectData("SELECT * FROM firms_list", []);
                if (firmCheck[2].users < firmCheck[1].users || firmCheck[2].users < firmCheck[0].users) {
                    boostedFirm = firmCheck[2].firm;
                }
                else if (firmCheck[1].users <= firmCheck[2].users || firmCheck[1].users < firmCheck[0].users) {
                    boostedFirm = firmCheck[1].firm;
                }
                else {
                    boostedFirm = firmCheck[0].firm;
                }
                await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'selectFirm').format(boostedFirm), interaction.client.getWordLanguage(serverSettings.lang, 'create'))], components: [firm] });
            }
            else {
                tutorialCounter = userInfo.tutorial_counter
                if (selectedOption == 'map')
                    selectedTutorial = 1;
                else if (selectedOption == 'hanger')
                    selectedTutorial = 2;
                else if (selectedOption == 'hunt configuration')
                    selectedTutorial = 3;
                else if (selectedOption == 'shop')
                    selectedTutorial = 4;
                else if (selectedOption == 'mission')
                    selectedTutorial = 5;
                else if (selectedOption == 'cargo')
                    selectedTutorial = 6;
                else if (selectedOption == 'cargo1')
                    selectedTutorial = 7;
                else {
                    selectedTutorial = tutorialCounter;
                    if (tutorialCounter == 8) {
                        await interaction.reply({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialEnd'), "Tutorial Completed!")] });
                        return;
                    }
                }
                phaseCounter = 2;
                if (selectedTutorial > tutorialCounter) {
                    await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialBlocked'), "Error!!")] });
                }
                else if (selectedTutorial == 1) {
                    selectedFirm = userInfo.firm;
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                }
                else if (selectedTutorial == 2) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC2_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('3'))], components: [tutorial] });
                }
                else if (selectedTutorial == 3) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [tutorial] });
                    row = await buttonHandlerOnOff(0);
                }
                else if (selectedTutorial == 4) {
                    let ammunitionList = await interaction.client.databaseSelectData(`SELECT * FROM ammunition_info WHERE available = 1`);
                    await ammunitionList.forEach((ammunition) => {
                        message = interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Currency').format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['units'], userInfo.units);

                        message += interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Ammo').format(ammunition.ammo_id);

                        if (ammunition.credit == 0) {
                            message += `${interaction.client.defaultEmojis['units']} __**${ammunition.units}**__ \n`;
                        } else {
                            message += `${interaction.client.defaultEmojis['credit']} __**${ammunition.credit}**__ \n`;
                        }

                        message += interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Description').format(ammunition.description);

                        items.push([message, ammunition.order_ammo, ammunition.credit, ammunition.units]);
                    });
                    await interaction.reply({ content: " ", embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [tutorial] });
                }
                else if (selectedTutorial == 5) {
                    if (tutorialCounter == selectedTutorial) {
                        let mission = await interaction.client.databaseSelectData("SELECT * FROM user_missions WHERE user_missions.user_id = ?", [interaction.user.id]);
                        if (typeof mission == 'undefined' || mission.length == 0) {
                            await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [tutorial] });
                        }
                        else if (mission[0].mission_status == 'active') {
                            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_4'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))] })
                            return;
                        }
                        else {
                            selectedTutorial++;
                            tutorialCounter++;
                            await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_4_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [tutorial] });
                            await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L4"]);
                            await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                            phaseCounter = 1;
                        }
                    }
                    else {
                        await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [tutorial] });
                    }
                }
                else if (selectedTutorial == 6) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC6_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('7'))], components: [tutorial] });
                }
                else if (selectedTutorial == 7) {
                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC7_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('8'))], components: [tutorial] });
                }
            }

            let ended = false;

            const filter = i => i.user.id == interaction.user.id && i.message.interaction.id == interaction.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async i => {
                collector.resetTimer({ time: 120000 });
                if (!i.replied) {
                    try {
                        if (i.customId == "End") {
                            await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialStop'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialStopTittle'))], components: [] });
                            ended = true;
                            collector.stop("Ended by user");
                            return;
                        }
                        if (selectedTutorial == 0) {
                            tutorialCounter++;
                            selectedTutorial++;
                            selectedFirm = i.customId;
                            if (selectedFirm == "Terra") {
                                await interaction.client.databaseEditData(`INSERT INTO users (username, user_id, firm, race) VALUES (?, ?, ?, ?)`, [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), interaction.user.id, i.customId, "Terrestrian"]);
                            }
                            else if (selectedFirm == "Luna") {
                                await interaction.client.databaseEditData(`INSERT INTO users (username, user_id, firm, race) VALUES (?, ?, ?, ?)`, [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), interaction.user.id, i.customId, "Lunian"]);
                            }
                            else {
                                await interaction.client.databaseEditData(`INSERT INTO users (username, user_id, firm, race) VALUES (?, ?, ?, ?)`, [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), interaction.user.id, i.customId, "Martian"]);
                            }
                            await interaction.client.databaseEditData(`INSERT INTO user_cd (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO ammunition (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO hunt_configuration (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO pvp_configuration (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO user_ships (user_id, equipped) VALUES (?, 1)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO boost (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`INSERT INTO user_log (user_id) VALUES (?)`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`UPDATE firms_list SET users = users + 1 where firm = ?`, [i.customId]);
                            userInfo = {
                                credit: 10000,
                                resources: "0; 0; 0; 0; 0; 0; 0; 0; 0",
                                cargo: 0
                            }
                            if (i.customId == boostedFirm) {
                                let dateToBoostTill = new Date();
                                dateToBoostTill.setDate(dateToBoostTill.getDate() + 7);
                                dateToBoostTill = dateToBoostTill.toJSON().split(".");
                                dateToBoostTill = dateToBoostTill[0];
                                await interaction.client.databaseEditData(`UPDATE boost SET exp_boost = ?, damage_boost = ? WHERE user_id = ?`, [dateToBoostTill, dateToBoostTill, interaction.user.id]);
                            }
                            await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC0').format(i.customId), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('1'))], components: [tutorial] });
                        }
                        else if (selectedTutorial == 1) {
                            if (phaseCounter == 1) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                if (tutorialCounter == selectedTutorial) {
                                    selectedTutorial++;
                                    tutorialCounter++;
                                    if (selectedFirm == "Terra") {
                                        await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2').format('1-1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [] });
                                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [11, tutorialCounter, interaction.user.id]);
                                        await interaction.client.wait(1000);
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2_1').format("Terra"), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                                    }
                                    else if (selectedFirm == "Luna") {
                                        await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2').format('2-1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [] });
                                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [21, tutorialCounter, interaction.user.id]);
                                        await interaction.client.wait(1000);
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2_1').format("Luna"), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2').format('3-1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [] });
                                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [31, tutorialCounter, interaction.user.id]);
                                        await interaction.client.wait(1000);
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2_1').format("Marte"), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                                    }
                                }
                                else {
                                    selectedTutorial++;
                                    await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2').format('X-1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [] });
                                    await interaction.client.wait(1000);
                                    await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC1_2_1').format(userInfo.firm), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('2'))], components: [tutorial] });
                                }
                                phaseCounter = 1;
                            }
                        }
                        else if (selectedTutorial == 2) {
                            if (phaseCounter == 1) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC2_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('3'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                if (laserEquipped) {
                                    if (i.customId == "0") {
                                        laserEquipped = !laserEquipped;
                                        [message, row] = await hangerHandler(laserEquipped);
                                        await i.update({ content: message, components: [row] })
                                    }
                                    else if (i.customId == "Continue") {
                                        phaseCounter = 1;
                                        if (tutorialCounter == selectedTutorial) {
                                            tutorialCounter++;
                                            selectedTutorial++;
                                            await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC2_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('3'))], components: [tutorial] });
                                            await interaction.client.databaseEditData(`INSERT INTO user_shields (user_id, shield_model) VALUES (?, ?)`, [interaction.user.id, "S4"]);
                                            await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 1 WHERE user_id = ?`, [interaction.user.id]);
                                            await interaction.client.databaseEditData(`UPDATE user_ships SET ship_damage = ? WHERE user_id = ?`, [140, interaction.user.id]);
                                            await interaction.client.databaseEditData(`UPDATE users SET user_damage = ?, laser_quantity = ?, tutorial_counter = ? WHERE user_id = ?`, [140, 1, tutorialCounter, interaction.user.id]);
                                        }
                                        else {
                                            selectedTutorial++;
                                            await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC2_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('3'))], components: [tutorial] });
                                        }
                                    }
                                    else {
                                        [message, row] = await hangerHandler(laserEquipped);
                                        await i.update({ content: message, components: [row, tutorial] })
                                    }
                                }
                                else {
                                    if (i.customId == "0") {
                                        laserEquipped = !laserEquipped;
                                        [message, row] = await hangerHandler(laserEquipped);
                                        await i.update({ content: message, components: [row, tutorial] })
                                    }
                                    else {
                                        [message, row] = await hangerHandler(laserEquipped);
                                        await i.update({ content: message, embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC2_2_2'))], components: [row] })
                                    }
                                }
                            }
                        }
                        else if (selectedTutorial == 3) {
                            if (phaseCounter == 1) {
                                await i.update({ content: " ", embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [tutorial] });
                                phaseCounter++;
                                row = await buttonHandlerOnOff(0);
                            }
                            else if (phaseCounter == 2) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_1_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 3) {
                                await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [row] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 4) {
                                if (i.customId == "activateButton") {
                                    row = await buttonHandlerOnOff(1);
                                    await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_3'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [row] });
                                    phaseCounter++;
                                }
                                else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_3_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [row] });
                                }
                            }
                            else if (phaseCounter == 5) {
                                if (i.customId == "save2") {
                                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_4'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [tutorial] });
                                    phaseCounter++;
                                }
                                else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_4_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [row] });
                                }
                            }
                            else if (phaseCounter == 6) {
                                [hp, sh] = await configurationHandler(-1, "DANGER");
                                await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_5'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 7) {
                                if (i.customId == "empty") {
                                    [hp, sh] = await configurationHandler();
                                    await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_6'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                    phaseCounter++;
                                }
                                else {
                                    index = parseInt(i.customId);
                                    if (i.customId == "disable" || index == 9) {
                                        [hp, sh] = await configurationHandler(-1, "DANGER");
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_6_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                    }
                                    else if (index < 5) {
                                        [hp, sh] = await configurationHandler(index);
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_6_3').format((index + 1) * 20), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                    }
                                    else if (index < 9) {
                                        [hp, sh] = await configurationHandler(index);
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_6_4').format((index + 1) * 20 - 100), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                    }
                                }
                            }
                            else if (phaseCounter == 8) {
                                if (i.customId == "save") {
                                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_7'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [tutorial] });
                                    phaseCounter = 1;
                                    if (tutorialCounter == selectedTutorial) {
                                        tutorialCounter++;
                                        await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                                        await interaction.client.databaseEditData(`UPDATE ammunition SET m1_magazine = m1_magazine + ? WHERE user_id = ?`, [1000, interaction.user.id]);
                                    }
                                    selectedTutorial++;
                                } else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC3_7_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('4'))], components: [hp, sh, settingRow] });
                                }
                            }
                        }
                        else if (selectedTutorial == 4) {
                            if (phaseCounter == 1) {
                                let ammunitionList = await interaction.client.databaseSelectData(`SELECT * FROM ammunition_info WHERE available = 1`);
                                await ammunitionList.forEach((ammunition) => {

                                    message = interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Currency').format(interaction.client.defaultEmojis['credit'], 10000, interaction.client.defaultEmojis['units'], 0);

                                    message += interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Ammo').format(ammunition.ammo_id);

                                    if (ammunition.credit == 0) {
                                        message += `${interaction.client.defaultEmojis['units']} __**${ammunition.units}**__ \n`;
                                    } else {
                                        message += `${interaction.client.defaultEmojis['credit']} __**${ammunition.credit}**__ \n`;
                                    }

                                    message += interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1Description').format(ammunition.description);

                                    items.push([message, ammunition.order_ammo, ammunition.credit, ammunition.units]);
                                });
                                await i.update({ content: " ", embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                await i.update({ embeds: [interaction.client.blueEmbed(items[0][0], interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [shopRow] });
                                phaseCounter++;
                                index = 0;
                                maxIndex = items.length - 1;
                            }
                            else if (phaseCounter == 3) {
                                if (i.customId == "right") {
                                    index++;
                                    if (index > maxIndex)
                                        index = 0;
                                    await i.update({ embeds: [interaction.client.blueEmbed(items[index][0], interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))] });
                                }
                                else if (i.customId == "left") {
                                    index--;
                                    if (index < 0)
                                        index = maxIndex;
                                    await i.update({ embeds: [interaction.client.blueEmbed(items[index][0], interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))] });
                                }
                                else {
                                    if (items[index][1] == 2) {
                                        quantity = 1;
                                        await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_3').format(interaction.client.defaultEmojis['credit'], userInfo.credit, interaction.client.defaultEmojis['credit'], items[index][2]), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                                        phaseCounter++;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_3_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))] });
                                    }
                                }
                            }
                            else if (phaseCounter == 4) {
                                if (i.customId == "buyItem") {
                                    if (quantity == 100) {
                                        await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_4'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [tutorial] });
                                        if (tutorialCounter == selectedTutorial) {
                                            tutorialCounter++;
                                            await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ?, credit = credit - ? WHERE user_id = ?`, [tutorialCounter, items[index][2] * 100, interaction.user.id]);
                                            await interaction.client.databaseEditData(`UPDATE ammunition SET x2_magazine = x2_magazine + ? WHERE user_id = ?`, [100, interaction.user.id]);
                                        }
                                        phaseCounter = 1;
                                        selectedTutorial++;
                                    }
                                    else {
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_4_2').format(quantity), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [quantityButtonUp, quantityButtonDown] });
                                    }
                                }
                                else {
                                    let add = parseInt(i.customId);
                                    if (Number.isInteger(add))
                                        quantity += add
                                    if (quantity < 1) {
                                        quantity -= add;
                                        await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_4_3').format(quantity), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [quantityButtonUp, quantityButtonDown] });
                                    }
                                    else
                                        await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC4_4_4').format(interaction.client.defaultEmojis['credit'], 10000, interaction.client.defaultEmojis['units'], 0, quantity, interaction.client.defaultEmojis['credit'], items[index][2] * quantity), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('5'))], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                                }
                            }
                        }
                        else if (selectedTutorial == 5) {
                            if (phaseCounter == 1) {
                                await i.update({ content: " ", embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                message = interaction.client.getWordLanguage(serverSettings.lang, 'TC5_2');
                                if (i.customId == "get") {
                                    await i.update({ embeds: [interaction.client.blueEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_2_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [rowYesNo] });
                                    phaseCounter++;
                                }
                                else
                                    await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(message, "MISSION BOARD", interaction.user, `Page 1 of 1`, "https://obelisk.club/npc/missions.png")], components: [missionRow] });
                            }
                            else if (phaseCounter == 3) {
                                if (i.customId == "yes") {
                                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_3'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [] })
                                    var query = `INSERT INTO user_missions (mission_id, mission_task_left, user_id) VALUES (?, ?, ?)`;
                                    var missionId = await interaction.client.databaseEditDataReturnID(query, [0, 1, interaction.user.id]);
                                    if (tutorialCounter == selectedTutorial)
                                        await interaction.client.databaseEditData(`update users set missions_id = ? where user_id = ?`, [missionId, interaction.user.id]);
                                    ended = true;
                                    collector.stop("Ended by user");
                                }
                                else {
                                    await i.update({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC5_3_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('6'))], components: [rowYesNo] });
                                }
                            }
                        }
                        else if (selectedTutorial == 6) {
                            if (phaseCounter == 1) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC6_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('7'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                let resources = userInfo.resources.split("; ").map(Number);
                                let cargo = userInfo.cargo;
                                message = interaction.client.getWordLanguage(serverSettings.lang, 'TC6_2') + "\`\`\`yaml\n";
                                let resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Palladium     "]
                                let refined = false;
                                [resources, message, refined] = await materialToRefine(resources, 0, 1, 3, message, refined, resourcesName);
                                [resources, message, refined] = await materialToRefine(resources, 1, 2, 4, message, refined, resourcesName);
                                [resources, message, refined] = await materialToRefine(resources, 3, 4, 5, message, refined, resourcesName);
                                [resources, message, refined] = await materialToRefine(resources, 5, 6, 7, message, refined, resourcesName);

                                message += " \`\`\`" + "\`\`\`yaml\n" + `Cargo ${cargo} => `;
                                cargo = resources.reduce((a, b) => a + b);
                                message += `${cargo}` + " \`\`\`";
                                await i.update({ embeds: [interaction.client.greenEmbed(message, interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('7'))] });
                                resources = resources.join("; ");
                                if (tutorialCounter == selectedTutorial)
                                    await interaction.client.databaseEditData("UPDATE users SET resources = ?, cargo = ? WHERE user_id = ?", [resources, cargo, interaction.user.id]);
                                phaseCounter++;
                            }
                            else if (phaseCounter == 3) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC6_3'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('7'))] });
                                if (tutorialCounter == selectedTutorial) {
                                    tutorialCounter++;
                                    await interaction.client.databaseEditData(`INSERT INTO user_engines (user_id, engine_model) VALUES (?, ?)`, [interaction.user.id, "E4"]);
                                    await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                                }
                                phaseCounter = 1;
                                selectedTutorial++;
                            }
                        }
                        else if (selectedTutorial == 7) {
                            if (phaseCounter == 1) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC7_1'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('8'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 2) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC7_2'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('8'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 3) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC7_3'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('8'))], components: [tutorial] });
                                phaseCounter++;
                            }
                            else if (phaseCounter == 4) {
                                await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TC7_4'), interaction.client.getWordLanguage(serverSettings.lang, 'tutorialPhase').format('8'))], components: [tutorial] });
                                tutorialCounter++;
                                await interaction.client.databaseEditData(`UPDATE users SET units = units + 5000, tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                                collector.stop("Tutorial Ended");
                            }
                        }
                    }
                    catch (error) { }
                }
                //}               

                //collector.stop("Selected Firm");
            });

            collector.on('end', collected => {
                if (!ended)
                    interaction.editReply({ components: [] });
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

async function hangerHandler(laserEquipped) {
    let message = "";
    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("0")
                .setLabel("L3E-")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("1")
                .setLabel("           ")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("2")
                .setLabel("           ")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("3")
                .setLabel("           ")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("4")
                .setLabel("           ")
                .setStyle("PRIMARY"),
        );
    if (laserEquipped) {
        row.components[0].setStyle('SUCCESS');
        row.components[1].setStyle('DANGER');
        row.components[2].setStyle('DANGER');
        row.components[3].setStyle('DANGER');
        row.components[4].setStyle('DANGER');
        message = `<:L3_equipped:895398008261320705><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>`

    }
    else {
        message = `<:Slot:895013272082853951><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>`
    }
    return [message, row];
}

async function configurationHandler(selected_index = -1, button_styile = "SECONDARY") {

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
                .setCustomId("End")
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
            .setCustomId("End")
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

const firm = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('Terra')
            //.setLabel('Beginning')
            .setEmoji("🌏")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Luna')
            //.setLabel('Ending')
            .setEmoji("🌑")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Marte')
            //.setLabel('Ending')
            .setEmoji("949404774657327134")
            .setStyle('SUCCESS'),

    );

const tutorial = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('End')
            .setLabel('END')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('Continue')
            .setLabel('CONTINUE')
            .setStyle('SUCCESS'),
    );

const shopRow = new MessageActionRow()
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
        new MessageButton()
            .setCustomId('buy')
            .setLabel('BUY')
            .setStyle('SUCCESS'),
    );
const quantityButtonUp = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('1')
            .setLabel('+1     ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10')
            .setLabel('+10  ')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('100')
            .setLabel('+100')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('1000')
            .setLabel('+1K   ')
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
            .setLabel('-1      ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10')
            .setLabel('-10   ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-100')
            .setLabel('-100 ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-1000')
            .setLabel('-1K    ')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10000')
            .setLabel('-10K ')
            .setStyle('DANGER'),
    );
const buySetting = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('End')
            .setLabel('CANCELL')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('buyItem')
            .setLabel('CONFIRM')
            .setStyle('SUCCESS'),
    );

const missionRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('left')
            .setEmoji('887811358509379594')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('right')
            .setEmoji('887811358438064158')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('get')
            .setLabel('GET')
            .setStyle('SUCCESS'),
    );
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
async function materialToRefine(resources, mat1, mat2, result, message, refined, resourcesName) {
    let numberOfMaetrialToConvert = 0;
    if (resources[mat1] >= 10 && resources[mat2] >= 10) {
        if (resources[mat1] < resources[mat2])
            numberOfMaetrialToConvert = Math.floor(resources[mat1] / 10);
        else
            numberOfMaetrialToConvert = Math.floor(resources[mat2] / 10);
        resources[mat1] -= 10 * numberOfMaetrialToConvert;
        resources[mat2] -= 10 * numberOfMaetrialToConvert;
        resources[result] += numberOfMaetrialToConvert;
        message += `${resourcesName[result]}:  ${resources[3]}\n`;
        refined = true;
    }
    return [resources, message, refined]
}