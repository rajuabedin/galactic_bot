const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutorial')
        .setDescription('introduces the game commands'),

    async execute(interaction, userInfo) {
        //try {
        let tutorialCounter = 0;
        let selectedFirm = "";
        let phaseCounter = 1;
        let laserEquipped = false;
        let boostedFirm = "Earth";
        let firmCheck = await interaction.client.databaseSelcetData("SELECT * FROM firms_list", []);
        let [message, row, hp, sh, index, maxIndex, quantity] = [0, 0, 0, 0, 0, 0, 0];
        let items = [];
        if (firmCheck[2].users < firmCheck[1].users || firmCheck[2].users < firmCheck[0].users)
            boostedFirm = firmCheck[2].firm;
        else if (firmCheck[1].users <= firmCheck[2].users || firmCheck[1].users < firmCheck[0].users)
            boostedFirm = firmCheck[1].firm;
        else
            boostedFirm = firmCheck[0].firm;
        if (typeof userInfo === 'undefined') {
            interaction.reply({ embeds: [interaction.client.greenEmbed(`Which firm would you like to create an account on?\n***${boostedFirm}*** *has* ***10% EXP*** *and* ***Damage*** *boost for a* ***week***`, "Create Account")], components: [firm] });
        }
        else if (userInfo.tutorial_counter >= 8) {
            interaction.reply({ embeds: [interaction.client.redEmbed("You already finished the tutorial, please come back when new content is added")] });
            return
        }
        else {
            tutorialCounter = userInfo.tutorial_counter;
            phaseCounter = 2;
            if (tutorialCounter == 1) {
                selectedFirm = userInfo.firm;
                await interaction.reply({ embeds: [interaction.client.greenEmbed(`To move in the company base do **/map** then select the **map** that you wish to navigate to`, "TUTORIAL phase 2")], components: [tutorial] });
            }
            else if (tutorialCounter == 2) {
                await interaction.reply({ embeds: [interaction.client.greenEmbed(`To equip the laser cannon do **/hanger** and select the **option: laser**`, "TUTORIAL phase 3")], components: [tutorial] });
            }
            else if (tutorialCounter == 3) {
                await interaction.reply({ embeds: [interaction.client.greenEmbed(`To edit the hunt configuration, do **/hunt_configuration** and select the **ammo to configure**`, "TUTORIAL phase 4")], components: [tutorial] });
                row = await buttonHandlerOnOff(0);
            }
            else if (tutorialCounter == 4) {
                let ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1`);
                await ammunitionList.forEach((ammunition) => {
                    message = `**⦿ You currently have ${interaction.client.defaultEmojis['credit']}${userInfo.credit} | ${interaction.client.defaultEmojis['units']}${userInfo.units}**\n`;

                    message += `**⦿ Ammunition ID:** **[${ammunition.ammo_id}](https://obelisk.club/)** `;

                    if (ammunition.credit === 0) {
                        message += `${interaction.client.defaultEmojis['units']} __**${ammunition.units}**__ \n`;
                    } else {
                        message += `${interaction.client.defaultEmojis['credit']} __**${ammunition.credit}**__ \n`;
                    }

                    message += `**Description**\n${ammunition.description}\n`

                    items.push([message, ammunition.order_ammo, ammunition.credit, ammunition.units]);
                });
                await interaction.reply({ content: " ", embeds: [interaction.client.greenEmbed(`To access **shop** do **/shop** and select the desired **subcategory**\nTo complete this section of the tutorial, you are required to purchase **laser ammunition (x2) x100** under **/shop category:ammunition** `, "TUTORIAL phase 5")], components: [tutorial] });
            }
            else if (tutorialCounter == 5) {
                let mission = await interaction.client.databaseSelcetData("SELECT * FROM user_missions WHERE user_missions.user_id = ?", [interaction.user.id]);
                if (typeof mission == 'undefined' || mission.length == 0) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(`You can accept mission from **/mission_board**\nTo complete this tutorial, you are required to finish the mission`, "TUTORIAL phase 6")], components: [tutorial] });
                }
                else if (mission[0].mission_status === 'active'){
                    await interaction.reply({ embeds: [interaction.client.redEmbed("To continue, you need to complete the mission\nTo complete the mission do **/hunt**\nYou can check the status of the mission by doing **/mission**", "TUTORIAL phase 6")]})
                    return;
                }
                else{
                    tutorialCounter++;
                    phaseCounter = 1;
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(`Congratulations on finishing your first mission!\nYou are rewarded with one **L4E- laser cannon**`, "TUTORIAL phase 6")], components: [tutorial] });
                    await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L4"]);
                    await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                }
            }
        }

        let ended = false;

        const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            collector.resetTimer({ time: 60000 });
            if (i.customId === "End"/* || i.customId === "discard" || i.customId === "discard2"*/) {
                //tutorialCounter--;
                await i.update({ embeds: [interaction.client.redEmbed(`Tutorial ended by user`, "TUTORIAL ENDED")], components: [] });
                //await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                ended = true;
                collector.stop("Ended by user");
                return;
            }
            //if (i.customId === "Continue" || tutorialCounter === 0) {
            if (tutorialCounter == 0) {
                tutorialCounter++;
                await interaction.client.databaseEditData(`INSERT INTO users (user_id, firm) VALUES (?, ?)`, [interaction.user.id, i.customId]);
                await interaction.client.databaseEditData(`INSERT INTO user_cd (user_id) VALUES (?)`, [interaction.user.id]);
                await interaction.client.databaseEditData(`INSERT INTO ammunition (user_id) VALUES (?)`, [interaction.user.id]);
                await interaction.client.databaseEditData(`INSERT INTO hunt_configuration (user_id) VALUES (?)`, [interaction.user.id]);
                await interaction.client.databaseEditData(`INSERT INTO user_ships (user_id, equipped) VALUES (?, 1)`, [interaction.user.id]);
                await interaction.client.databaseEditData(`INSERT INTO boost (user_id) VALUES (?)`, [interaction.user.id]);
                await i.update({ embeds: [interaction.client.greenEmbed(`You have selected **${i.customId}**\n*You are rewarded with **1000 (x1) laser ammunition** and **10000 crediits***`, "TUTORIAL phase 1")], components: [tutorial] });
                await interaction.client.databaseEditData(`UPDATE firms_list SET users = users + 1 where firm = ?`, [i.customId]);
                if (i.customId === boostedFirm) {
                    let dateToBoostTill = new Date();
                    dateToBoostTill.setDate(dateToBoostTill.getDate() + 7);
                    dateToBoostTill = dateToBoostTill.toJSON().split(".");
                    dateToBoostTill = dateToBoostTill[0];
                    await interaction.client.databaseEditData(`UPDATE boost SET exp_boost = ?, damage_boost = ? WHERE user_id = ?`, [dateToBoostTill, dateToBoostTill, interaction.user.id]);
                }
                selectedFirm = i.customId;
            }
            else if (tutorialCounter == 1) {
                if (phaseCounter == 1) {
                    await i.update({ embeds: [interaction.client.greenEmbed(`To move in the company base, do **/map** then select the **map** that you wish to navigate to`, "TUTORIAL phase 2")], components: [tutorial] });
                    phaseCounter++;
                }
                if (phaseCounter == 2) {
                    tutorialCounter++;
                    if (selectedFirm === "Earth") {
                        await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 1-1**`, "TUTORIAL phase 2")], components: [] });
                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [11, tutorialCounter, interaction.user.id]);
                        await interaction.client.wait(1000);
                        await i.update({ embeds: [interaction.client.greenEmbed(`**Welcome to Earth's base!**\n*You are rewarded with one **L3E- laser cannon**\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                    }
                    else if (selectedFirm === "Moon") {
                        await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 2-1**`, "TUTORIAL phase 2")], components: [] });
                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [21, tutorialCounter, interaction.user.id]);
                        await interaction.client.wait(1000);
                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**Welcome to Moon's base!**\n*You are rewarded with one **L3E- laser cannon**\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                    }
                    else {
                        await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 3-1**`, "TUTORIAL phase 2")], components: [] });
                        await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [31, tutorialCounter, interaction.user.id]);
                        await interaction.client.wait(1000);
                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**Welcome to Moon's base!**\n*You are rewarded with one **L3E- laser cannon**\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                        await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                    }
                    phaseCounter = 1;
                }
            }
            else if (tutorialCounter == 2) {
                if (phaseCounter == 1) {
                    await i.update({ embeds: [interaction.client.greenEmbed(`To equip the laser cannon, do **/hanger** and select the **option: laser**`, "TUTORIAL phase 3")], components: [tutorial] });
                    phaseCounter++;
                }
                else if (phaseCounter == 2) {
                    if (laserEquipped) {
                        if (i.customId === "0") {
                            laserEquipped = !laserEquipped;
                            [message, row] = await hangerHandler(laserEquipped);
                            await i.update({ content: message, components: [row] })
                        }
                        else if (i.customId === "Continue") {
                            tutorialCounter++;
                            phaseCounter = 1;
                            await i.update({ embeds: [interaction.client.greenEmbed(`You can equip other items too by using the **/hanger** command\n*You are rewarded with one **S4E- shield module**`, "TUTORIAL phase 3")], components: [tutorial] });
                            await interaction.client.databaseEditData(`INSERT INTO user_shields (user_id, shield_model) VALUES (?, ?)`, [interaction.user.id, "S4"]);
                            await interaction.client.databaseEditData(`UPDATE user_lasers SET equipped = 1 WHERE user_id = ?`, [interaction.user.id]);
                            await interaction.client.databaseEditData(`UPDATE user_ships SET ship_damage = ? WHERE user_id = ?`, [140, interaction.user.id]);
                            await interaction.client.databaseEditData(`UPDATE users SET user_damage = ?, laser_quantity = ?, tutorial_counter = ? WHERE user_id = ?`, [140, 1, tutorialCounter, interaction.user.id]);
                        }
                        else {
                            [message, row] = await hangerHandler(laserEquipped);
                            await i.update({ content: message, components: [row, tutorial] })
                        }
                    }
                    else {
                        if (i.customId === "0") {
                            laserEquipped = !laserEquipped;
                            [message, row] = await hangerHandler(laserEquipped);
                            await i.update({ content: message, components: [row, tutorial] })
                        }
                        else {
                            [message, row] = await hangerHandler(laserEquipped);
                            await i.update({ content: message, embeds: [interaction.client.blueEmbed(`\n***Green button:** equipped item\n**Blue button:** equippable item\n**Red button:** unequippable item due **max capacity***`)], components: [row] })
                        }
                    }
                }
            }
            else if (tutorialCounter == 3) {
                if (phaseCounter == 1) {
                    await i.update({ content: " ", embeds: [interaction.client.greenEmbed(`To edit the hunt configuration, do **/hunt_configuration** and select the **ammo to configure**`, "TUTORIAL phase 4")], components: [tutorial] });
                    phaseCounter++;
                    row = await buttonHandlerOnOff(0);
                }
                else if (phaseCounter == 2) {
                    await i.update({ embeds: [interaction.client.blueEmbed(`**missile:\nDISABLED**\n\n*You can activate/deactivate missiles and hellstorm from **option 1 and 2**\n**ENABLE missiles to continue***`, "TUTORIAL phase 4")], components: [row] });
                    phaseCounter++;
                }
                else if (phaseCounter == 3) {
                    if (i.customId === "activateButton") {
                        row = await buttonHandlerOnOff(1);
                        await i.update({ embeds: [interaction.client.blueEmbed(`**missile:\nENABLED**\n\n*You need to press 💾 to save your configuration or it will get lost\n**Press 💾 to continue***`, "TUTORIAL phase 4")], components: [row] });
                        phaseCounter++;
                    }
                    else {
                        await i.update({ embeds: [interaction.client.redEmbed(`**missile:\nDISABLED**\n\n**__ENABLE__ missiles to continue**`, "TUTORIAL phase 4")], components: [row] });
                    }
                }
                else if (phaseCounter == 4) {
                    if (i.customId === "save2") {
                        await i.update({ embeds: [interaction.client.greenEmbed(`Always remember to save your configuration\n*By selecting **option 3 and following**, you can set when to use the selected ammo*\nNow set missiles (m1) to be launched till enemies HP reach zero`, "TUTORIAL phase 4")], components: [tutorial] });
                        phaseCounter++;
                    }
                    else {
                        await i.update({ embeds: [interaction.client.redEmbed(`**missile:\nENABLED**\n\n**__Save__ configuration by pressing 💾 to continue**`, "TUTORIAL phase 4")], components: [row] });
                    }
                }
                else if (phaseCounter == 5) {
                    [hp, sh] = await configurationHandler(-1, "DANGER");
                    await i.update({ embeds: [interaction.client.blueEmbed(`**m1:\nDISABLED**\n\n*You can set **till** when to use the selected ammo by pressing the first 2 row of buttons\nFirst row represent **hp** and it will become green when pressed\nSecond row represent **shield** and it will become blue when pressed\nPress <:close:887979580013563914> to **DISABLE** selected ammo\nPress <:clear:887979579854168075> to clear out the first two rows and **always use** selected ammo\n**To continue, make (m1) missile always active***`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                    phaseCounter++;
                }
                else if (phaseCounter == 6) {
                    if (i.customId === "empty") {
                        [hp, sh] = await configurationHandler();
                        await i.update({ embeds: [interaction.client.blueEmbed(`**m1:\nHP: 0 || SH: 0**\n\n*M1 missilie will be launched **till** enemy **hp** reach **zero**\n*You need to press 💾 to save your configuration or it will get lost\n**Press 💾 to continue****`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                        phaseCounter++;
                    }
                    else {
                        index = parseInt(i.customId);
                        if (i.customId === "disable" || index == 9) {
                            [hp, sh] = await configurationHandler(-1, "DANGER");
                            await i.update({ embeds: [interaction.client.redEmbed(`**m1:\nDISABLED**\n\n*Press <:clear:887979579854168075> to clear out the first two rows and **always use** selected ammo\n**To continue, make (m1) missile always active***`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                        }
                        else if (index < 5) {
                            [hp, sh] = await configurationHandler(index);
                            await i.update({ embeds: [interaction.client.redEmbed(`**m1:\nHP: ${(index + 1) * 20} || SH: 0**\n\n*Press <:clear:887979579854168075> to clear out the first two rows and **always use** selected ammo\n**To continue, make (m1) missile always active***`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                        }
                        else if (index < 9) {
                            [hp, sh] = await configurationHandler(index);
                            await i.update({ embeds: [interaction.client.redEmbed(`**m1:\nHP: 100 || SH: ${(index + 1) * 20 - 100}**\n\n*Press <:clear:887979579854168075> to clear out the first two rows and **always use** selected ammo\n**To continue, make (m1) missile always active***`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                        }
                    }
                }
                else if (phaseCounter == 7) {
                    if (i.customId === "save") {
                        await i.update({ embeds: [interaction.client.greenEmbed(`Always remember to save your configuration\n*You are rewarded with **1000 (m1) missile ammunition***`, "TUTORIAL phase 4")], components: [tutorial] });
                        phaseCounter = 1;
                        tutorialCounter++;
                        await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                        await interaction.client.databaseEditData(`UPDATE ammunition SET m1_magazine = m1_magazine + ? WHERE user_id = ?`, [1000, interaction.user.id]);
                    }
                    else {
                        await i.update({ embeds: [interaction.client.redEmbed(`**m1:\nHP: 0 || SH: 0**\n\n**__Save__ configuration by pressing 💾 to continue**`, "TUTORIAL phase 4")], components: [hp, sh, settingRow] });
                    }
                }
            }
            else if (tutorialCounter == 4) {
                if (phaseCounter == 1) {
                    let ammunitionList = await interaction.client.databaseSelcetData(`SELECT * FROM ammunition_info WHERE available = 1`);
                    await ammunitionList.forEach((ammunition, index) => {
                        message = `**⦿ You currently have ${interaction.client.defaultEmojis['credit']}${userInfo.credit} | ${interaction.client.defaultEmojis['units']}${userInfo.units}**\n`;

                        message += `**⦿ Ammunition ID:** **[${ammunition.ammo_id}](https://obelisk.club/)** `;

                        if (ammunition.credit === 0) {
                            message += `${interaction.client.defaultEmojis['units']} __**${ammunition.units}**__ \n`;
                        } else {
                            message += `${interaction.client.defaultEmojis['credit']} __**${ammunition.credit}**__ \n`;
                        }

                        message += `**Description**\n${ammunition.description}\n`

                        items.push([message, ammunition.order_ammo, ammunition.credit, ammunition.units]);
                    });
                    await i.update({ content: " ", embeds: [interaction.client.greenEmbed(`To access **shop** do **/shop** and select the desired **subcategory**\nTo complete this section of the tutorial, you are required to purchase **laser ammunition (x2) x100** under **/shop category:ammunition** `, "TUTORIAL phase 5")], components: [tutorial] });
                    phaseCounter++;
                }
                else if (phaseCounter == 2) {
                    await i.update({ embeds: [interaction.client.blueEmbed(items[0][0], "TUTORIAL phase 5")], components: [shopRow] });
                    phaseCounter++;
                    index = 0;
                    maxIndex = items.length - 1;
                }
                else if (phaseCounter == 3) {
                    if (i.customId == "right") {
                        index++;
                        if (index > maxIndex)
                            index = 0;
                        await i.update({ embeds: [interaction.client.blueEmbed(items[index][0], "TUTORIAL phase 5")] });
                    }
                    else if (i.customId == "left") {
                        index--;
                        if (index < 0)
                            index = maxIndex;
                        await i.update({ embeds: [interaction.client.blueEmbed(items[index][0], "TUTORIAL phase 5")] });
                    }
                    else {
                        if (items[index][1] === 2) {
                            quantity = 1;
                            await i.update({ embeds: [interaction.client.blueEmbed(`**⦿ You currently have ${interaction.client.defaultEmojis['credit']}${userInfo.credit} | ${interaction.client.defaultEmojis['units']}${userInfo.units}**\n**Quantity Buying:** 1\n**Total Price:** ${interaction.client.defaultEmojis['credit']}${items[index][2]}\n**To continue, set quantity to __100__**`, `TUTORIAL phase 5`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                            phaseCounter++;
                        }
                        else {
                            await i.update({ embeds: [interaction.client.redEmbed("To continue you are required to select **laser ammunition (x2)**", "TUTORIAL phase 5")] });
                        }
                    }
                }
                else if (phaseCounter == 4) {
                    if (i.customId === "buyItem") {
                        if (quantity == 100) {
                            tutorialCounter++;
                            await i.update({ embeds: [interaction.client.greenEmbed(`Item bought\n*You are rewarded with **repair bot (r1)** and equipped to your ship*`, "TUTORIAL phase 5")], components: [tutorial] });
                            await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ?, credit = credit - ? WHERE user_id = ?`, [tutorialCounter, items[index][2] * 100, interaction.user.id]);
                            await interaction.client.databaseEditData(`UPDATE ammunition SET x2_magazine = x2_magazine + ? WHERE user_id = ?`, [100, interaction.user.id]);
                            phaseCounter = 1;                            
                        }
                        else {
                            await i.update({ embeds: [interaction.client.redEmbed(`**To continue, you need to buy missile ammunition (x2) __x100__**\n**Quantity**: ${quantity}`, "TUTORIAL phase 5")], components: [quantityButtonUp, quantityButtonDown] });
                        }
                    }
                    else {
                        let add = parseInt(i.customId);
                        if (Number.isInteger(add))
                            quantity += add
                        if (quantity < 1) {
                            quantity -= add;
                            await i.update({ embeds: [interaction.client.redEmbed(`**Quantity can not be less than 1!**\n**Quantity**: ${quantity}`, "TUTORIAL phase 5")], components: [quantityButtonUp, quantityButtonDown] });
                        }
                        else
                            await i.update({ embeds: [interaction.client.blueEmbed(`**⦿ You currently have ${interaction.client.defaultEmojis['credit']}${userInfo.credit} | ${interaction.client.defaultEmojis['units']}${userInfo.units}**\n**Quantity Buying:** ${quantity}\n**Total Price:** ${interaction.client.defaultEmojis['credit']}${items[index][2] * quantity}\n**To continue, set quantity to __100__**`, `TUTORIAL phase 5`)], components: [quantityButtonUp, quantityButtonDown, buySetting] });
                    }
                }
            }
            else if (tutorialCounter == 5) {
                if (phaseCounter == 1) {
                    await i.update({ content: " ", embeds: [interaction.client.greenEmbed(`You can accept mission from **/mission_board**\nTo complete this tutorial, you are required to finish the mission`, "TUTORIAL phase 6")], components: [tutorial] });
                    phaseCounter++;
                }
                else if (phaseCounter == 2) {
                    message = "**Mission Info**\n**ID :** `0`\n**Mission Type:** [hunt](https://obelisk.club/)\n**Map Restriction:** No Map Restriction\n**Mission Reward(s)**\nCredit - 400 | Units - 100 | Exp - 400 | Honor - 10\n**Mission Duration:** [NO TIME LIMIT](https://obelisk.club/)\n**Mission Objective:**```⦿ L1 - 2```";
                    if (i.customId === "get") {
                        await i.update({ embeds: [interaction.client.blueEmbed("Do you really want to accepted this mission?", "TUTORIAL phase 6")], components: [rowYesNo] });
                        phaseCounter++;
                    }
                    else
                        await i.update({ embeds: [interaction.client.yellowPagesImageEmbed(message, "MISSION BOARD", interaction.user, `Page 1 of 1`, "https://obelisk.club/npc/missions.png")], components: [missionRow] });
                }
                else if (phaseCounter == 3) {
                    if (i.customId === "yes") {
                        await i.update({ embeds: [interaction.client.greenEmbed("You have successfully started the mission\nTo complete the mission do **/hunt**\n*You can check the status of the mission by doing **/mission***", "TUTORIAL phase 6")], components: [] })
                        var query = `INSERT INTO user_missions (mission_id, mission_task_left, user_id) VALUES (?, ?, ?)`;
                        var missionId = await interaction.client.databaseEditDataReturnID(query, [0, 1, interaction.user.id]);
                        await interaction.client.databaseEditData(`update users set missions_id = ? where user_id = ?`, [missionId, interaction.user.id]);
                        ended = true;
                        collector.stop("Ended by user");
                    }
                    else {
                        await i.update({ embeds: [interaction.client.redEmbed("To continue, you are required to **accept** this mission\nDo you really want to accepted this mission?", "TUTORIAL phase 6")], components: [rowYesNo] });
                    }
                }
            }
            //}               

            //collector.stop("Selected Firm");
        });

        collector.on('end', collected => {
            if (!ended)
                interaction.editReply({ components: [] });
        });
    }
    /*catch (error) {
        if (interaction.replied) {
            await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
        }

        errorLog.error(error.message, { 'command_name': interaction.commandName });
    }
}*/
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
            .setCustomId('Earth')
            //.setLabel('Beginning')
            .setEmoji("🌏")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Moon')
            //.setLabel('Ending')
            .setEmoji("🌑")
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('Mars')
            //.setLabel('Ending')
            .setEmoji("🍅")
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