const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutorial')
        .setDescription('introduces the game commands'),

    async execute(interaction) {
        try {
            let userInfo = await interaction.client.getUserAccount(interaction.user.id);
            let tutorialCounter = 0;
            let selectedFirm = "";
            let phaseCounter = 1;
            let laserEquipped = false;
            if (typeof userInfo === 'undefined') {
                interaction.reply({ embeds: [interaction.client.yellowEmbed("Which firm would you like to create an account on?")], components: [firm] });
            }
            else if (userInfo.tutorial_counter >= 3) {
                interaction.reply({ embeds: [interaction.client.redEmbed("You already finished the tutorial")] });
                return
            }
            else {
                tutorialCounter = userInfo.tutorial_counter;
                selectedFirm = userInfo.firm;
                if (tutorialCounter == 1) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(`To move in the company base do **/map** then select the **map** that you wish to navigate to`, "TUTORIAL phase 2")], components: [tutorial] });
                }
                else if (tutorialCounter == 2) {
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(`To equip the laser cannon do **/hanger** and select the **option: laser**`, "TUTORIAL phase 3")], components: [tutorial] });
                }
                phaseCounter = 2;
            }

            const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

            collector.on('collect', async i => {
                collector.resetTimer({ time: 25000 });
                if (i.customId === "End") {
                    //tutorialCounter--;
                    await i.update({ embeds: [interaction.client.redEmbed(`Tutorial ended by user`, "TUTORIAL ENDED")], components: [] });
                    //await interaction.client.databaseEditData(`UPDATE users SET tutorial_counter = ? WHERE user_id = ?`, [tutorialCounter, interaction.user.id]);
                    collector.stop("Ended by user");
                }
                //if (i.customId === "Continue" || tutorialCounter === 0) {
                if (tutorialCounter == 0) {
                    tutorialCounter++;
                    await interaction.client.databaseEditData(`INSERT INTO users (user_id, firm) VALUES (?, ?)`, [interaction.user.id, i.customId]);
                    await interaction.client.databaseEditData(`INSERT INTO user_cd (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO ammunition (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO hunt_configuration (user_id) VALUES (?)`, [interaction.user.id]);
                    await interaction.client.databaseEditData(`INSERT INTO user_ships (user_id) VALUES (?)`, [interaction.user.id]);
                    await i.update({ embeds: [interaction.client.greenEmbed(`You have selected **${i.customId}.**\n*You were rewarded with 1000 (x1) laser ammunition and 10000 crediits.*`, "TUTORIAL phase 1")], components: [tutorial] });
                    await interaction.client.databaseEditData(`UPDATE firms_list SET users = users + 1 where firm = ?`, [i.customId]);
                    selectedFirm = i.customId;
                }
                else if (tutorialCounter == 1) {
                    if (phaseCounter == 1) {
                        await i.update({ embeds: [interaction.client.greenEmbed(`To move in the company base do **/map** then select the **map** that you wish to navigate to`, "TUTORIAL phase 2")], components: [tutorial] });
                        phaseCounter++;
                    }
                    if (phaseCounter == 2) {
                        tutorialCounter++;
                        if (selectedFirm === "Earth") {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 1-1**`, "TUTORIAL phase 2")], components: [] });
                            await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [11, tutorialCounter, interaction.user.id]);
                            await interaction.client.wait(1000);
                            await i.update({ embeds: [interaction.client.greenEmbed(`**Welcome to Earth's base!**\n*You were rewarded with one **L3E-** laser cannon\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                            await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                        }
                        else if (selectedFirm === "Moon") {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 1-2**`, "TUTORIAL phase 2")], components: [] });
                            await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [12, tutorialCounter, interaction.user.id]);
                            await interaction.client.wait(1000);
                            await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**Welcome to Moon's base!**\n*You were rewarded with one **L3E-** laser cannon\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                            await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                        }
                        else {
                            await i.update({ embeds: [interaction.client.blueEmbed(`**Warping to map 1-3**`, "TUTORIAL phase 2")], components: [] });
                            await interaction.client.databaseEditData(`UPDATE users SET map_id = ?, tutorial_counter = ? WHERE user_id = ?`, [13, tutorialCounter, interaction.user.id]);
                            await interaction.client.wait(1000);
                            await interaction.editReply({ embeds: [interaction.client.greenEmbed(`**Welcome to Moon's base!**\n*You were rewarded with one **L3E-** laser cannon\n**L3** is the laser model and **E-** is the laser rating*`, "TUTORIAL phase 2")], components: [tutorial] });
                            await interaction.client.databaseEditData(`INSERT INTO user_lasers (user_id, laser_model) VALUES (?, ?)`, [interaction.user.id, "L3"]);
                        }
                        phaseCounter = 1;
                    }
                }
                else if (tutorialCounter == 2) {
                    if (phaseCounter == 1) {
                        await i.update({ embeds: [interaction.client.greenEmbed(`To equip the laser cannon do **/hanger** and select the **option: laser**`, "TUTORIAL phase 3")], components: [tutorial] });
                        phaseCounter++;
                    }
                    else if (phaseCounter == 2) {
                        let [message, row] = [0, 0];
                        if (laserEquipped) {
                            if (i.customId === "0") {
                                laserEquipped = !laserEquipped;
                                [message, row] = await hangerHandler(laserEquipped);
                                await i.update({ content: message, components: [row] })
                            }
                            else if (i.customId === "Continue") {
                                tutorialCounter++;
                                phaseCounter = 1;
                                await i.update({ embeds: [interaction.client.greenEmbed(`You can equip other items too by using the **/hanger** command\n*You were rewarded with one **S3E-** shield module`, "TUTORIAL phase 3")], components: [tutorial] });
                                await interaction.client.databaseEditData(`INSERT INTO user_shields (user_id, shield_model) VALUES (?, ?)`, [interaction.user.id, "S3"]);
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
                        await i.update({ embeds: [interaction.client.greenEmbed(`To equip the laser cannon do **/hanger** and select the **option: laser**`, "TUTORIAL phase 4")], components: [tutorial] });
                        phaseCounter++;
                    }
                    else if (phaseCounter == 2) {

                    }
                }
                //}               

                //collector.stop("Selected Firm");
            });

            collector.on('end', collected => {
                interaction.editReply({ content: " \n", embeds: [interaction.client.redEmbed("**Interaction time-out**")], components: [] });
            });
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
        message = `<:L3_equipped:895398008261320705><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>`

    }
    else {
        message = `<:Slot:895013272082853951><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>\n`
        message += `<:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790><:No_Slot:895013272208670790>`
    }
    return [message, row];
}

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

