const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Gold          "]
const disabledMaps = [11, 21, 31, 12, 22, 32];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt')
        .setDescription('Hunt Alien!'),

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
            if (userInfo.tutorial_counter < 6 && userInfo.missions_id == null) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let userCd = await interaction.client.databaseSelectData("SELECT last_hunt, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            let elapsedTimeFromHunt = ~~((Date.now() - Date.parse(userCd[0].last_hunt)) / 1000);
            if (elapsedTimeFromHunt < 60) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'huntCD').format(60 - elapsedTimeFromHunt), interaction.client.getWordLanguage(serverSettings.lang, 'inCD'))], ephemeral: true });
                return;
            }
            if (userInfo.in_hunt == 1) {
                await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`You are already in a battle`, "Battle in progress...", interaction.user)], ephemeral: true });
                return;
            }
            let mapId = userInfo.map_id;
            if (~~((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
                await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [interaction.user.id]);
                mapId = userInfo.next_map_id;
            }


            //let userResources = await userInfo.resources.split("; ").map(Number);
            let resources = [0, 0, 0, 0, 0, 0, 0, 0, 0];

            let log = "";
            let message = "";
            let canHellstorm = false;
            let aliens = 0;
            let newAlien = 0;
            let noDamage = 0;
            let frontEmoji = "";

            let shieldDamage = 0;
            let hullDamage = 0;
            let shieldAbsorption = 0;

            let actualTotal = 0;
            let total = 0;

            let turnCounter = 1;
            let threshold = 0;
            let newAlienChance = 0;

            let alienHullDamage = 0;
            let alienShieldDamage = 0;
            let alienMessage = "";
            let alienInfo = "";
            let run = false;
            let next = false;
            let swapping = false;
            let runEnemy = false;
            let nextEnemy = false;
            let swappingEnemy = false;
            let storedAlien = 0;
            let alienAccuracy = 0;

            let chancePVP = 20;
            if (userInfo.map_id == 42)
                chancePVP = 50;

            while (userInfo.pvp_enable && !(disabledMaps.includes(mapId))) {
                if (interaction.client.random(0, 100) < chancePVP) {
                    let enemyPlayer = await interaction.client.databaseSelectData("SELECT username, firm, user_id, guild_id, channel_id, user_hp, max_hp, max_shield, user_shield, absorption_rate, user_penetration, user_speed, resources FROM users WHERE firm <> ? AND map_id = ? AND group_id <> ? AND in_hunt = 0 ORDER BY RAND() LIMIT 1", [userInfo.firm, mapId, userInfo.group_id]);
                    let secondInteraction;
                    let guildExist;
                    if (typeof enemyPlayer !== 'undefined' && enemyPlayer.length > 0) {
                        secondInteraction = interaction.client.channels.cache.get(enemyPlayer[0].channel_id)
                        guildExist = interaction.client.guilds.cache.get(enemyPlayer[0].guild_id)
                    }

                    if (typeof guildExist != `undefined`) {
                        let enemyJoined = false;
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("", "Looking for an enemy...")], fetchReply: true });
                        await interaction.client.databaseEditData("UPDATE users SET in_hunt = 1 WHERE user_id = ?", [enemyPlayer[0].user_id]);
                        await interaction.client.wait(1000);
                        let enemyShipEmoji = await interaction.client.databaseSelectData("SELECT ship_emoji, ship_model FROM user_ships WHERE user_id = ? AND equipped = 1", [enemyPlayer[0].user_id]);
                        let enemyShipModel = enemyShipEmoji[0].ship_model;
                        enemyShipEmoji = enemyShipEmoji[0].ship_emoji;
                        let player = [await playerHandler(serverSettings, interaction, ["Enemy"], enemyPlayer[0].user_speed, mapId, true)];
                        if (!player[0].active)
                            return;

                        message = `\n**Your Info**:\n**[${enemyShipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].user_hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].user_shield}**`
                            + `\n**Enemy Info**:\n**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;

                        let enemyUsername = enemyPlayer[0].username;
                        if (typeof secondInteraction != `undefined`) {
                            await secondInteraction.send({ content: `<@${enemyPlayer[0].user_id}>`, embeds: [interaction.client.redEmbed(message, `**Danger! Enemy attack!**`)], components: [attackRow] }).then(msg => secondInteraction = msg)
                        }
                        let enemyCd = await interaction.client.databaseSelectData("SELECT last_repair FROM user_cd WHERE user_id = ?", [enemyPlayer[0].user_id]);
                        enemyPlayer[0].user_hp = Math.trunc(userInfo.user_hp + userInfo.repair_rate * (Date.now() - Date.parse(enemyCd[0].last_repair)) / 60000)
                        if (enemyPlayer[0].user_hp > enemyPlayer[0].max_hp)
                            enemyPlayer[0].user_hp = enemyPlayer[0].max_hp;

                        log = `Engaging Combat with Enemy`
                            + `\nYour Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                            + `\nEnemy Info:\nHP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

                        let logEnemy = `Engaging Combat with Enemy`
                            + `\nYour Info : \nHP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}`
                            + `\nEnemy Info:\nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

                        message = `\n**Your Info**:\n**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`
                            + `\n**Enemy Info**:\n**[${enemyShipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].user_hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].user_shield}**`;
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Engaging Combat with Enemy**`)], components: [teamRunRow] });
                        await interaction.client.wait(1500);


                        if (typeof secondInteraction == `undefined`) {
                            let inBattle = [userInfo.user_id];
                            let groupMembers = await interaction.client.databaseSelectData("SELECT user_id FROM users WHERE group_id = ? AND user_id <> ?", [userInfo.group_id, interaction.user.id]);
                            groupMembers = groupMembers.map(x => x.user_id);
                            let swappingCounter = 0;
                            let playerShieldAbsorption = 0;
                            let totalSHieldAbsorption = 0;
                            let numberOfPlayers = 1;

                            const collector = msg.createMessageComponentCollector({ time: 120000 });
                            collector.on('collect', async i => {
                                i.deferUpdate();


                                try {
                                    if (groupMembers.includes(i.user.id) || i.user.id == interaction.user.id) {
                                        if (i.customId == "Swap" && !swapping && player.length > 0) {

                                            if (i.user.username == player[0].username) {
                                                if (inBattle.length == 1)
                                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are the sole member of this operation!", "Error!")], ephemeral: true });
                                                else
                                                    swapping = true;
                                            }
                                            else {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "NextAlien" && enemyPlayer.length > 0 && !next) {

                                            if (i.user.username == player[0].username) {
                                                next = true;
                                            }
                                            else {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "Run" && !run) {
                                            if (i.user.username == player[0].username) {
                                                run = true;
                                                await interaction.editReply({ components: [] });
                                            }
                                            else {

                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "Join") {

                                            if (inBattle.includes(i.user.id)) {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are already in this operation!", "Error!")], ephemeral: true });
                                            }
                                            else {
                                                numberOfPlayers++;
                                                player.push(await playerHandler(serverSettings, i, ["Enemy"], enemyPlayer[0].user_speed, mapId, true));
                                                inBattle.push(i.user.id)
                                                if (!player[player.length - 1].active) {
                                                    inBattle.pop();
                                                    numberOfPlayers--;
                                                    player.pop();
                                                }
                                            }
                                        }
                                        else if (i.customId == "download") {
                                            let attachment = new MessageAttachment(Buffer.from(log, 'utf-8'), `Hunt-Log.txt`);
                                            await interaction.editReply({ embeds: [], components: [], files: [attachment] });
                                            collector.stop("Done downloading");
                                        }
                                    }
                                }
                                catch (error) {

                                }
                            });

                            collector.on('end', collected => {
                                interaction.editReply({ components: [] })
                            });
                            while (enemyPlayer[0].user_hp > 0) {
                                collector.resetTimer({ time: 30000 });
                                swappingCounter++;
                                if (run) {
                                    await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
                                    log += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    await interaction.client.wait(1500);

                                    log += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                        + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                                    message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                        `Credits       :  ${0}\nUnits         :  ${0}\nEXP           :  ${0}\nHonor         :  ${0}` + " \`\`\`";
                                    for (let index in player)
                                        await player[index].update();
                                    await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE SUCCESSFUL!**`)], components: [download] });

                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                                    await interaction.client.databaseEditData("UPDATE users SET user_hp = ?, in_hunt = 0 WHERE user_id = ?", [enemyPlayer[0].user_hp, enemyPlayer[0].user_id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ? WHERE user_id = ? and equipped = 1", [enemyPlayer[0].user_hp, enemyPlayer[0].user_id]);
                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_repair = ? WHERE user_id = ?", [new Date(), enemyPlayer[0].user_id]);
                                    return;
                                }
                                if (swapping && player.length > 0) {
                                    swapping = false
                                    if (swappingCounter > 3) {
                                        swappingCounter = 0;
                                        storedAlien = player[0];
                                        player.shift();
                                        player.push(storedAlien);
                                        //await player[0].info.reloadammo();
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping lead operator...**", "")], components: [] });
                                        await interaction.client.wait(1000);
                                        alienMessage = "";
                                        alienMessage += `<:Transparent:902212836770598922>**${enemyUsername} [${enemyShipEmoji}]**\n<:aim:902625135050235994>[${enemyShipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].user_hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].user_shield}**\n`;

                                        message = `**User Info**:\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;
                                        for (let index in player) {
                                            message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        message += "\n**Enemy Info**:\n" + alienMessage;
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed lead operator**`)], components: [teamRunRow] });
                                        await interaction.client.wait(1500);
                                    }
                                    else {
                                        await interaction.followUp({ embeds: [interaction.client.blueEmbed(`You can change lead operator again after ${4 - swappingCounter} turns!`, `**ERROR!**`)] });
                                    }
                                }
                                threshold = 100 / enemyPlayer[0].max_hp * enemyPlayer[0].user_hp + 100 / enemyPlayer[0].max_shield * enemyPlayer[0].user_shield;

                                shieldAbsorption = 0;
                                hullDamage = 0;
                                shieldDamage = 0;
                                total = 0;
                                for (let index in player) {
                                    await player[index].info.ammunition(threshold, true);
                                    shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                                    hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                    total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                                }
                                hullDamage = ~~hullDamage;
                                totalSHieldAbsorption = shieldAbsorption;
                                if (enemyPlayer[0].user_shield <= shieldAbsorption) {
                                    //player[0].info.userStats.shield += alien[0].shield;
                                    shieldAbsorption = enemyPlayer[0].user_shield;
                                    enemyPlayer[0].info.userStats.shield = 0;
                                }
                                else if (enemyPlayer[0].user_shield > shieldAbsorption) {
                                    //player[0].info.userStats.shield += shieldAbsorption;
                                    enemyPlayer[0].user_shield -= shieldAbsorption;
                                    shieldDamage = ~~(hullDamage * (enemyPlayer[0].absorption_rate / 100 - player[0].info.userStats.penetration));
                                    if (enemyPlayer[0].user_shield < shieldDamage) {
                                        shieldDamage = enemyPlayer[0].user_shield;
                                        enemyPlayer[0].user_shield = 0;
                                    }
                                    else {
                                        enemyPlayer[0].user_shield -= shieldDamage;
                                    }
                                    hullDamage -= shieldDamage;
                                }

                                shieldDamage += shieldAbsorption;
                                actualTotal = hullDamage + shieldDamage;
                                total += shieldAbsorption;

                                if (enemyPlayer[0].user_hp > hullDamage) {
                                    enemyPlayer[0].user_hp -= hullDamage;
                                }
                                else {
                                    hullDamage = enemyPlayer[0].user_hp;
                                    enemyPlayer[0].user_hp = 0;
                                    for (let index in player) {
                                        await player[index].mission.isCompleted("Enemy", serverSettings)

                                        player[index].reward.exp += 1000;
                                        player[index].reward.honor += 500;
                                        player[index].reward.credit += 1000;
                                        player[index].reward.units += 200;
                                    }
                                    if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                                        player[0].cargo.resources = enemyPlayer[0].cargo.resources.map(function (num, idx) {
                                            player[0].cargo.storage += num;
                                            resources[idx] += num;
                                            return num + player[0].cargo.resources[idx];
                                        });
                                }

                                alienMessage = "";
                                alienInfo = "\n\nEnemy Info:";
                                alienMessage += `**[${enemyShipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].user_hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].user_shield}**\n<:Transparent:902212836770598922>`;
                                alienInfo += `\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}`

                                if (shieldAbsorption > 0) {
                                    message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    log += `*Turn ${turnCounter}*\n`;

                                    for (let index in player) {
                                        playerShieldAbsorption = ~~(shieldAbsorption / totalSHieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                                        if (playerShieldAbsorption) {
                                            message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            player[index].info.userStats.shield += playerShieldAbsorption;

                                            if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                                player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                            log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                                + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                        }
                                        else {
                                            message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                                        }
                                    }
                                    message += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                    log += `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                                    log += alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                }
                                else {
                                    message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    log += `*Turn ${turnCounter}*\n`;
                                    for (let index in player) {
                                        message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                            + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                            + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;

                                        log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                            + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                            + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                            + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                                    }
                                    message += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                    log += `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                                    log += alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                }
                                message += `\n**Enemy Info**:**\n<:Transparent:902212836770598922>${enemyUsername} [${enemyShipModel}]**\n<:aim:902625135050235994>` + alienMessage;

                                await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**In Combat with Enemy ship**`)] });
                                await interaction.client.wait(1200);
                                turnCounter++;

                                if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                    noDamage++;
                                    if (noDamage == 6) {
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                                        await interaction.client.wait(1200);
                                        log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        run = true;
                                    }
                                }
                                else
                                    noDamage = 0;
                            }

                            for (let index in player)
                                await player[index].update();
                            log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;
                            log += `\n---------------------`;
                            message += `\n---------------------`;
                            for (let item in resources) {
                                if (resources[item] > 0) {
                                    log += `\n${resourcesName[item]}:  ${resources[item]}`;
                                    message += `\n${resourcesName[item]}:  ${resources[item]}`;
                                }
                            }
                            message += " \`\`\`";
                            await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                            await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);

                            let baseMapID = 0;
                            if (enemyPlayer[0].firm == "Terra") {
                                baseMapID = 11;
                            }
                            else if (enemyPlayer[0].firm == "Luna") {
                                baseMapID = 21;
                            }
                            else {
                                baseMapID = 31;
                            }
                            await interaction.client.databaseEditData("UPDATE users SET next_map_id = 1, map_id = ?, user_hp = 0, in_hunt = 0, cargo = 0, resources = ? WHERE user_id = ?", [baseMapID, "0; 0; 0; 0; 0; 0; 0; 0; 0", enemyPlayer[0].user_id]);
                            await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = 0, durability = 0 WHERE user_id = ? and equipped = 1", [enemyPlayer[0].user_id]);
                            return;
                        }
                        else {
                            let storedMessage = "";
                            let storedLog = "";
                            let enemyStoredLog
                            let messageEnemy = "";
                            let swappingCounter = 0;
                            let swappingCounterEnemy = 0;
                            let playerShieldAbsorption = 0;
                            let totalShieldAbsorption = 0;

                            let enemyShieldDamage = 0;
                            let enemyHullDamage = 0;
                            let enemyShieldAbsorption = 0;

                            let enemyActualTotal = 0;
                            let enemyTotal = 0;
                            let enemyPlayerShieldAbsorption = 0;
                            let enemyTotalShieldAbsorption = 0;
                            let enemyThreshold = 0;
                            let enemyResources = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let enemyNoDamage = 0;

                            let numberOfPlayers = 1;
                            let numberOfEnemies = 1;
                            let inBattle = [userInfo.user_id];
                            let enemyInBattle = [];
                            let joinableEnemiesID = await interaction.client.databaseSelectData("SELECT user_id FROM users WHERE firm = ? AND map_id = ? AND channel_id = ? AND in_hunt = 0 AND user_id <> ? AND group_id <> ?", [enemyPlayer[0].firm, mapId, enemyPlayer[0].channel_id, enemyPlayer[0].user_id, userInfo.group_id]);
                            joinableEnemiesID = joinableEnemiesID.map(x => x.user_id);
                            let groupMembers = await interaction.client.databaseSelectData("SELECT user_id FROM users WHERE group_id = ? AND user_id <> ?", [userInfo.group_id, interaction.user.id]);
                            groupMembers = groupMembers.map(x => x.user_id);

                            const collector = msg.createMessageComponentCollector({ time: 120000 });
                            collector.on('collect', async i => {
                                i.deferUpdate();


                                try {
                                    if (groupMembers.includes(i.user.id) || i.user.id == interaction.user.id) {
                                        if (i.customId == "Swap" && !swapping && player.length > 0) {

                                            if (i.user.username == player[0].username) {
                                                if (inBattle.length == 1)
                                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are the sole member of this operation!", "Error!")], ephemeral: true });
                                                else
                                                    swapping = true;
                                            }
                                            else {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "NextAlien" && enemyPlayer.length > 0 && !next) {

                                            if (i.user.username == player[0].username) {
                                                next = true;
                                            }
                                            else {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "Run" && !run) {
                                            if (i.user.username == player[0].username) {
                                                run = true;
                                                await interaction.editReply({ components: [] });
                                            }
                                            else {

                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (i.customId == "Join") {

                                            if (inBattle.includes(i.user.id)) {
                                                await i.followUp({ embeds: [interaction.client.redEmbed("You are already in this operation!", "Error!")], ephemeral: true });
                                            }
                                            else {
                                                numberOfPlayers++;
                                                player.push(await playerHandler(serverSettings, i, ["Enemy"], enemyPlayer[0].user_speed, mapId, true));
                                                inBattle.push(i.user.id)
                                                if (!player[player.length - 1].active) {
                                                    inBattle.pop();
                                                    numberOfPlayers--;
                                                    player.pop();
                                                }
                                            }
                                        }
                                        else if (i.customId == "download") {
                                            let attachment = new MessageAttachment(Buffer.from(log, 'utf-8'), `Hunt-Log.txt`);
                                            await interaction.editReply({ embeds: [], components: [], files: [attachment] });
                                            collector.stop("Done downloading");
                                        }
                                    }
                                }
                                catch (error) {

                                }

                            });

                            collector.on('end', collected => {
                                interaction.editReply({ components: [] })
                            });

                            let savedID = enemyPlayer[0].user_id

                            const collectorEnemy = msg.createMessageComponentCollector({ time: 120000 });
                            collectorEnemy.on('collect', async iEnemy => {
                                i.deferUpdate();


                                try {
                                    if (joinableEnemiesID.includes(iEnemy.user.id) || iEnemy.user.id == savedID) {
                                        if (iEnemy.customId == "Atk" && !enemyJoined) {
                                            let storedEnemy = enemyPlayer[0];
                                            enemyPlayer = [await playerHandler(serverSettings, iEnemy, ["Enemy"], userInfo.user_speed, mapId, true, true)];
                                            enemyPlayer[0].info.userStats.user_hp = storedEnemy.user_hp;
                                            enemyPlayer[0].info.userStats.user_shield = storedEnemy.user_shield;
                                            enemyJoined = true;
                                            await iEnemy.update();
                                        }
                                        if (iEnemy.customId == "RunAtk") {
                                            runEnemy = true;
                                            await iEnemy.update();
                                        }
                                        if (iEnemy.customId == "SwapEnemy" && !swappingEnemy && enemyPlayer.length > 0) {
                                            await iEnemy.update({});
                                            if (iEnemy.user.username == enemyPlayer[0].username) {
                                                if (inBattle.length == 1)
                                                    await iEnemy.followUp({ embeds: [interaction.client.redEmbed("You are the sole member of this operation!", "Error!")], ephemeral: true });
                                                else
                                                    swappingEnemy = true;
                                            }
                                            else {
                                                await iEnemy.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (iEnemy.customId == "NextAlienEnemy" && player.length > 0 && !nextEnemy) {
                                            await iEnemy.update({});
                                            if (iEnemy.user.username == enemyPlayer[0].username) {
                                                nextEnemy = true;
                                            }
                                            else {
                                                await iEnemy.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (iEnemy.customId == "RunEnemy" && !runEnemy) {
                                            if (iEnemy.user.username == enemyPlayer[0].username) {
                                                runEnemy = true;
                                                await iEnemy.update({ components: [] });
                                            }
                                            else {
                                                await iEnemy.update({});
                                                await iEnemy.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                            }
                                        }
                                        else if (iEnemy.customId == "JoinEnemy") {
                                            await iEnemy.update({});
                                            if (enemyInBattle.includes(iEnemy.user.id)) {
                                                await iEnemy.followUp({ embeds: [interaction.client.redEmbed("You are already in this operation!", "Error!")], ephemeral: true });
                                            }
                                            else {
                                                numberOfEnemies++;
                                                enemyPlayer.push(await playerHandler(serverSettings, iEnemy, ["Enemy"], userInfo.user_speed, mapId, true));
                                                enemyInBattle.push(iEnemy.user.id)
                                                if (!enemyPlayer[enemyPlayer.length - 1].active) {
                                                    enemyInBattle.pop();
                                                    numberOfEnemies--;
                                                    enemyPlayer.pop();
                                                }
                                            }
                                        }
                                        else if (iEnemy.customId == "download") {
                                            let attachment = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                            await iEnemy.update({ embeds: [], components: [], files: [attachment] });
                                            collectorEnemy.stop("Done downloading");
                                        }
                                        else
                                            await iEnemy.update({});

                                    }
                                }
                                catch (error) {

                                }

                            });

                            collectorEnemy.on('end', collected => {
                                interaction.editReply({ components: [] })
                            });

                            while (enemyPlayer[0].user_hp > 0 && !enemyJoined) {
                                collector.resetTimer({ time: 30000 });
                                collectorEnemy.resetTimer({ time: 30000 });
                                swappingCounter++;
                                if (run) {
                                    await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
                                    log += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    logEnemy += `*Enemy initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy initializing escape command...**", "**Loading**")], components: [] })
                                    await interaction.client.wait(1500);

                                    log += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                        + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                                    message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                        `Credits       :  ${0}\nUnits         :  ${0}\nEXP           :  ${0}\nHonor         :  ${0}` + " \`\`\`";
                                    for (let index in player)
                                        await player[index].update();
                                    await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE SUCCESSFUL!**`)], components: [download] });
                                    logEnemy += `*ENEMY ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n`;
                                    await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy has left the hunt!**", "**ESCAPE SUCCESSFUL!**")], components: [] })
                                    await interaction.client.wait(1500);
                                    let attachment = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                    await secondInteraction.edit({ embeds: [], files: [attachment] })

                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                                    await interaction.client.databaseEditData("UPDATE users SET user_hp = ?, in_hunt = 0 WHERE user_id = ?", [enemyPlayer[0].user_hp, enemyPlayer[0].user_id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ? WHERE user_id = ? and equipped = 1", [enemyPlayer[0].user_hp, enemyPlayer[0].user_id]);
                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_repair = ? WHERE user_id = ?", [new Date(), enemyPlayer[0].user_id]);
                                    return;
                                }
                                else if (runEnemy) {
                                    interaction.editReply({ embeds: [interaction.client.blueEmbed("**Enemy initializing escape command...**", `**Loading**`)], components: [] });
                                    await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] })
                                    log += `*Enemy initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    logEnemy += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    await interaction.client.wait(1500);

                                    let escapeTurns = ~~((462 + player[0].info.userStats.speed) / enemyPlayer[0].user_speed * 3);
                                    while (escapeTurns > 0) {
                                        escapeTurns--;
                                        threshold = 100 / enemyPlayer[0].max_hp * enemyPlayer[0].user_hp + 100 / enemyPlayer[0].max_shield * enemyPlayer[0].user_shield;
                                        shieldAbsorption = 0;

                                        hullDamage = 0;
                                        shieldDamage = 0;
                                        total = 0;
                                        for (let index in player) {
                                            await player[index].info.ammunition(threshold, true);
                                            shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                                            hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                            total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                                        }
                                        hullDamage = ~~hullDamage;
                                        totalShieldAbsorption = shieldAbsorption;
                                        if (enemyPlayer[0].user_shield <= shieldAbsorption) {
                                            shieldAbsorption = enemyPlayer[0].user_shield;
                                            enemyPlayer[0].info.userStats.shield = 0;
                                        }
                                        else if (enemyPlayer[0].user_shield > shieldAbsorption) {
                                            enemyPlayer[0].user_shield -= shieldAbsorption;
                                            shieldDamage = ~~(hullDamage * (enemyPlayer[0].absorption_rate / 100 - player[0].info.userStats.penetration));
                                            if (enemyPlayer[0].user_shield < shieldDamage) {
                                                shieldDamage = enemyPlayer[0].user_shield;
                                                enemyPlayer[0].user_shield = 0;
                                            }
                                            else {
                                                enemyPlayer[0].user_shield -= shieldDamage;
                                            }
                                            hullDamage -= shieldDamage;
                                        }

                                        shieldDamage += shieldAbsorption;
                                        actualTotal = hullDamage + shieldDamage;
                                        total += shieldAbsorption;

                                        if (enemyPlayer[0].user_hp > hullDamage) {
                                            enemyPlayer[0].user_hp -= hullDamage;
                                        }
                                        else {
                                            hullDamage = enemyPlayer[0].user_hp;
                                            enemyPlayer[0].user_hp = 0;
                                            for (let index in player) {
                                                await player[index].mission.isCompleted("Enemy", serverSettings)

                                                player[index].reward.exp += 1000;
                                                player[index].reward.honor += 500;
                                                player[index].reward.credit += 1000;
                                                player[index].reward.units += 200;
                                            }
                                            if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                                                player[0].cargo.resources = enemyPlayer[0].cargo.resources.map(function (num, idx) {
                                                    player[0].cargo.storage += num;
                                                    resources[idx] += num;
                                                    return num + player[0].cargo.resources[idx];
                                                });
                                        }

                                        alienMessage = "**";
                                        alienInfo = "\n\nEnemy Info:";
                                        alienMessage += `<:Transparent:902212836770598922>${enemyUsername} [${enemyShipModel}]\n<:aim:902625135050235994>[${enemyShipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[0].user_hp}\t<a:sd:896118359966511104>: ${enemyPlayer[0].user_shield}\n `;
                                        messageEnemy = `**User Info**:\n` + alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        alienMessage += `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        alienInfo += `\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}`
                                        storedMessage = "";
                                        storedLog = "";

                                        message = `**User Info**:\n**`;
                                        log += `*${escapeTurns} turns till enemy escape*\nUser Info:\n`;

                                        if (shieldAbsorption > 0) {
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            logEnemy += `*${escapeTurns} turns till escape*\n`;

                                            for (let index in player) {
                                                playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                                                if (playerShieldAbsorption) {
                                                    storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                                    player[index].info.userStats.shield += playerShieldAbsorption;

                                                    if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                                        player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                                    storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                                        + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                                }
                                                else {
                                                    storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;

                                                    storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                                                }
                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                            logEnemy += `User Info:\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                            log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                        }
                                        else {
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            for (let index in player) {
                                                storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                    + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                    + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                frontEmoji = `<:Transparent:902212836770598922>`;

                                                storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                    + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                    + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                    + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                            logEnemy += `User Info:\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                            log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                        }
                                        message += `\n**Enemy Info**:\n` + alienMessage;
                                        messageEnemy += `\n**Enemy Info**:\n**` + storedMessage;

                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**${escapeTurns} turns till enemy escape**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.blueEmbed(messageEnemy, `**${escapeTurns} turns till escape**`)] })
                                        await interaction.client.wait(1200);


                                        if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                            noDamage++;
                                            if (noDamage == 6) {
                                                await interaction.editReply({ embeds: [interaction.client.redEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                                                await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] })
                                                await interaction.client.wait(1200);
                                                log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                                escapeTurns = 0;
                                            }
                                        }
                                        else
                                            noDamage = 0;
                                        turnCounter++;
                                    }
                                    if (enemyPlayer[0].user_hp > 0) {
                                        for (let index in player)
                                            await player[index].update();
                                        log += `*Enemy escaped!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        logEnemy += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed("**Enemy escaped!**", `**Hunt failed!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await secondInteraction.edit({ content: `<@${enemyPlayer[0].user_id}> successfully escaped!`, embeds: [], components: [], files: [attachmentEnemy] })

                                        await interaction.client.databaseEditData("UPDATE users SET user_hp = ?, in_hunt = 0 WHERE user_id = ?", [enemyPlayer[0].user_hp, enemyPlayer[0].user_id]);
                                        await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ?, durability = durability - 1 WHERE user_id = ? and equipped = 1", enemyPlayer[0].user_hp, [enemyPlayer[0].user_id]);

                                    }
                                    else {
                                        for (let index in player)
                                            await player[index].update();
                                        log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                            + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                                        message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                            `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;
                                        log += `\n---------------------`;
                                        logEnemy += "\nDEFEAT!\nShip DESTROYED!\n---------------------"
                                        message += `\n---------------------`;
                                        for (let item in resources) {
                                            if (resources[item] > 0) {
                                                log += `\n${resourcesName[item]}:  ${resources[item]}`;
                                                message += `\n${resourcesName[item]}:  ${resources[item]}`;
                                            }
                                        }
                                        message += " \`\`\`";
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await secondInteraction.edit({ content: `<@${enemyPlayer[0].user_id}> Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })

                                        let baseMapID = 0;
                                        if (enemyPlayer[0].firm == "Terra") {
                                            baseMapID = 11;
                                        }
                                        else if (enemyPlayer[0].firm == "Luna") {
                                            baseMapID = 21;
                                        }
                                        else {
                                            baseMapID = 31;
                                        }
                                        await interaction.client.databaseEditData("UPDATE users SET next_map_id = 1, map_id = ?, user_hp = 0, in_hunt = 0, cargo = 0, resources = ? WHERE user_id = ?", [baseMapID, "0; 0; 0; 0; 0; 0; 0; 0; 0", enemyPlayer[0].user_id]);
                                        await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = 0, durability = 0 WHERE user_id = ? and equipped = 1", [enemyPlayer[0].user_id]);
                                    }
                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                                    return;
                                }
                                else if (swapping && player.length > 0) {
                                    swapping = false
                                    if (swappingCounter > 3) {
                                        swappingCounter = 0;
                                        storedAlien = player[0];
                                        player.shift();
                                        player.push(storedAlien);
                                        //await player[0].info.reloadammo();
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping lead operator...**", "")], components: [] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy swapping lead operator...**", "")] })
                                        await interaction.client.wait(1000);
                                        alienMessage = "";
                                        alienMessage += `<:Transparent:902212836770598922>**${enemyUsername} [${enemyShipEmoji}]**\n<:aim:902625135050235994>[${enemyShipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].user_hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].user_shield}**\n`;

                                        message = `**User Info**:\n`;
                                        messageEnemy = `**User Info**:\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;
                                        storedMessage = "";
                                        for (let index in player) {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        message += storedMessage;
                                        messageEnemy += alienMessage;
                                        message += "\n**Enemy Info**:\n" + alienMessage;
                                        messageEnemy += "\n**Enemy Info**:\n" + storedMessage;
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed lead operator**`)], components: [teamRunRow] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed(messageEnemy, "**Enemy changed lead operator**")] })
                                        await interaction.client.wait(1500);
                                    }
                                    else {
                                        await interaction.followUp({ embeds: [interaction.client.blueEmbed(`You can change lead operator again after ${4 - swappingCounter} turns!`, `**ERROR!**`)] });
                                    }
                                }
                                threshold = 100 / enemyPlayer[0].max_hp * enemyPlayer[0].user_hp + 100 / enemyPlayer[0].max_shield * enemyPlayer[0].user_shield;
                                shieldAbsorption = 0;

                                hullDamage = 0;
                                shieldDamage = 0;
                                total = 0;
                                for (let index in player) {
                                    await player[index].info.ammunition(threshold, true);
                                    shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                                    hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                    total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                                }
                                hullDamage = ~~hullDamage;
                                totalShieldAbsorption = shieldAbsorption;
                                if (enemyPlayer[0].user_shield <= shieldAbsorption) {
                                    //player[0].info.userStats.shield += alien[0].shield;
                                    shieldAbsorption = enemyPlayer[0].user_shield;
                                    enemyPlayer[0].user_shield = 0;
                                }
                                else if (enemyPlayer[0].user_shield > shieldAbsorption) {
                                    //player[0].info.userStats.shield += shieldAbsorption;
                                    enemyPlayer[0].user_shield -= shieldAbsorption;
                                    shieldDamage = ~~(hullDamage * (enemyPlayer[0].absorption_rate / 100 - player[0].info.userStats.penetration));
                                    if (enemyPlayer[0].user_shield < shieldDamage) {
                                        shieldDamage = enemyPlayer[0].user_shield;
                                        enemyPlayer[0].user_shield = 0;
                                    }
                                    else {
                                        enemyPlayer[0].user_shield -= shieldDamage;
                                    }
                                    hullDamage -= shieldDamage;
                                }

                                shieldDamage += shieldAbsorption;
                                actualTotal = hullDamage + shieldDamage;
                                total += shieldAbsorption;

                                if (enemyPlayer[0].user_hp > hullDamage) {
                                    enemyPlayer[0].user_hp -= hullDamage;
                                }
                                else {
                                    hullDamage = enemyPlayer[0].user_hp;
                                    enemyPlayer[0].user_hp = 0;
                                    for (let index in player) {
                                        await player[index].mission.isCompleted("Enemy", serverSettings)

                                        player[index].reward.exp += 1000;
                                        player[index].reward.honor += 500;
                                        player[index].reward.credit += 1000;
                                        player[index].reward.units += 200;
                                    }
                                    if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                                        player[0].cargo.resources = enemyPlayer[0].cargo.resources.map(function (num, idx) {
                                            player[0].cargo.storage += num;
                                            resources[idx] += num;
                                            return num + player[0].cargo.resources[idx];
                                        });
                                }

                                alienMessage = "**";
                                alienInfo = "\n\nEnemy Info:";
                                alienMessage += `<:Transparent:902212836770598922>${enemyUsername} [${enemyShipModel}]\n<:aim:902625135050235994>[${enemyShipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[0].user_hp}\t<a:sd:896118359966511104>: ${enemyPlayer[0].user_shield}\n `;
                                messageEnemy = `*Turn* ***${turnCounter}***\n**User Info**:\n` + alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                alienMessage += `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                alienInfo += `\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}`
                                storedMessage = "";
                                storedLog = "";

                                message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                                log += `*Turn ${turnCounter}*\nUser Info:\n`;

                                if (shieldAbsorption > 0) {
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    logEnemy += `*Turn ${turnCounter}*\n`;

                                    for (let index in player) {
                                        playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                                        if (playerShieldAbsorption) {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                                player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                            storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                                + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                        }
                                        else {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                                        }
                                    }
                                    message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                    storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                    logEnemy += `User Info:\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                    log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                }
                                else {
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    for (let index in player) {
                                        storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                            + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                            + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;

                                        storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                            + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                            + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                            + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                                    }
                                    message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                    storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                    logEnemy += `User Info:\n${enemyUsername} HP: ${enemyPlayer[0].user_hp}\tShield: ${enemyPlayer[0].user_shield}\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                    log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                }
                                message += `\n**Enemy Info**:\n` + alienMessage;
                                messageEnemy += `\n**Enemy Info**:\n**` + storedMessage;

                                await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**In Combat with Enemy ship**`)] });
                                await secondInteraction.edit({ embeds: [interaction.client.redEmbed(messageEnemy, "**In Combat with Enemy ship**")] })
                                await interaction.client.wait(1200);

                                turnCounter++;

                                if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                    noDamage++;
                                    if (noDamage == 6) {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] })
                                        await interaction.client.wait(1200);
                                        log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        run = true;
                                    }
                                }
                                else
                                    noDamage = 0;
                            }
                            while (enemyPlayer.length > 0 && player.length > 0 && enemyJoined) {
                                collector.resetTimer({ time: 30000 });
                                collectorEnemy.resetTimer({ time: 30000 });
                                swappingCounter++;
                                swappingCounterEnemy++;
                                if (run) {
                                    await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
                                    await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Enemy initializing escape command...**", `**Loading**`)], components: [] })
                                    logEnemy += `*Enemy initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    log += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    await interaction.client.wait(1500);

                                    let escapeTurns = ~~((462 + enemyPlayer[0].info.userStats.speed) / player[0].info.userStats.speed * 3);
                                    while (escapeTurns > 0) {
                                        escapeTurns--;
                                        threshold = 100 / player[0].info.userStats.maxHP * player[0].info.userStats.hp + 100 / player[0].info.userStats.maxShield * player[0].info.userStats.shield;
                                        shieldAbsorption = 0;

                                        hullDamage = 0;
                                        shieldDamage = 0;
                                        total = 0;
                                        for (let index in enemyPlayer) {
                                            await enemyPlayer[index].info.ammunition(threshold, true);
                                            shieldAbsorption += enemyPlayer[index].info.laser.shieldDamage + enemyPlayer[index].info.hellstorm.shieldDamage;
                                            hullDamage += (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                            total += enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.missile.damage;
                                        }
                                        hullDamage = ~~hullDamage;
                                        totalShieldAbsorption = shieldAbsorption;
                                        if (player[0].info.userStats.shield <= shieldAbsorption) {
                                            shieldAbsorption = player[0].info.userStats.shield;
                                            player[0].info.userStats.shield = 0;
                                        }
                                        else if (player[0].info.userStats.shield > shieldAbsorption) {
                                            player[0].info.userStats.shield -= shieldAbsorption;
                                            shieldDamage = ~~(hullDamage * (player[0].info.userStats.absorption / 100 - enemyPlayer[0].info.userStats.penetration));
                                            if (player[0].info.userStats.shield < shieldDamage) {
                                                shieldDamage = player[0].info.userStats.shield;
                                                player[0].info.userStats.shield = 0;
                                            }
                                            else {
                                                player[0].info.userStats.shield -= shieldDamage;
                                            }
                                            hullDamage -= shieldDamage;
                                        }

                                        shieldDamage += shieldAbsorption;
                                        actualTotal = hullDamage + shieldDamage;
                                        total += shieldAbsorption;

                                        if (player[0].info.userStats.hp > hullDamage) {
                                            player[0].info.userStats.shield -= hullDamage;
                                        }
                                        else {
                                            hullDamage = player[0].info.userStats.shield;
                                            player[0].info.userStats.shield = 0;
                                            for (let index in enemyPlayer) {
                                                await enemyPlayer[index].mission.isCompleted("Enemy", serverSettings)

                                                enemyPlayer[index].reward.exp += 1000;
                                                enemyPlayer[index].reward.honor += 500;
                                                enemyPlayer[index].reward.credit += 1000;
                                                enemyPlayer[index].reward.units += 200;
                                            }
                                            if (enemyPlayer[0].cargo.storage < enemyPlayer[0].info.userStats.maxCargo)
                                                enemyPlayer[0].cargo.resources = player[0].cargo.resources.map(function (num, idx) {
                                                    enemyPlayer[0].cargo.storage += num;
                                                    resources[idx] += num;
                                                    return num + enemyPlayer[0].cargo.resources[idx];
                                                });
                                            await player[0].update();
                                            player.shift();
                                        }

                                        alienMessage = "**";
                                        alienInfo = "";
                                        frontEmoji = `<:aim:902625135050235994>`;
                                        for (let index in player) {
                                            alienMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`;
                                            alienInfo += `\n${player[index].username} HP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        messageEnemy = `**User Info**:\n` + alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        alienMessage += `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        storedMessage = "";
                                        storedLog = "";

                                        message = `**User Info**:\n**`;

                                        log += `*${escapeTurns} turns till escape*\nUser Info:`
                                        logEnemy += `*${escapeTurns} turns till enemy escape*\nUser Info:\n`;

                                        if (shieldAbsorption > 0) {
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            for (let index in enemyPlayer) {
                                                playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (enemyPlayer[index].info.laser.shieldDamage + enemyPlayer[index].info.hellstorm.shieldDamage));
                                                if (playerShieldAbsorption) {
                                                    storedMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                                    enemyPlayer[index].info.userStats.shield += playerShieldAbsorption;

                                                    if (enemyPlayer[index].info.userStats.shield > enemyPlayer[index].info.userStats.maxShield)
                                                        enemyPlayer[index].info.userStats.shield = enemyPlayer[index].info.userStats.maxShield;

                                                    storedLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(actualTotal / total * enemyPlayer[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]`
                                                        + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                                }
                                                else {
                                                    storedMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${enemyPlayer[index].info.laser.name} | M : ${enemyPlayer[index].info.missile.name} | H : ${enemyPlayer[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;

                                                    storedLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(actualTotal / total * enemyPlayer[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]\n`;
                                                }
                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                        }
                                        else {
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            for (let index in enemyPlayer) {
                                                storedMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                    + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}\n`
                                                    + `<:Transparent:902212836770598922>[ L : ${enemyPlayer[index].info.laser.name} | M : ${enemyPlayer[index].info.missile.name} | H : ${enemyPlayer[index].info.hellstorm.name} ]\n`;
                                                frontEmoji = `<:Transparent:902212836770598922>`;

                                                storedLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                                    + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                                    + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(actualTotal / total * enemyPlayer[index].info.missile.damage)}]`
                                                    + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(actualTotal / total * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]\n`;

                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                                        }
                                        log += alienInfo + `\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        logEnemy += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\nEnemy Info:" + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                        message += `\n**Enemy Info**:\n` + alienMessage;
                                        messageEnemy += `\n**Enemy Info**:\n**` + storedMessage;

                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(messageEnemy, `**${escapeTurns} turns till enemy escape**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.blueEmbed(message, `**${escapeTurns} turns till escape**`)] })
                                        await interaction.client.wait(1200);


                                        if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                            noDamage++;
                                            if (noDamage == 6) {
                                                await interaction.editReply({ embeds: [interaction.client.redEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] });
                                                await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] })
                                                await interaction.client.wait(1200);
                                                logEnemy += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                                escapeTurns = 0;
                                            }
                                        }
                                        else
                                            noDamage = 0;
                                        turnCounter++;
                                    }
                                    if (player.length > 0) {
                                        for (let index in enemyPlayer)
                                            await enemyPlayer[index].update();
                                        for (let index in player)
                                            await player[index].update();
                                        logEnemy += `*Enemy escaped!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        log += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy escaped!**", `**Hunt failed!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await interaction.editReply({ content: `Successfully escaped!`, embeds: [], components: [], files: [attachmentEnemy] })
                                    }
                                    else {
                                        for (let index in enemyPlayer)
                                            await enemyPlayer[index].update();
                                        logEnemy += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ enemyPlayer[0].info.messageAmmo*/
                                            + `Credits       :  ${enemyPlayer[0].reward.credit}\nUnits         :  ${enemyPlayer[0].reward.units}\nEXP           :  ${enemyPlayer[0].reward.exp}\nHonor         :  ${enemyPlayer[0].reward.honor}`;

                                        message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + enemyPlayer[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                            `Credits       :  ${enemyPlayer[0].reward.credit}\nUnits         :  ${enemyPlayer[0].reward.units}\nEXP           :  ${enemyPlayer[0].reward.exp}\nHonor         :  ${enemyPlayer[0].reward.honor}`;
                                        logEnemy += `\n---------------------`;
                                        message += `\n---------------------`;
                                        for (let item in resources) {
                                            if (resources[item] > 0) {
                                                logEnemy += `\n${resourcesName[item]}:  ${resources[item]}`;
                                                message += `\n${resourcesName[item]}:  ${resources[item]}`;
                                            }
                                        }
                                        message += " \`\`\`";
                                        await secondInteraction.edit({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await interaction.editReply({ content: `<@${savedID}> Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })
                                    }
                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                                    return;
                                }
                                else if (runEnemy) {
                                    interaction.editReply({ embeds: [interaction.client.blueEmbed("**Enemy initializing escape command...**", `**Loading**`)], components: [] });
                                    await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] })
                                    log += `*Enemy initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    logEnemy += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                    await interaction.client.wait(1500);
                                    let escapeTurns = ~~((462 + player[0].info.userStats.speed) / enemyPlayer[0].info.userStats.speed * 3);
                                    while (escapeTurns > 0) {
                                        escapeTurns--;
                                        threshold = 100 / enemyPlayer[0].info.userStats.maxHP * enemyPlayer[0].info.userStats.hp + 100 / enemyPlayer[0].info.userStats.maxShield * enemyPlayer[0].info.userStats.shield;
                                        shieldAbsorption = 0;

                                        hullDamage = 0;
                                        shieldDamage = 0;
                                        total = 0;
                                        for (let index in player) {
                                            await player[index].info.ammunition(threshold, true);
                                            shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                                            hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                            total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                                        }
                                        hullDamage = ~~hullDamage;
                                        totalShieldAbsorption = shieldAbsorption;
                                        if (enemyPlayer[0].info.userStats.shield <= shieldAbsorption) {
                                            shieldAbsorption = enemyPlayer[0].info.userStats.shield;
                                            enemyPlayer[0].info.userStats.shield = 0;
                                        }
                                        else if (enemyPlayer[0].info.userStats.shield > shieldAbsorption) {
                                            enemyPlayer[0].info.userStats.shield -= shieldAbsorption;
                                            shieldDamage = ~~(hullDamage * (enemyPlayer[0].info.userStats.absorption - player[0].info.userStats.penetration));
                                            if (enemyPlayer[0].info.userStats.shield < shieldDamage) {
                                                shieldDamage = enemyPlayer[0].info.userStats.shield;
                                                enemyPlayer[0].info.userStats.shield = 0;
                                            }
                                            else {
                                                enemyPlayer[0].info.userStats.shield -= shieldDamage;
                                            }
                                            hullDamage -= shieldDamage;
                                        }

                                        shieldDamage += shieldAbsorption;
                                        actualTotal = hullDamage + shieldDamage;
                                        total += shieldAbsorption;

                                        if (enemyPlayer[0].info.userStats.hp > hullDamage) {
                                            enemyPlayer[0].info.userStats.hp -= hullDamage;
                                        }
                                        else {
                                            hullDamage = enemyPlayer[0].info.userStats.hp;
                                            enemyPlayer[0].info.userStats.hp = 0;
                                            for (let index in player) {
                                                await player[index].mission.isCompleted("Enemy", serverSettings)

                                                player[index].reward.exp += 1000;
                                                player[index].reward.honor += 500;
                                                player[index].reward.credit += 1000;
                                                player[index].reward.units += 200;
                                            }
                                            if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                                                player[0].cargo.resources = enemyPlayer[0].cargo.resources.map(function (num, idx) {
                                                    player[0].cargo.storage += num;
                                                    resources[idx] += num;
                                                    return num + player[0].cargo.resources[idx];
                                                });
                                            await enemyPlayer[0].update();
                                            enemyPlayer.shift();
                                        }

                                        alienMessage = "**";
                                        alienInfo = "";
                                        frontEmoji = `<:aim:902625135050235994>`;

                                        for (let index in enemyPlayer) {
                                            alienMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}\n`;
                                            alienInfo += `\n${enemyPlayer[index].username} HP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        messageEnemy = `**User Info**:\n` + alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        alienMessage += `<:Transparent:902212836770598922>Total Damage Dealt: __0__**`;
                                        storedMessage = "";
                                        storedLog = "";

                                        message = `**User Info**:\n**`;
                                        log += `*${escapeTurns} turns till enemy escape*\nUser Info:\n`;
                                        logEnemy += `*${escapeTurns} turns till escape*\nUser Info:`;

                                        if (shieldAbsorption > 0) {
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            for (let index in player) {
                                                playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                                                if (playerShieldAbsorption) {
                                                    storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                                    player[index].info.userStats.shield += playerShieldAbsorption;

                                                    if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                                        player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                                    storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                                        + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                                }
                                                else {
                                                    storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                        + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                        + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                    frontEmoji = `<:Transparent:902212836770598922>`;

                                                    storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                        + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                        + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                        + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                                                }
                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                        }
                                        else {
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            for (let index in player) {
                                                storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                    + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                    + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                                frontEmoji = `<:Transparent:902212836770598922>`;

                                                storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                    + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                    + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                    + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                                            }
                                            message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                            storedMessage += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;
                                        }
                                        logEnemy += alienInfo + `\n[Total Damage Dealt: 0]\n\nEnemy info:\n` + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\nEnemy Info:" + alienInfo + `\n[Total Damage Dealt: 0]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                        message += `\n**Enemy Info**:\n` + alienMessage;
                                        messageEnemy += `\n**Enemy Info**:\n**` + storedMessage;

                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**${escapeTurns} turns till enemy escape**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.blueEmbed(messageEnemy, `**${escapeTurns} turns till escape**`)] })
                                        await interaction.client.wait(1200);


                                        if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                            noDamage++;
                                            if (noDamage == 6) {
                                                await interaction.editReply({ embeds: [interaction.client.redEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                                                await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] })
                                                await interaction.client.wait(1200);
                                                log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                                escapeTurns = 0;
                                            }
                                        }
                                        else
                                            noDamage = 0;
                                        turnCounter++;
                                    }
                                    if (enemyPlayer.length > 0) {
                                        for (let index in player)
                                            await player[index].update();
                                        for (let index in enemyPlayer)
                                            await enemyPlayer[index].update();
                                        log += `*Enemy escaped!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        logEnemy += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n`
                                            + `\n---------------------`;
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed("**Enemy escaped!**", `**Hunt failed!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await secondInteraction.edit({ content: `<@${enemyPlayer[0].userID}> successfully escaped!`, embeds: [], components: [], files: [attachmentEnemy] })

                                    }
                                    else {
                                        for (let index in player)
                                            await player[index].update();
                                        log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                            + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                                        message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                            `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;
                                        log += `\n---------------------`;
                                        logEnemy += "\nDEFEAT!\nShip DESTROYED!\n---------------------"
                                        message += `\n---------------------`;
                                        for (let item in resources) {
                                            if (resources[item] > 0) {
                                                log += `\n${resourcesName[item]}:  ${resources[item]}`;
                                                message += `\n${resourcesName[item]}:  ${resources[item]}`;
                                            }
                                        }
                                        message += " \`\`\`";
                                        await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                                        let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                        await secondInteraction.edit({ content: `Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })
                                    }
                                    await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                                    return;
                                }
                                else if (swapping && player.length > 0) {
                                    swapping = false
                                    if (swappingCounter > 3) {
                                        swappingCounter = 0;
                                        storedAlien = player[0];
                                        player.shift();
                                        player.push(storedAlien);
                                        //await player[0].info.reloadammo();
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping lead operator...**", "")], components: [] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy swapping lead operator...**", "")] })
                                        await interaction.client.wait(1000);
                                        alienMessage = "";
                                        for (let index in enemyPlayer)
                                            alienMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n<:Transparent:902212836770598922>[${enemyPlayer[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].info.userStats.shield}**\n`;

                                        message = `**User Info**:\n`;
                                        messageEnemy = `**User Info**:\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;
                                        storedMessage = "";
                                        for (let index in player) {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        message += storedMessage;
                                        messageEnemy += alienMessage;
                                        message += "\n**Enemy Info**:\n" + alienMessage;
                                        messageEnemy += "\n**Enemy Info**:\n" + storedMessage;
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed lead operator**`)], components: [teamRunRow] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed(messageEnemy, "**Enemy changed lead operator**")] })
                                        await interaction.client.wait(1500);
                                    }
                                    else {
                                        await interaction.followUp({ embeds: [interaction.client.blueEmbed(`You can change lead operator again after ${4 - swappingCounter} turns!`, `**ERROR!**`)] });
                                    }
                                }
                                else if (swappingEnemy && enemyPlayer.length > 0) {
                                    swappingEnemy = false
                                    if (swappingCounterEnemy > 3) {
                                        swappingCounterEnemy = 0;
                                        storedAlien = enemyPlayer[0];
                                        enemyPlayer.shift();
                                        enemyPlayer.push(storedAlien);
                                        //await enemyPlayer[0].info.reloadammo();
                                        await secondInteraction.edit({ embeds: [interaction.client.blueEmbed("**Swapping lead operator...**", "")], components: [] });
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed("**Enemy swapping lead operator...**", "")] })
                                        await interaction.client.wait(1000);
                                        alienMessage = "";
                                        for (let index in player)
                                            alienMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n<:Transparent:902212836770598922>[${player[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;

                                        message = `**User Info**:\n`;
                                        messageEnemy = `**User Info**:\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;
                                        storedMessage = "";
                                        for (let index in enemyPlayer) {
                                            storedMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}[${enemyPlayer[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${enemyPlayer[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${enemyPlayer[0].info.userStats.shield}**\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                        }
                                        message += storedMessage;
                                        messageEnemy += alienMessage;
                                        message += "\n**Enemy Info**:\n" + alienMessage;
                                        messageEnemy += "\n**Enemy Info**:\n" + storedMessage;
                                        await secondInteraction.edit({ embeds: [interaction.client.blueEmbed(message, `**Changed lead operator**`)], components: [teamRunRow] });
                                        await interaction.editReply({ embeds: [interaction.client.redEmbed(messageEnemy, "**Enemy changed lead operator**")] })
                                        await interaction.client.wait(1500);
                                    }
                                    else {
                                        await interaction.followUp({ embeds: [interaction.client.blueEmbed(`You can change lead operator again after ${4 - swappingCounter} turns!`, `**ERROR!**`)] });
                                    }
                                }
                                threshold = 100 / enemyPlayer[0].info.userStats.maxHP * enemyPlayer[0].info.userStats.hp
                                    + 100 / enemyPlayer[0].info.userStats.maxShield * enemyPlayer[0].info.userStats.shield;
                                enemyThreshold = 100 / player[0].info.userStats.maxHP * player[0].info.userStats.hp
                                    + 100 / player[0].info.userStats.maxShield * player[0].info.userStats.shield;
                                shieldAbsorption = 0;
                                enemyShieldAbsorption = 0;

                                hullDamage = 0;
                                shieldDamage = 0;
                                enemyHullDamage = 0;
                                enemyShieldDamage = 0;
                                total = 0;
                                enemyTotal = 0;

                                for (let index in player) {
                                    await player[index].info.ammunition(threshold, true);
                                    shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                                    hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                    total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                                }
                                for (let index in enemyPlayer) {
                                    await enemyPlayer[index].info.ammunition(enemyThreshold, true);
                                    enemyShieldAbsorption += enemyPlayer[index].info.laser.shieldDamage + enemyPlayer[index].info.hellstorm.shieldDamage;
                                    enemyHullDamage += (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.missile.damage) * interaction.client.random(enemyPlayer[index].info.userStats.minimumAccuracyUser, 100) / 100;
                                    enemyTotal += enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.missile.damage;
                                }
                                hullDamage = ~~hullDamage;
                                enemyHullDamage = ~~enemyHullDamage;

                                totalShieldAbsorption = shieldAbsorption;
                                enemyTotalShieldAbsorption = enemyShieldAbsorption;
                                if (enemyPlayer[0].info.userStats.shield <= shieldAbsorption) {
                                    //player[0].info.userStats.shield += alien[0].shield;
                                    shieldAbsorption = enemyPlayer[0].info.userStats.shield;
                                    enemyPlayer[0].info.userStats.shield = 0;
                                }
                                else if (enemyPlayer[0].info.userStats.shield > shieldAbsorption) {
                                    //player[0].info.userStats.shield += shieldAbsorption;
                                    enemyPlayer[0].info.userStats.shield -= shieldAbsorption;
                                    shieldDamage = ~~(hullDamage * (enemyPlayer[0].info.userStats.absorption - player[0].info.userStats.penetration));
                                    if (enemyPlayer[0].info.userStats.shield < shieldDamage) {
                                        shieldDamage = enemyPlayer[0].info.userStats.shield;
                                        enemyPlayer[0].info.userStats.shield = 0;
                                    }
                                    else {
                                        enemyPlayer[0].info.userStats.shield -= shieldDamage;
                                    }
                                    hullDamage -= shieldDamage;
                                }

                                if (player[0].info.userStats.shield <= enemyShieldAbsorption) {
                                    //player[0].info.userStats.shield += alien[0].shield;
                                    enemyShieldAbsorption = player[0].info.userStats.shield;
                                    player[0].info.userStats.shield = 0;
                                }
                                else if (player[0].info.userStats.shield > enemyShieldAbsorption) {
                                    //player[0].info.userStats.shield += shieldAbsorption;
                                    player[0].info.userStats.shield -= enemyShieldAbsorption;
                                    enemyShieldDamage = ~~(enemyHullDamage * (player[0].info.userStats.absorption - enemyPlayer[0].info.userStats.penetration));
                                    if (player[0].info.userStats.shield < enemyShieldDamage) {
                                        enemyShieldDamage = player[0].info.userStats.shield;
                                        player[0].info.userStats.shield = 0;
                                    }
                                    else {
                                        player[0].info.userStats.shield -= enemyShieldDamage;
                                    }

                                    enemyHullDamage -= enemyShieldDamage;
                                }

                                shieldDamage += shieldAbsorption;
                                enemyShieldDamage += enemyShieldAbsorption;
                                actualTotal = hullDamage + shieldDamage;
                                enemyActualTotal = enemyHullDamage + enemyShieldDamage;
                                total += shieldAbsorption;
                                enemyTotal += enemyShieldAbsorption;

                                if (enemyPlayer[0].info.userStats.hp > hullDamage) {
                                    enemyPlayer[0].info.userStats.hp -= hullDamage;
                                }
                                else {
                                    hullDamage = enemyPlayer[0].info.userStats.hp;
                                    enemyPlayer[0].info.userStats.hp = 0;
                                    for (let index in player) {
                                        await player[index].mission.isCompleted("Enemy", serverSettings)

                                        player[index].reward.exp += 1000;
                                        player[index].reward.honor += 500;
                                        player[index].reward.credit += 1000;
                                        player[index].reward.units += 200;
                                        await player[index].info.reloadammo();
                                    }
                                    if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                                        player[0].cargo.resources = enemyPlayer[0].cargo.resources.map(function (num, idx) {
                                            player[0].cargo.storage += num;
                                            resources[idx] += num;
                                            return num + player[0].cargo.resources[idx];
                                        });
                                }

                                if (player[0].info.userStats.hp > enemyHullDamage) {
                                    player[0].info.userStats.hp -= enemyHullDamage;
                                }
                                else {
                                    enemyHullDamage = player[0].info.userStats.hp;
                                    player[0].info.userStats.hp = 0;
                                    for (let index in enemyPlayer) {
                                        await enemyPlayer[index].mission.isCompleted("Enemy", serverSettings)

                                        enemyPlayer[index].reward.exp += 1000;
                                        enemyPlayer[index].reward.honor += 500;
                                        enemyPlayer[index].reward.credit += 1000;
                                        enemyPlayer[index].reward.units += 200;
                                        await enemyPlayer[index].info.reloadammo();
                                    }
                                    if (enemyPlayer[0].cargo.storage < enemyPlayer[0].info.userStats.maxCargo)
                                        enemyPlayer[0].cargo.resources = player[0].cargo.resources.map(function (num, idx) {
                                            enemyPlayer[0].cargo.storage += num;
                                            enemyResources[idx] += num;
                                            return num + enemyPlayer[0].cargo.resources[idx];
                                        });
                                }

                                storedMessage = "";
                                alienMessage = "";
                                storedLog = "";
                                enemyStoredLog = "";

                                message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                                messageEnemy = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                                log += `*Turn ${turnCounter}*\nUser Info:\n`;
                                logEnemy += `*Turn ${turnCounter}*\nUser Info:\n`;

                                if (shieldAbsorption > 0) {
                                    frontEmoji = `<:Transparent:902212836770598922>`;

                                    for (let index in player) {
                                        playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                                        if (playerShieldAbsorption) {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            player[index].info.userStats.shield += playerShieldAbsorption;

                                            if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                                player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                            storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                                + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                                        }
                                        else {
                                            storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                                        }
                                    }
                                }
                                else {
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    for (let index in player) {
                                        storedMessage += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                            + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                            + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;

                                        storedLog += `${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                            + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                            + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                            + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                                    }
                                }

                                if (shieldAbsorption > 0) {
                                    frontEmoji = `<:Transparent:902212836770598922>`;

                                    for (let index in enemyPlayer) {
                                        enemyPlayerShieldAbsorption = ~~(enemyShieldAbsorption / enemyTotalShieldAbsorption * (enemyPlayer[index].info.laser.shieldDamage + enemyPlayer[index].info.hellstorm.shieldDamage));
                                        if (enemyPlayerShieldAbsorption) {
                                            alienMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}<a:Absorb:949004754678341633>${enemyPlayerShieldAbsorption}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${enemyPlayer[index].info.laser.name} | M : ${enemyPlayer[index].info.missile.name} | H : ${enemyPlayer[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;
                                            enemyPlayer[index].info.userStats.shield += enemyPlayerShieldAbsorption;


                                            if (enemyPlayer[index].info.userStats.shield > enemyPlayer[index].info.userStats.maxShield)
                                                enemyPlayer[index].info.userStats.shield = enemyPlayer[index].info.userStats.maxShield;

                                            enemyStoredLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(enemyActualTotal / enemyTotal * enemyPlayer[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]`
                                                + `\n+ ${enemyPlayerShieldAbsorption} Shield Absorbed\n`
                                        }
                                        else {
                                            alienMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                                + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}\n`
                                                + `<:Transparent:902212836770598922>[ L : ${enemyPlayer[index].info.laser.name} | M : ${enemyPlayer[index].info.missile.name} | H : ${enemyPlayer[index].info.hellstorm.name} ]\n`;
                                            frontEmoji = `<:Transparent:902212836770598922>`;

                                            enemyStoredLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                                + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                                + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(enemyActualTotal / enemyTotal * enemyPlayer[index].info.missile.damage)}]`
                                                + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]\n`;
                                        }
                                    }
                                }
                                else {
                                    frontEmoji = `<:Transparent:902212836770598922>`;
                                    for (let index in enemyPlayer) {
                                        alienMessage += `<:Transparent:902212836770598922>${enemyPlayer[index].username} [${enemyPlayer[index].info.userStats.shipModel}]\n${frontEmoji}`
                                            + `[${enemyPlayer[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${enemyPlayer[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${enemyPlayer[index].info.userStats.shield}\n`
                                            + `<:Transparent:902212836770598922>[ L : ${enemyPlayer[index].info.laser.name} | M : ${enemyPlayer[index].info.missile.name} | H : ${enemyPlayer[index].info.hellstorm.name} ]\n`;
                                        frontEmoji = `<:Transparent:902212836770598922>`;

                                        enemyStoredLog += `${enemyPlayer[index].username} : \nHP: ${enemyPlayer[index].info.userStats.hp}\tShield: ${enemyPlayer[index].info.userStats.shield}`

                                            + `\n[Laser Damage (${enemyPlayer[index].info.laser.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.laser.damage + enemyPlayer[index].info.laser.shieldDamage))}]`
                                            + `\n[Missile Damage (${enemyPlayer[index].info.missile.name}): ${~~(enemyActualTotal / enemyTotal * enemyPlayer[index].info.missile.damage)}]`
                                            + `\n[Hellstorm Damage (${enemyPlayer[index].info.hellstorm.name}): ${~~(enemyActualTotal / enemyTotal * (enemyPlayer[index].info.hellstorm.damage + enemyPlayer[index].info.hellstorm.shieldDamage))}]\n`;

                                    }
                                }

                                message += storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n**Enemy Info**:\n**` + alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${enemyHullDamage}__ <a:sd:896118359966511104>**:**__${enemyShieldDamage}__]**`;
                                messageEnemy += alienMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${enemyHullDamage}__ <a:sd:896118359966511104>**:**__${enemyShieldDamage}__]**\n**Enemy Info**:\n**` + storedMessage + `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**`;
                                log += storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + "\nEnemy Info:\n" + enemyStoredLog + `\nTotal Damage Dealt: [HP: ${enemyHullDamage} SHIELD: ${enemyShieldDamage}]` + `\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                                logEnemy += enemyStoredLog + `\nTotal Damage Dealt: [HP: ${enemyHullDamage} SHIELD: ${enemyShieldDamage}]` + "\nEnemy Info:\n" + storedLog + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]` + `\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

                                await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**In Combat with Enemy ship**`)] });
                                await secondInteraction.edit({ embeds: [interaction.client.redEmbed(messageEnemy, "**In Combat with Enemy ship**")], components: [teamRunRowEnemy] })
                                await interaction.client.wait(1200);

                                if (enemyPlayer[0].info.userStats.hp <= 0) {
                                    await enemyPlayer[0].update();
                                    enemyPlayer.shift();
                                }
                                if (player[0].info.userStats.hp <= 0) {
                                    await player[0].update();
                                    player.shift();
                                }
                                turnCounter++;

                                if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                                    noDamage++;
                                    if (noDamage == 6) {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] })
                                        await interaction.client.wait(1200);
                                        log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        run = true;
                                    }
                                }
                                else
                                    noDamage = 0;

                                if (enemyHullDamage + enemyShieldDamage + enemyShieldAbsorption <= 0) {
                                    enemyNoDamage++;
                                    if (enemyNoDamage == 6) {
                                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Enemy no usable ammonitions found!**", `**Enemy Ammo deplenished!!**`)] });
                                        await secondInteraction.edit({ embeds: [interaction.client.redEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] })
                                        await interaction.client.wait(1200);
                                        logEnemy += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                                        runEnemy = true;
                                    }
                                }
                                else
                                    enemyNoDamage = 0;
                            }

                            if (player.length > 0) {
                                for (let index in player)
                                    await player[index].update();
                                log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                    + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                                message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                    `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;
                                log += `\n---------------------`;
                                logEnemy += "\nDEFEAT!\nShip DESTROYED!\n---------------------"
                                message += `\n---------------------`;
                                for (let item in resources) {
                                    if (resources[item] > 0) {
                                        log += `\n${resourcesName[item]}:  ${resources[item]}`;
                                        message += `\n${resourcesName[item]}:  ${resources[item]}`;
                                    }
                                }
                                message += " \`\`\`";
                                await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                                await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);

                                let attachmentEnemy = new MessageAttachment(Buffer.from(logEnemy, 'utf-8'), `Hunt-Log.txt`);
                                if (!enemyJoined) {
                                    await secondInteraction.edit({ content: `<@${savedID}> Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })
                                    let baseMapID = 0;
                                    if (enemyPlayer[0].firm == "Terra") {
                                        baseMapID = 11;
                                    }
                                    else if (enemyPlayer[0].firm == "Luna") {
                                        baseMapID = 21;
                                    }
                                    else {
                                        baseMapID = 31;
                                    }
                                    await interaction.client.databaseEditData("UPDATE users SET next_map_id = 1, map_id = ?, user_hp = 0, in_hunt = 0, cargo = 0, resources = ? WHERE user_id = ?", [baseMapID, "0; 0; 0; 0; 0; 0; 0; 0; 0", enemyPlayer[0].user_id]);
                                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = 0, durability = 0 WHERE user_id = ? and equipped = 1", [enemyPlayer[0].user_id]);
                                }
                                else {
                                    await secondInteraction.edit({ content: `<@${savedID}> Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })
                                }
                                return;
                            }
                            else if (enemyPlayer.length > 0) {
                                for (let index in enemyPlayer)
                                    await enemyPlayer[index].update();
                                logEnemy += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ enemyPlayer[0].info.messageAmmo*/
                                    + `Credits       :  ${enemyPlayer[0].reward.credit}\nUnits         :  ${enemyPlayer[0].reward.units}\nEXP           :  ${enemyPlayer[0].reward.exp}\nHonor         :  ${enemyPlayer[0].reward.honor}`;

                                message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + enemyPlayer[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                    `Credits       :  ${enemyPlayer[0].reward.credit}\nUnits         :  ${enemyPlayer[0].reward.units}\nEXP           :  ${enemyPlayer[0].reward.exp}\nHonor         :  ${enemyPlayer[0].reward.honor}`;
                                logEnemy += `\n---------------------`;
                                log += "\nDEFEAT!\nShip DESTROYED!\n---------------------"
                                message += `\n---------------------`;
                                for (let item in enemyResources) {
                                    if (enemyResources[item] > 0) {
                                        log += `\n${resourcesName[item]}:  ${enemyResources[item]}`;
                                        message += `\n${resourcesName[item]}:  ${enemyResources[item]}`;
                                    }
                                }
                                message += " \`\`\`";
                                await secondInteraction.edit({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
                                await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);

                                let attachmentEnemy = new MessageAttachment(Buffer.from(log, 'utf-8'), `Hunt-Log.txt`);
                                await interaction.editReply({ content: `<@${player[0].userID}> Ship destroyed!`, embeds: [], components: [], files: [attachmentEnemy] })
                                return;
                            }
                        }
                    }
                    else
                        userInfo.pvp_enable = false;
                }
                else
                    userInfo.pvp_enable = false;
            }
            let huntConfiguration = await interaction.client.databaseSelectData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
            if (huntConfiguration[0].mothership == 1)
                aliens = await interaction.client.databaseSelectData("SELECT * FROM aliens WHERE map_id = ?", [mapId]);
            else
                aliens = await interaction.client.databaseSelectData("SELECT * FROM aliens WHERE map_id = ? and mothership = 0", [mapId]);
            if (typeof aliens == 'undefined') {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("**No aliens found**", "ERROR!")] });
                return;
            }
            let aliensName = aliens.map(x => x.alien_name);
            let alien = [await getAlien(aliens, huntConfiguration[0].mothership)];
            for (let index in aliens) {
                if (aliens[index].mothership == 1)
                    aliens.splice(index, 1);
            }


            await interaction.editReply({ embeds: [interaction.client.blueEmbed("", "Looking for an alien...")], fetchReply: true });
            await interaction.client.wait(1000);
            let player = [await playerHandler(serverSettings, interaction, aliensName, alien[0].speed, mapId)];
            if (!player[0].active)
                return;
            log = `Engaging Combat with ->|${alien[0].name}|<-`
                + `\nYour Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                + `\nAlien Info:\nHP: ${alien[0].hp}\tShield: ${alien[0].shield}\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

            message = `\n**Your Info**:\n**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`
                + `\n**Alien Info**:\n**[${alien[0].emoji}]** <a:hp:896118360125870170>: **${alien[0].hp}**\t<a:sd:896118359966511104>: **${alien[0].shield}**`;


            if (userInfo.group_id == "0") {
                await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Engaging Combat with ->|${alien[0].name}|<-**`)], components: [runRow] });
                await interaction.client.wait(1500);
                const collector = msg.createMessageComponentCollector({ time: 120000 });
                collector.on('collect', async i => {
                    i.deferUpdate();


                    try {
                        if (i.user.id == interaction.user.id) {
                            if (i.customId == "Run") {
                                run = true;
                                await interaction.editReply({ components: [] });
                            }
                            else if (i.customId == "NextAlien" && alien.length > 0) {
                                next = true;

                            }
                            else if (i.customId == "download") {
                                let attachment = new MessageAttachment(Buffer.from(log, 'utf-8'), `Hunt-Log.txt`);
                                await interaction.editReply({ embeds: [], components: [], files: [attachment] });
                                collector.stop();
                            }
                        }

                    }
                    catch (error) {

                    }
                });

                collector.on('end', collected => {
                    interaction.editReply({ components: [] })
                });
                while (player[0].info.userStats.hp > 0 && alien.length > 0) {
                    collector.resetTimer({ time: 30000 });
                    if (run) {
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
                        log += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                        await interaction.client.wait(1500);

                        let escapeTurns = ~~((462 + alien[0].speed) / player[0].info.userStats.speed * 3);
                        while (player[0].info.userStats.hp > 0 && escapeTurns > 0) {
                            escapeTurns--;
                            alienMessage = "";
                            alienInfo = "\n\nAlien Info:";
                            alienHullDamage = 0;
                            alienShieldDamage = 0;
                            for (let index in alien) {
                                alienHullDamage += alien[index].damage;
                                alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                                alienInfo += `\n${alien[index].name} HP: ${alien[index].hp}\tShield: ${alien[index].shield}`
                            }
                            alienAccuracy = interaction.client.random(player[0].info.userStats.minimumAccuracyAlien, 100);
                            if (alienAccuracy > 50) {
                                alienHullDamage = ~~(alienHullDamage * alienAccuracy / 100)
                                alienMessage += `**Total Damage Dealt: __${alienHullDamage}__**`;

                                if (player[0].info.userStats.shield > 0) {
                                    alienShieldDamage = ~~(alienHullDamage * (player[0].info.userStats.absorption - alien[0].penetration));
                                    if (player[0].info.userStats.shield <= alienShieldDamage) {
                                        player[0].info.userStats.shield = 0;
                                        player[0].info.userStats.hp -= alienHullDamage - player[0].info.userStats.shield;
                                    }
                                    else {
                                        player[0].info.userStats.shield = alienShieldDamage;
                                        player[0].info.userStats.hp -= alienHullDamage - alienShieldDamage;
                                    }
                                }
                                else {
                                    player[0].info.userStats.hp -= alienHullDamage;
                                }
                            }
                            else {
                                alienHullDamage = "MISS";
                                alienMessage += `**Total Damage Dealt: __MISS__**`;
                            }

                            message = `<:aim:902625135050235994>**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;

                            log +=
                                `*${escapeTurns} turns till escape*`
                                + `Your Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                                + `\nTotal Damage Dealt: 0`
                                + alienInfo
                                + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

                            message += "\n**Alien Info**:\n<:Transparent:902212836770598922>" + alienMessage;

                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**${escapeTurns} turns till escape**`)] });
                            await interaction.client.wait(1500);
                        }
                        if (player[0].info.userStats.hp > 0) {
                            log += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";
                            await player[0].update();
                            await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE SUCCESSFUL!**`)], components: [download] });
                        }
                        else {
                            player[0].info.userStats.hp = 0;
                            log += `*ESCAPE FAILED!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";
                            await player[0].update();
                            await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE FAILED!**`)], components: [download] });
                        }
                        await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                        return;
                    }
                    if (next && alien.length > 0) {
                        next = false;
                        storedAlien = alien[0];
                        alien.shift();
                        alien.push(storedAlien);
                        await player[0].info.reloadammo();
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping target alien...**", "")], components: [] });
                        await interaction.client.wait(1000);
                        alienMessage = "";
                        for (let index in alien) {
                            alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                        }
                        message = `**User Info**:\n`
                            + `<:aim:902625135050235994>**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`
                            + "\n**Alien Info**:\n<:aim:902625135050235994>" + alienMessage;
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed aimed alien**`)], components: [runRow] });
                        await interaction.client.wait(1500);
                    }
                    alienHullDamage = 0;
                    alienShieldDamage = 0;
                    threshold = 100 / alien[0].maxHP * alien[0].hp + 100 / alien[0].maxShield * alien[0].shield;
                    shieldAbsorption = 0;
                    hullDamage = 0;
                    shieldDamage = 0;
                    total = 0;
                    if (alien[0].maxHP + alien[0].maxShield > 9500)
                        canHellstorm = true;
                    else
                        canHellstorm = false;
                    await player[0].info.ammunition(threshold, canHellstorm);

                    shieldAbsorption = player[0].info.laser.shieldDamage + player[0].info.hellstorm.shieldDamage;
                    hullDamage = ~~((player[0].info.laser.damage + player[0].info.hellstorm.damage + player[0].info.missile.damage) * interaction.client.random(player[0].info.userStats.minimumAccuracyUser, 100) / 100);

                    if (alien[0].shield <= shieldAbsorption) {
                        //player[0].info.userStats.shield += alien[0].shield;
                        shieldAbsorption = alien[0].shield;
                        alien[0].shield = 0;
                    }
                    else if (alien[0].shield > shieldAbsorption) {
                        //player[0].info.userStats.shield += shieldAbsorption;
                        alien[0].shield -= shieldAbsorption;
                        shieldDamage = ~~(hullDamage * (alien[0].absorption - player[0].info.userStats.penetration));
                        if (alien[0].shield < shieldDamage) {
                            shieldDamage = alien[0].shield;
                            alien[0].shield = 0;
                        }
                        else {
                            alien[0].shield -= shieldDamage;
                        }
                        hullDamage -= shieldDamage;
                    }

                    shieldDamage += shieldAbsorption;
                    actualTotal = hullDamage + shieldDamage;
                    total = player[0].info.laser.damage + player[0].info.hellstorm.damage + player[0].info.missile.damage + shieldAbsorption;

                    if (player[0].info.userStats.shield > player[0].info.userStats.maxShield)
                        player[0].info.userStats.shield = player[0].info.userStats.maxShield;

                    if (alien[0].hp > hullDamage) {
                        alien[0].hp -= hullDamage;
                    }
                    else {
                        player[0].aliensKilled += 1;
                        hullDamage = alien[0].hp;
                        alien[0].hp = 0;
                        alien[0].damage = 0;
                        await player[0].mission.isCompleted(alien[0].name, serverSettings)

                        player[0].reward.exp += alien[0].exp;
                        player[0].reward.honor += alien[0].honor;
                        player[0].reward.credit += alien[0].credit;
                        player[0].reward.units += alien[0].units;
                        await player[0].info.reloadammo();
                        if (userInfo.cargo < userInfo.max_cargo)
                            player[0].cargo.resources = alien[0].resources.map(function (num, idx) {
                                player[0].cargo.storage += num;
                                resources[idx] += num;
                                return num + player[0].cargo.resources[idx];
                            });
                    }

                    alienMessage = "";
                    alienInfo = "\n\nAlien Info:";
                    for (let index in alien) {
                        alienHullDamage += alien[index].damage;
                        alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                        alienInfo += `\n${alien[index].name} HP: ${alien[index].hp}\tShield: ${alien[index].shield}`
                    }
                    alienAccuracy = interaction.client.random(player[0].info.userStats.minimumAccuracyAlien, 100);
                    if (alienAccuracy > 60) {
                        alienHullDamage = ~~(alienHullDamage * alienAccuracy / 100)
                        if (alienHullDamage > 0) {
                            alienMessage += `**Total Damage Dealt: __${alienHullDamage}__**`;
                            if (player[0].info.userStats.shield > 0) {
                                alienShieldDamage = ~~(alienHullDamage * (player[0].info.userStats.absorption - alien[0].penetration));
                                if (player[0].info.userStats.shield <= alienShieldDamage) {
                                    player[0].info.userStats.shield = 0;
                                    player[0].info.userStats.hp -= alienHullDamage - player[0].info.userStats.shield;
                                }
                                else {
                                    player[0].info.userStats.shield -= alienShieldDamage;
                                    player[0].info.userStats.hp -= alienHullDamage - alienShieldDamage;
                                }
                            }
                            else {
                                player[0].info.userStats.shield = 0;
                                player[0].info.userStats.hp -= alienHullDamage;
                            }
                        }
                        else {
                            alienMessage += `**Total Damage Dealt: __MISS__**`;
                            alienHullDamage = "MISS";
                        }
                    }
                    else {
                        alienHullDamage = "MISS";
                        alienMessage += `**Total Damage Dealt: __MISS__**`;
                    }
                    if (player[0].info.userStats.hp <= 0) {
                        player[0].info.userStats.hp = 0;
                        log += `*DEFEAT!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                            + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                        message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                            `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";
                        await player[0].update();
                        await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**DEFEAT!**`)], components: [download] });
                        await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                        return;
                    }

                    if (shieldAbsorption > 0) {
                        message = `*Turn* ***${turnCounter}***\n**User Info**:\n` +
                            `<:aim:902625135050235994>**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}<a:Absorb:949004754678341633>${shieldAbsorption}**\n` +
                            `<:Transparent:902212836770598922>**[ L : ${player[0].info.laser.name} | M : ${player[0].info.missile.name} | H : ${player[0].info.hellstorm.name} ]**\n` +
                            `<:Transparent:902212836770598922>**Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                        log +=
                            `*Turn ${turnCounter}*\n`
                            + `Your Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                            + `\n[Laser Damage (${player[0].info.laser.name}): ${~~(actualTotal / total * (player[0].info.laser.damage + player[0].info.laser.shieldDamage))}]`
                            + `\n[Missile Damage (${player[0].info.missile.name}): ${~~(actualTotal / total * player[0].info.missile.damage)}]`
                            + `\n[Hellstorm Damage (${player[0].info.hellstorm.name}): ${~~(actualTotal / total * (player[0].info.hellstorm.damage + player[0].info.hellstorm.shieldDamage))}]`
                            + `\n+ ${shieldAbsorption} Shield Absorbed`
                            + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                            + alienInfo
                            + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                    }
                    else {
                        message = `*Turn* ***${turnCounter}***\n**User Info**:\n` +
                            `<:aim:902625135050235994>**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n` +
                            `<:Transparent:902212836770598922>**[ L : ${player[0].info.laser.name} | M : ${player[0].info.missile.name} | H : ${player[0].info.hellstorm.name} ]**\n` +
                            `<:Transparent:902212836770598922>**Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                        log +=
                            `*Turn ${turnCounter}*\n`
                            + `Your Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                            + `\n[Laser Damage (${player[0].info.laser.name}): ${~~(actualTotal / total * (player[0].info.laser.damage + player[0].info.laser.shieldDamage))}]`
                            + `\n[Missile Damage (${player[0].info.missile.name}): ${~~(actualTotal / total * player[0].info.missile.damage)}]`
                            + `\n[Hellstorm Damage (${player[0].info.hellstorm.name}): ${~~(actualTotal / total * (player[0].info.hellstorm.damage + player[0].info.hellstorm.shieldDamage))}]`
                            + `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                            + alienInfo
                            + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                    }
                    player[0].info.userStats.shield += shieldAbsorption;
                    message += "\n**Alien Info**:\n<:aim:902625135050235994>" + alienMessage;

                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**In Combat with ->|${alien[0].name}|<-**`)] });
                    await interaction.client.wait(1200);

                    newAlienChance = 100 / (alien[0].maxHP + alien[0].maxShield) * player[0].info.laser.damage - (turnCounter - 1) * 20;
                    if (newAlienChance < 7 && turnCounter <= 7)
                        newAlienChance = 0.003 * player[0].info.laser.damage;
                    if (interaction.client.random(0, 100) <= newAlienChance) {
                        newAlien = await getAlien(aliens);
                        alien.push(newAlien);
                        log += "NEW ALIEN ENCOUNTERED !!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                        await interaction.editReply({ embeds: [interaction.client.yellowEmbed("\`\`\`json\n\"NEW ALIEN ENCOUNTERED !!!\"\n\`\`\`")], components: [] });
                        await interaction.client.wait(1500);
                        message = `**User Info**:\n`
                            + `<:aim:902625135050235994>**[${player[0].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`
                            + "\n**Alien Info**:\n<:aim:902625135050235994>" + alienMessage.split("**Total")[0]
                            + `**[${newAlien.emoji}]** <a:hp:896118360125870170>: **${newAlien.hp}**\t<a:sd:896118359966511104>: **${newAlien.shield}**`
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**->|${newAlien.name}|<- joined the fight!**`)], components: [runRow] });
                        await interaction.client.wait(1500);
                    }

                    if (alien[0].hp <= 0)
                        alien.shift();
                    turnCounter++;

                    if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                        noDamage++;
                        if (noDamage == 6) {
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                            await interaction.client.wait(1200);
                            log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                            run = true;
                        }
                    }
                    else
                        noDamage = 0;

                }
            }
            else {
                await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Engaging Combat with ->|${alien[0].name}|<-**`)], components: [teamRunRow] });
                await interaction.client.wait(1500);
                let swappingCounter = 0;
                let playerShieldAbsorption = 0;
                let totalShieldAbsorption = 0;
                let numberOfPlayers = 1;
                let groupMembers = [];
                let inBattle = await interaction.client.databaseSelectData("SELECT user_id FROM users WHERE group_id = ?", [userInfo.group_id]);
                groupMembers = inBattle.map(x => x.user_id);
                inBattle = [userInfo.user_id];

                const collector = msg.createMessageComponentCollector({ time: 120000 });
                collector.on('collect', async i => {
                    i.deferUpdate();


                    try {
                        if (groupMembers.includes(i.user.id) || i.user.id == interaction.user.id) {
                            if (i.customId == "Swap") {

                                if (i.user.username == player[0].username && !swapping && player.length > 0) {
                                    if (inBattle.length == 1)
                                        await i.followUp({ embeds: [interaction.client.redEmbed("You are the sole member of this operation!", "Error!")], ephemeral: true });
                                    else
                                        swapping = true;
                                }
                                else {
                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                }
                            }
                            else if (i.customId == "NextAlien" && alien.length > 0 && !next) {

                                if (i.user.username == player[0].username) {
                                    next = true;
                                }
                                else {
                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                }
                            }
                            else if (i.customId == "Run" && !run) {
                                if (i.user.username == player[0].username) {
                                    run = true;
                                    await interaction.editReply({ components: [] });
                                }
                                else {

                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are not the lead operator", "Error!")], ephemeral: true });
                                }
                            }
                            else if (i.customId == "Join") {

                                if (inBattle.includes(i.user.id)) {
                                    await i.followUp({ embeds: [interaction.client.redEmbed("You are already in this operation!", "Error!")], ephemeral: true });
                                }
                                else {
                                    numberOfPlayers++;
                                    player.push(await playerHandler(serverSettings, i, aliensName, alien[0].speed, mapId));
                                    inBattle.push(i.user.id)
                                    if (!player[player.length - 1].active) {
                                        inBattle.pop();
                                        numberOfPlayers--;
                                        player.pop();
                                    }
                                }
                            }
                            else if (i.customId == "download") {
                                let attachment = new MessageAttachment(Buffer.from(log, 'utf-8'), `Hunt-Log.txt`);
                                await interaction.editReply({ embeds: [], components: [], files: [attachment] });
                                collector.stop("Done downloading");
                            }
                        }

                    }
                    catch (error) {

                    }

                });

                collector.on('end', collected => {
                    interaction.editReply({ components: [] })
                });

                while (player[0].info.userStats.hp > 0 && alien.length > 0) {
                    collector.resetTimer({ time: 30000 });
                    swappingCounter++;
                    if (run) {
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
                        log += `*Initializing escape command...*\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                        await interaction.client.wait(1500);

                        let escapeTurns = ~~((462 + alien[0].speed) / player[0].info.userStats.speed * 3);
                        while (player.length > 0 && escapeTurns > 0) {
                            escapeTurns--;
                            alienMessage = "";
                            alienInfo = "\n\nAlien Info:";
                            alienHullDamage = 0;
                            alienShieldDamage = 0;
                            for (let index in alien) {
                                alienHullDamage += alien[index].damage;
                                alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                                alienInfo += `\n${alien[index].name} HP: ${alien[index].hp}\tShield: ${alien[index].shield}`
                            }
                            alienAccuracy = interaction.client.random(player[0].info.userStats.minimumAccuracyAlien, 100);
                            if (alienAccuracy > 65) {
                                alienHullDamage = ~~(alienHullDamage * alienAccuracy / 100)
                                alienMessage += `**Total Damage Dealt: __${alienHullDamage}__**`;

                                if (player[0].info.userStats.shield > 0) {
                                    alienShieldDamage = ~~(alienHullDamage * (player[0].info.userStats.absorption - alien[0].penetration));
                                    if (player[0].info.userStats.shield <= alienShieldDamage) {
                                        player[0].info.userStats.shield = 0;
                                        player[0].info.userStats.hp -= alienHullDamage - player[0].info.userStats.shield;
                                    }
                                    else {
                                        player[0].info.userStats.shield -= alienShieldDamage;
                                        player[0].info.userStats.hp -= alienHullDamage - alienShieldDamage;
                                    }
                                }
                                else {
                                    player[0].info.userStats.shield = 0;
                                    player[0].info.userStats.hp -= alienHullDamage;
                                }
                            }
                            else {
                                alienHullDamage = "MISS";
                                alienMessage += `**Total Damage Dealt: __MISS__**`;
                            }
                            message = `**User Info**:\n**`;
                            frontEmoji = `<:aim:902625135050235994>`;
                            log += `*${escapeTurns} turns till escape*`;
                            for (let index in player) {
                                message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`;
                                frontEmoji = `<:Transparent:902212836770598922>`;
                                log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`;
                            }
                            log += "Total Damage Dealt: 0"
                                + alienInfo
                                + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

                            message += "\nAlien Info**:\n<:Transparent:902212836770598922>" + alienMessage;

                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**${escapeTurns} turns till escape**`)] });
                            if (player[0].info.userStats.hp <= 0) {
                                player[0].info.userStats.hp = 0;
                                await player[0].update();
                                player.shift();
                            }
                            await interaction.client.wait(1500);
                        }
                        if (player.length > 0) {
                            for (let index in player)
                                await player[index].update();
                            log += `*ESCAPE SUCCESSFUL!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";
                            await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE SUCCESSFUL!**`)], components: [download] });
                        }
                        else {
                            player[0].info.userStats.hp = 0;
                            await player[0].update();
                            log += `*ESCAPE FAILED!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";

                            await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**ESCAPE FAILED!**`)], components: [download] });
                        }
                        await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                        return;
                    }
                    if (next && alien.length > 0) {
                        next = false;
                        storedAlien = alien[0];
                        alien.shift();
                        alien.push(storedAlien);
                        await player[0].info.reloadammo();
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping target alien...**", "")], components: [] });
                        await interaction.client.wait(1000);
                        alienMessage = "";
                        for (let index in alien) {
                            alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                        }
                        message = `**User Info**:\n**`;
                        frontEmoji = `<:aim:902625135050235994>`;
                        for (let index in player) {
                            message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[0].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[0].info.userStats.shield}\n`;
                            frontEmoji = `<:Transparent:902212836770598922>`;
                        }
                        message += "\nAlien Info**:\n<:aim:902625135050235994>" + alienMessage;
                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed aimed alien**`)], components: [teamRunRow] });
                        await interaction.client.wait(1500);
                    }
                    if (swapping && player.length > 0) {
                        swapping = false
                        if (swappingCounter > 3) {
                            swappingCounter = 0;
                            storedAlien = player[0];
                            player.shift();
                            player.push(storedAlien);
                            //await player[0].info.reloadammo();
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed("**Swapping lead operator...**", "")], components: [] });
                            await interaction.client.wait(1000);
                            alienMessage = "";
                            for (let index in alien) {
                                alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                            }
                            message = `**User Info**:\n`;
                            frontEmoji = `<:aim:902625135050235994>`;
                            for (let index in player) {
                                message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}[${player[index].info.userStats.shipEmoji}]** <a:hp:896118360125870170>: **${player[0].info.userStats.hp}**\t<a:sd:896118359966511104>: **${player[0].info.userStats.shield}**\n`;
                                frontEmoji = `<:Transparent:902212836770598922>`;
                            }
                            message += "\n**Alien Info**:\n<:aim:902625135050235994>" + alienMessage;
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**Changed lead operator**`)], components: [teamRunRow] });
                            await interaction.client.wait(1500);
                        }
                        else {
                            await interaction.followUp({ embeds: [interaction.client.blueEmbed(`You can change lead operator again after ${4 - swappingCounter} turns!`, `**ERROR!**`)] });
                        }
                    }
                    alienHullDamage = 0;
                    alienShieldDamage = 0;
                    threshold = 100 / alien[0].maxHP * alien[0].hp + 100 / alien[0].maxShield * alien[0].shield;
                    shieldAbsorption = 0;
                    playerShieldAbsorption = 0;
                    totalShieldAbsorption = 0;
                    hullDamage = 0;
                    shieldDamage = 0;
                    total = 0;
                    if (alien[0].maxHP + alien[0].maxShield > 9500)
                        canHellstorm = true;
                    else
                        canHellstorm = false;
                    for (let index in player) {
                        await player[index].info.ammunition(threshold, canHellstorm);
                        shieldAbsorption += player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage;
                        hullDamage += (player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage) * interaction.client.random(player[index].info.userStats.minimumAccuracyUser, 100) / 100;
                        total += player[index].info.laser.damage + player[index].info.hellstorm.damage + player[index].info.missile.damage;
                    }
                    hullDamage = ~~hullDamage;
                    totalShieldAbsorption = shieldAbsorption;
                    if (alien[0].shield <= shieldAbsorption) {
                        //playerList[0].info.userStats.shield += alien[0].shield;
                        shieldAbsorption = alien[0].shield;
                        alien[0].shield = 0;
                    }
                    else if (alien[0].shield > shieldAbsorption) {
                        //playerList[0].info.userStats.shield += shieldAbsorption;
                        alien[0].shield -= shieldAbsorption;
                        shieldDamage = ~~(hullDamage * (alien[0].absorption - player[0].info.userStats.penetration));
                        if (alien[0].shield < shieldDamage) {
                            shieldDamage = alien[0].shield;
                            alien[0].shield = 0;
                        }
                        else {
                            alien[0].shield -= shieldDamage;
                        }
                        hullDamage -= shieldDamage;
                    }

                    shieldDamage += shieldAbsorption;
                    actualTotal = hullDamage + shieldDamage;
                    total += shieldAbsorption;


                    if (alien[0].hp > hullDamage) {
                        alien[0].hp -= hullDamage;
                    }
                    else {
                        hullDamage = alien[0].hp;
                        alien[0].hp = 0;
                        alien[0].damage = 0;
                        for (let index in player) {
                            player[index].aliensKilled += 1;
                            await player[index].mission.isCompleted(alien[0].name, serverSettings)

                            player[index].reward.exp += alien[0].exp / numberOfPlayers;
                            player[index].reward.honor += alien[0].honor / numberOfPlayers;
                            player[index].reward.credit += alien[0].credit / numberOfPlayers;
                            player[index].reward.units += alien[0].units / numberOfPlayers;
                            await player[index].info.reloadammo();
                        }
                        if (player[0].cargo.storage < player[0].info.userStats.maxCargo)
                            player[0].cargo.resources = alien[0].resources.map(function (num, idx) {
                                player[0].cargo.storage += num;
                                resources[idx] += num;
                                return num + player[0].cargo.resources[idx];
                            });
                    }

                    alienMessage = "";
                    alienInfo = "\n\nAlien Info:";
                    for (let index in alien) {
                        alienHullDamage += alien[index].damage;
                        alienMessage += `**${alien[index].name}**\n<:Transparent:902212836770598922>**[${alien[index].emoji}]** <a:hp:896118360125870170>: **${alien[index].hp}**\t<a:sd:896118359966511104>: **${alien[index].shield}**\n<:Transparent:902212836770598922>`;
                        alienInfo += `\n${alien[index].name} HP: ${alien[index].hp}\tShield: ${alien[index].shield}`
                    }
                    alienAccuracy = interaction.client.random(player[0].info.userStats.minimumAccuracyAlien, 100);
                    if (alienAccuracy > 60) {
                        alienHullDamage = ~~(alienHullDamage * alienAccuracy / 100)
                        if (alienHullDamage > 0) {
                            alienMessage += `**Total Damage Dealt: __${alienHullDamage}__**`;
                            if (player[0].info.userStats.shield > 0) {
                                alienShieldDamage = ~~(alienHullDamage * (player[0].info.userStats.absorption - alien[0].penetration));
                                if (player[0].info.userStats.shield <= alienShieldDamage) {
                                    player[0].info.userStats.shield = 0;
                                    player[0].info.userStats.hp -= alienHullDamage - player[0].info.userStats.shield;
                                }
                                else {
                                    player[0].info.userStats.shield -= alienShieldDamage;
                                    player[0].info.userStats.hp -= alienHullDamage - alienShieldDamage;
                                }
                            }
                            else {
                                player[0].info.userStats.shield = 0;
                                player[0].info.userStats.hp -= alienHullDamage;
                            }
                        }
                        else {
                            alienMessage += `**Total Damage Dealt: __MISS__**`;
                            alienHullDamage = "MISS";
                        }
                    }
                    else {
                        alienHullDamage = "MISS";
                        alienMessage += `**Total Damage Dealt: __MISS__**`;
                    }
                    if (player[0].info.userStats.hp <= 0) {
                        if (player.length == 1) {
                            player[0].info.userStats.hp = 0;
                            await player[0].update();
                            log += `*DEFEAT!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

                            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}` + " \`\`\`";
                            await interaction.editReply({ embeds: [interaction.client.redEmbed(message, `**DEFEAT!**`)], components: [download] });
                            await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
                            return;
                        }
                        else {
                            player[0].info.userStats.hp = 0;
                            await player[0].update();
                            player.shift();
                        }
                    }

                    if (shieldAbsorption > 0) {
                        message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                        frontEmoji = `<:aim:902625135050235994>`;
                        log += `*Turn ${turnCounter}*\n`;

                        for (let index in player) {
                            playerShieldAbsorption = ~~(shieldAbsorption / totalShieldAbsorption * (player[index].info.laser.shieldDamage + player[index].info.hellstorm.shieldDamage));
                            if (playerShieldAbsorption) {
                                message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                    + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}<a:Absorb:949004754678341633>${playerShieldAbsorption}\n`
                                    + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                frontEmoji = `<:Transparent:902212836770598922>`;
                                player[index].info.userStats.shield += playerShieldAbsorption;

                                if (player[index].info.userStats.shield > player[index].info.userStats.maxShield)
                                    player[index].info.userStats.shield = player[index].info.userStats.maxShield;

                                log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                    + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                    + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                    + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]`
                                    + `\n+ ${playerShieldAbsorption} Shield Absorbed\n`
                            }
                            else {
                                message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                    + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                    + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                                frontEmoji = `<:Transparent:902212836770598922>`;

                                log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                    + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                    + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                    + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;
                            }
                        }
                        log += `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                        log += alienInfo;
                        message += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                        log += `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                    }
                    else {
                        message = `*Turn* ***${turnCounter}***\n**User Info**:\n**`;
                        frontEmoji = `<:aim:902625135050235994>`;
                        log += `*Turn ${turnCounter}*\n`;
                        for (let index in player) {
                            message += `<:Transparent:902212836770598922>${player[index].username} [${player[index].info.userStats.shipModel}]\n${frontEmoji}`
                                + `[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}\n`
                                + `<:Transparent:902212836770598922>[ L : ${player[index].info.laser.name} | M : ${player[index].info.missile.name} | H : ${player[index].info.hellstorm.name} ]\n`;
                            frontEmoji = `<:Transparent:902212836770598922>`;

                            log += `Player ${player[index].username} : \nHP: ${player[index].info.userStats.hp}\tShield: ${player[index].info.userStats.shield}`

                                + `\n[Laser Damage (${player[index].info.laser.name}): ${~~(actualTotal / total * (player[index].info.laser.damage + player[index].info.laser.shieldDamage))}]`
                                + `\n[Missile Damage (${player[index].info.missile.name}): ${~~(actualTotal / total * player[index].info.missile.damage)}]`
                                + `\n[Hellstorm Damage (${player[index].info.hellstorm.name}): ${~~(actualTotal / total * (player[index].info.hellstorm.damage + player[index].info.hellstorm.shieldDamage))}]\n`;

                        }
                        log += `\nTotal Damage Dealt: [HP: ${hullDamage} SHIELD: ${shieldDamage}]`
                        log += alienInfo;
                        message += `<:Transparent:902212836770598922>Total Damage Dealt: [<a:hp:896118360125870170>**:**__${hullDamage}__ <a:sd:896118359966511104>**:**__${shieldDamage}__]**\n`;

                        log += `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                    }

                    message += "\n**Alien Info**:\n<:aim:902625135050235994>" + alienMessage;

                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**In Combat with ->|${alien[0].name}|<-**`)] });
                    await interaction.client.wait(1200);

                    newAlienChance = 100 / (alien[0].maxHP + alien[0].maxShield) * player[0].info.laser.damage - (turnCounter - 1) * 20;
                    if (newAlienChance < 7 && turnCounter <= 7)
                        newAlienChance = 0.003 * player[0].info.laser.damage;
                    if (interaction.client.random(0, 100) <= newAlienChance) {
                        newAlien = await getAlien(aliens);
                        alien.push(newAlien);
                        log += "NEW ALIEN ENCOUNTERED !!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                        await interaction.editReply({ embeds: [interaction.client.yellowEmbed("\`\`\`json\n\"NEW ALIEN ENCOUNTERED !!!\"\n\`\`\`")], components: [] });
                        await interaction.client.wait(1500);

                        message = `**User Info**:\n`;
                        frontEmoji = `<:aim:902625135050235994>`;
                        for (let index in player) {
                            message += `<:Transparent:902212836770598922>**${player[index].username}\n${frontEmoji}[${player[index].info.userStats.shipEmoji}] <a:hp:896118360125870170>: ${player[index].info.userStats.hp}\t<a:sd:896118359966511104>: ${player[index].info.userStats.shield}**\n`;
                            frontEmoji = `<:Transparent:902212836770598922>`;
                        }
                        message += "\n**Alien Info:**\n<:aim:902625135050235994>" + alienMessage.split("**Total")[0]
                            + `**[${newAlien.emoji}] <a:hp:896118360125870170>: ${newAlien.hp}\t<a:sd:896118359966511104>: ${newAlien.shield}**`;

                        await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, `**->|${newAlien.name}|<- joined the fight!**`)], components: [teamRunRow] });
                        await interaction.client.wait(1500);
                    }

                    if (alien[0].hp <= 0)
                        alien.shift();
                    turnCounter++;

                    if (hullDamage + shieldDamage + shieldAbsorption <= 0) {
                        noDamage++;
                        if (noDamage == 6) {
                            await interaction.editReply({ embeds: [interaction.client.blueEmbed("**No usable ammonitions found!**", `**Ammo deplenished!!**`)] });
                            await interaction.client.wait(1200);
                            log += "Run out of usable ammunition!!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                            run = true;
                        }
                    }
                    else
                        noDamage = 0;

                }
            }
            for (let index in player)
                await player[index].update();
            log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` /*+ player[0].info.messageAmmo*/
                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

            message = `**Battle ended after ${turnCounter} turns**\n` + /*"\n\`\`\`diff\n" + player[0].info.messageAmmo + " \`\`\`" +*/ "\`\`\`yaml\n" +
                `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;
            log += `\n---------------------`;
            message += `\n---------------------`;
            for (let item in resources) {
                if (resources[item] > 0) {
                    log += `\n${resourcesName[item]}:  ${resources[item]}`;
                    message += `\n${resourcesName[item]}:  ${resources[item]}`;
                }
            }
            message += " \`\`\`";
            await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, `**VICTORY!**`)], components: [download] });
            await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
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

async function getAlien(aliens, addition = 0) {
    let indexList = [];
    let index = 0;
    for (index; index < aliens.length; index++)
        indexList = indexList.concat(Array(aliens[index].encounter_chance).fill(index));
    indexList = indexList.sort(() => Math.random() - 0.5);
    index = indexList[~~(Math.random() * (100 + addition * 40))];
    // temp
    if (index > aliens.length - 1) {
        index = 0;
    }
    //await errorLog.custom1({ error: JSON.stringify(aliens[index]) + " - " + aliens[index].alien_name + " - " + JSON.stringify(aliens) });
    return {
        name: aliens[index].alien_name,
        damage: aliens[index].damage,
        hp: aliens[index].alien_hp,
        maxHP: aliens[index].alien_hp,
        shield: aliens[index].alien_shield,
        maxShield: aliens[index].alien_shield,
        speed: aliens[index].alien_speed,
        penetration: aliens[index].alien_penetration / 100,
        absorption: aliens[index].shield_absorption_rate / 100,
        credit: aliens[index].credit,
        units: aliens[index].units,
        exp: aliens[index].exp_reward,
        honor: aliens[index].honor,
        resources: aliens[index].resources.split("; ").map(Number),
        emoji: aliens[index].emoji_id
    }
}

const runRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("Run")
            .setLabel("ESCAPE")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("NextAlien")
            .setLabel("NEXT")
            .setStyle("PRIMARY"),
    );

const attackRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("Atk")
            .setLabel("ATK")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("RunAtk")
            .setLabel("ESCAPE")
            .setStyle("DANGER"),
    );


const teamRunRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("Run")
            .setLabel("ESCAPE")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("NextAlien")
            .setLabel("NEXT")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("Swap")
            .setLabel("SWAP")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("Join")
            .setLabel("JOIN")
            .setStyle("SUCCESS"),
    );

const teamRunRowEnemy = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("RunEnemy")
            .setLabel("ESCAPE")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("NextAlienEnemy")
            .setLabel("NEXT")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("SwapEnemy")
            .setLabel("SWAP")
            .setStyle("PRIMARY"),
        new MessageButton()
            .setCustomId("JoinEnemy")
            .setLabel("JOIN")
            .setStyle("SUCCESS"),
    );

const download = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('download')
            //.setLabel('Ending')
            .setEmoji('887979579619295284')
            .setStyle('SUCCESS'),
    );

async function missionHandler(interaction, aliens, id, boost, serverSettings) {
    let killedAliens = aliens.reduce((acc, curr) => (acc[curr] = 0, acc), {});
    let missionTask = 0;
    let missionTaskLeft = 0;
    let reward = 0;
    let total = 0;
    let mission = await interaction.client.databaseSelectData("SELECT * FROM user_missions INNER JOIN missions ON user_missions.mission_id = missions.mission_id WHERE user_missions.user_id = ? AND user_missions.mission_status = 'active'", [interaction.user.id]);
    let initialTotal = 0;
    mission = mission[0];
    if (typeof mission !== 'undefined') {
        if (mission.map_id != 0 && mission.map_id != id)
            mission = false;
        else {
            id = mission.id
            missionTask = mission.mission_task.split(";");
            missionTaskLeft = mission.mission_task_left.split(";").map(Number);
            missionTaskLeft.push(0);
            for (let index in missionTask) {
                total += missionTaskLeft[index];
            }
            if (missionTask.some(r => aliens.includes(r))) {
                reward = { credit: mission.mission_reward_credit, units: mission.mission_reward_units, exp: mission.mission_reward_exp, honor: mission.mission_reward_honor };
                if (mission.mission_limit > 0) {
                    let missionEndTime = Date.parse(mission.mission_started_at) + (mission.mission_limit * 60 * 60 * 1000);
                    let currentTime = new Date().getTime();
                    let distance = missionEndTime - currentTime;
                    mission = true;
                    if (distance < 0) {
                        await interaction.client.databaseEditData(`update user_missions set mission_status = ? where id = ?`, ["expired", id])
                        mission = false;
                    }
                }
                else
                    mission = true;
            }
            else
                mission = false;
        }
        initialTotal = total;
    }
    return {
        active: mission,
        reward: { credit: 0, units: 0, exp: 0, honor: 0 },
        isCompleted: async function (alien, serverSettings) {
            killedAliens[alien]++;
            if (mission) {
                let index = missionTask.indexOf(alien);
                if (missionTaskLeft[index]) {
                    total -= 1;
                    missionTaskLeft[index] -= 1;
                }
                else
                    return false;
                if (total == 0) {
                    mission = false;

                    await interaction.client.databaseEditData(`update user_missions set mission_status = ?, mission_task_left = ? where id = ?`, ["completed", "0", id])
                    this.reward = reward;

                    let messageReward = "\`\`\`yaml\n";
                    if (boost.honor && boost.exp)
                        messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp} + [${~~(reward.exp * 0.1)}]\nHonor         :  ${reward.honor} + [${~~(reward.honor * 0.1)}]` + " \`\`\`";
                    else if (boost.honor)
                        messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp}\nHonor         :  ${reward.honor} + [${~~(reward.honor * 0.1)}]` + " \`\`\`";
                    else if (boost.exp)
                        messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp} + [${~~(reward.exp * 0.1)}]\nHonor         :  ${reward.honor}` + " \`\`\`";
                    else
                        messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp}\nHonor         :  ${reward.honor}` + " \`\`\`";

                    await interaction.followUp({ embeds: [interaction.client.yellowEmbedImage(messageReward, interaction.client.getWordLanguage(serverSettings.lang, "mission_completed"), interaction.user)], ephemeral: true });
                    return true;
                }
            }
            return false;
        },
        update: async function () {
            let querry = "UPDATE user_log SET";
            for (const [key, value] of Object.entries(killedAliens)) {
                querry += ` ${key} = ${key} + ${value},`
            }
            querry = querry.replace(/Boss /g, "Boss_");
            querry = querry.slice(0, -1) + ` WHERE user_id = ${interaction.user.id}`;
            await interaction.client.databaseEditData(querry, []);
            if (mission) {
                if (initialTotal > total) {
                    missionTaskLeft.pop();
                    missionTaskLeft = missionTaskLeft.join(';');
                    await interaction.client.databaseEditData("UPDATE user_missions SET mission_task_left = ? WHERE id = ?", [missionTaskLeft, id]);
                    return true;
                }
            }
            return false;
        }
    }

}

async function infoHandler(interaction, alienSpeed, mapID, pvpSetting, enemyUser) {
    let userInfo = await interaction.client.getUserAccount(interaction.user.id);
    if (userInfo.user_hp == 0) {
        await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`Please **repair** ship before hunting`, "Ship destroyed!", interaction.user)], ephemeral: true });
        return { canHunt: false };
    }
    if (userInfo.in_hunt == 1 && !enemyUser) {
        await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`You are already in a battle`, "Battle in progress...", interaction.user)], ephemeral: true });
        return { canHunt: false };
    }

    let userCd = await interaction.client.databaseSelectData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
    if (~~((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
        await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [interaction.user.id]);
        userInfo.map_id = userInfo.next_map_id;
    }
    if (userInfo.map_id != mapID) {
        await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`You are not in the same **map**`, "Error!", interaction.user)] });
        return { canHunt: false };
    }

    if (!enemyUser)
        userInfo.user_hp = Math.trunc(userInfo.user_hp + userInfo.repair_rate * (Date.now() - Date.parse(userCd[0].last_repair)) / 60000)
    if (userInfo.user_hp > userInfo.max_hp)
        userInfo.user_hp = userInfo.max_hp;

    let ship = await interaction.client.databaseSelectData("SELECT ship_emoji, ship_model, durability FROM user_ships WHERE user_id = ? AND equipped = 1", [interaction.user.id]);
    ship = ship[0];
    let mapIDFrist = userInfo.map_id / 10;
    let mapIDSecond = ~~((mapIDFrist % 1.0) * 10);
    mapIDFrist = ~~mapIDFrist;

    let x = 0.14 * (userInfo.user_speed - alienSpeed);
    x = ~~x;
    let minimumAccuracyAlien = 50 - x;
    let minimumAccuracyUser = 50 + x;

    if (minimumAccuracyUser < 5)
        minimumAccuracyUser = 5;
    if (minimumAccuracyAlien < 5)
        minimumAccuracyAlien = 5;
    if (minimumAccuracyUser > 95)
        minimumAccuracyUser = 95;
    if (minimumAccuracyAlien > 95)
        minimumAccuracyAlien = 95;

    let expRequirement = await interaction.client.databaseSelectData("SELECT exp_to_lvl_up FROM level WHERE level = ?", [userInfo.level]);

    let userStats = {
        currentChannelID: userInfo.channel_id,
        laserDamage: userInfo.user_damage,
        hp: userInfo.user_hp,
        maxHP: userInfo.max_hp,
        maxShield: userInfo.max_shield,
        shield: userInfo.user_shield,
        speed: userInfo.user_speed,
        penetration: userInfo.user_penetration / 100,
        absorption: userInfo.absorption_rate / 100,
        laserQuantity: userInfo.laser_quantity,
        minimumAccuracyUser: minimumAccuracyUser,
        minimumAccuracyAlien: minimumAccuracyAlien,
        currentExp: userInfo.exp,
        expToLvlUp: expRequirement[0].exp_to_lvl_up,
        level: userInfo.level,
        cargo: userInfo.cargo,
        maxCargo: userInfo.max_cargo,
        resources: await userInfo.resources.split("; ").map(Number),
        shipEmoji: ship.ship_emoji,
        shipModel: ship.ship_model,
        firm: userInfo.firm,
        durability: ship.durability
    };
    if (ship.ship_model == "S5") {
        if (mapIDSecond < 5 && ((userInfo.firm == "Luna" && mapIDFrist == 2) || (userInfo.firm == "Terra" && mapIDFrist == 1) || (userInfo.firm == "Marte" && mapIDFrist == 3))) {
            userStats.hp += 60000;
            userStats.laserDamage *= 2;
            userStats.shield *= 2;
            userStats.maxShield *= 2;
        }
    }

    let boost = await interaction.client.databaseSelectData("SELECT * FROM boost WHERE user_id = ?", [interaction.user.id]);

    if (~~((Date.now() - Date.parse(boost[0].hp_boost)) / 1000) < 0)
        userStats.hp = ~~(userStats.hp * 1.1);
    if (~~((Date.now() - Date.parse(boost[0].damage_boost)) / 1000) < 0)
        userStats.laserDamage = ~~(userStats.laserDamage * 1.1);
    if (~~((Date.now() - Date.parse(boost[0].shield_boost)) / 1000) < 0) {
        userStats.shield = ~~(userStats.shield * 1.2);
        userStats.maxShield = ~~(userStats.maxShield * 1.2);
    }

    let expBoost = false;
    let honorBoost = false;
    if (~~((Date.now() - Date.parse(boost[0].exp_boost)) / 1000) < 0)
        expBoost = true;
    if (~~((Date.now() - Date.parse(boost[0].honor_boost)) / 1000) < 0)
        honorBoost = true;
    if (!enemyUser)
        await interaction.client.databaseEditData("UPDATE users SET guild_id = ?, channel_id = ?, in_hunt = 1 WHERE user_id = ?", [interaction.guildId, interaction.channelId, interaction.user.id]);

    let huntConfiguration = 0;
    if (pvpSetting)
        huntConfiguration = await interaction.client.databaseSelectData("SELECT * FROM pvp_configuration WHERE user_id = ?", [interaction.user.id]);
    else
        huntConfiguration = await interaction.client.databaseSelectData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
    huntConfiguration = huntConfiguration[0];
    let ammunition = await interaction.client.databaseSelectData("SELECT * FROM ammunition WHERE user_id = ?", [interaction.user.id]);
    ammunition = ammunition[0];

    let userLaserConfig = [
        { location: 1, threshold: huntConfiguration.x1, damage: userStats.laserDamage, shieldDamage: 0, magazine: ammunition.x1_magazine, name: "x1" },
        { location: 2, threshold: huntConfiguration.x2, damage: 2 * userStats.laserDamage, shieldDamage: 0, magazine: ammunition.x2_magazine, name: "x2" },
        { location: 3, threshold: huntConfiguration.x3, damage: 3 * userStats.laserDamage, shieldDamage: 0, magazine: ammunition.x3_magazine, name: "x3" },
        { location: 4, threshold: huntConfiguration.x4, damage: 4 * userStats.laserDamage, shieldDamage: 0, magazine: ammunition.x4_magazine, name: "x4" },
        { location: 5, threshold: huntConfiguration.xS1, damage: 0, shieldDamage: 2 * userStats.laserDamage, magazine: ammunition.xS1_magazine, name: "xS1" }
    ];
    let userMissileConfig = [
        { location: 1, threshold: huntConfiguration.m1, damage: 1000, magazine: ammunition.m1_magazine, name: "m1" },
        { location: 2, threshold: huntConfiguration.m2, damage: 2000, magazine: ammunition.m2_magazine, name: "m2" },
        { location: 3, threshold: huntConfiguration.m3, damage: 4000, magazine: ammunition.m3_magazine, name: "m3" },
        { location: 4, threshold: huntConfiguration.m4, damage: 6000, magazine: ammunition.m4_magazine, name: "m4" }
    ];
    let userHellstormConfig = [
        { location: 1, threshold: huntConfiguration.h1, damage: 10000, shieldDamage: 0, magazine: ammunition.h1_magazine, name: "h1" },
        { location: 2, threshold: huntConfiguration.h2, damage: 20000, shieldDamage: 0, magazine: ammunition.h2_magazine, name: "h2" },
        { location: 3, threshold: huntConfiguration.hS1, damage: 0, shieldDamage: 12500, magazine: ammunition.hS1_magazine, name: "hS1" },
        { location: 4, threshold: huntConfiguration.hS2, damage: 0, shieldDamage: 25000, magazine: ammunition.hS2_magazine, name: "hS2" }
    ];


    userLaserConfig.push({ location: 0, threshold: -2, damage: 0, shieldDamage: 0, magazine: 1000000, name: "No AMMO" });
    userLaserConfig = userLaserConfig.sort(function (a, b) {
        return a.threshold - b.threshold;
    });
    let laserCounter = userLaserConfig.length - 1;

    userMissileConfig.push({ location: 0, threshold: -2, damage: 0, magazine: 1000000, name: "No AMMO" });
    userMissileConfig = userMissileConfig.sort(function (a, b) {
        return a.threshold - b.threshold;
    });
    let missileCounter = userMissileConfig.length - 1;

    userHellstormConfig.push({ location: 0, threshold: -2, damage: 0, shieldDamage: 0, magazine: 1000000, name: "No AMMO" });
    userHellstormConfig = userHellstormConfig.sort(function (a, b) {
        return a.threshold - b.threshold;
    });
    let hellstormCounter = userHellstormConfig.length - 1;

    if (huntConfiguration.hellstorm == 0 && huntConfiguration.missile == 0) {
        return {
            canHunt: true,
            userStats: userStats,
            boost: { exp: expBoost, honor: honorBoost },
            laser: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
            missile: { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Disabled" },
            hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
            messageAmmo: "",
            reloadammo: async function () {
                laserCounter = userLaserConfig.length - 1;
            },
            ammunition: async function (threshold, canHellstorm) {
                while (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity || threshold <= userLaserConfig[laserCounter].threshold) {
                    if (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity) {
                        this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                        userLaserConfig.unshift(userLaserConfig[laserCounter]);
                        userLaserConfig.splice(laserCounter + 1, 1);
                        continue;
                    }
                    laserCounter -= 1;
                }
                userLaserConfig[laserCounter].magazine -= this.userStats.laserQuantity;
                this.laser = userLaserConfig[laserCounter];
            },
            update: async function () {

                userLaserConfig = userLaserConfig.sort(function (a, b) {
                    return a.location - b.location;
                });

                await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ? WHERE user_id = ?",
                    [ammunition.x1_magazine - userLaserConfig[1].magazine, ammunition.x2_magazine - userLaserConfig[2].magazine, ammunition.x3_magazine - userLaserConfig[3].magazine, ammunition.x4_magazine - userLaserConfig[4].magazine, ammunition.xS1_magazine - userLaserConfig[5].magazine, interaction.user.id]);
            }
        }
    }
    else {
        if (huntConfiguration.hellstorm == 0) {
            return {
                canHunt: true,
                userStats: userStats,
                boost: { exp: expBoost, honor: honorBoost },
                laser: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
                missile: { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Disabled" },
                hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
                messageAmmo: "",
                turn: 6,
                reloadammo: async function () {
                    laserCounter = userLaserConfig.length - 1;
                    missileCounter = userMissileConfig.length - 1;
                },
                ammunition: async function (threshold, canHellstorm) {
                    while (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity) {
                            this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.unshift(userLaserConfig[laserCounter]);
                            userLaserConfig.splice(laserCounter + 1, 1);
                            continue;
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= this.userStats.laserQuantity;
                    this.laser = userLaserConfig[laserCounter];
                    if (!(this.turn % 3)) {
                        while (userMissileConfig[missileCounter].magazine == 0 || threshold <= userMissileConfig[missileCounter].threshold) {
                            if (userMissileConfig[missileCounter].magazine == 0) {
                                this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                                userMissileConfig.unshift(userMissileConfig[missileCounter]);
                                userMissileConfig.splice(missileCounter + 1, 1);
                                continue;
                            }
                            missileCounter -= 1;
                        }
                        userMissileConfig[missileCounter].magazine -= 1;
                        this.missile = userMissileConfig[missileCounter];
                    }
                    else
                        this.missile = { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Reloading" }
                    this.turn += 1;
                },
                update: async function () {

                    userLaserConfig = userLaserConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    userMissileConfig = userMissileConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, m1_magazine = m1_magazine - ?, m2_magazine = m2_magazine - ?, m3_magazine = m3_magazine - ?, m4_magazine = m4_magazine - ? WHERE user_id = ?",
                        [ammunition.x1_magazine - userLaserConfig[1].magazine, ammunition.x2_magazine - userLaserConfig[2].magazine, ammunition.x3_magazine - userLaserConfig[3].magazine, ammunition.x4_magazine - userLaserConfig[4].magazine, ammunition.xS1_magazine - userLaserConfig[5].magazine, ammunition.m1_magazine - userMissileConfig[1].magazine, ammunition.m2_magazine - userMissileConfig[2].magazine, ammunition.m3_magazine - userMissileConfig[3].magazine, ammunition.m4_magazine - userMissileConfig[4].magazine, interaction.user.id]);
                }
            }
        }
        else if (huntConfiguration.missile == 0) {
            return {
                canHunt: true,
                userStats: userStats,
                boost: { exp: expBoost, honor: honorBoost },
                laser: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
                missile: { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Disabled" },
                hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
                messageAmmo: "",
                turn: 6,
                reloadammo: async function () {
                    laserCounter = userLaserConfig.length - 1;
                    hellstormCounter = userHellstormConfig.length - 1;
                },
                ammunition: async function (threshold, canHellstorm) {
                    while (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity) {
                            this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.unshift(userLaserConfig[laserCounter]);
                            userLaserConfig.splice(laserCounter + 1, 1);
                            continue;
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= this.userStats.laserQuantity;
                    this.laser = userLaserConfig[laserCounter];
                    if (!(this.turn % 6) && canHellstorm) {
                        while (userHellstormConfig[hellstormCounter].magazine < 5 || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                            if (userHellstormConfig[hellstormCounter].magazine < 5) {
                                this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                                userHellstormConfig.unshift(userHellstormConfig[hellstormCounter]);
                                userHellstormConfig.splice(hellstormCounter + 1, 1);
                                continue;
                            }
                            hellstormCounter -= 1;
                        }
                        userHellstormConfig[hellstormCounter].magazine -= 5;
                        this.hellstorm = userHellstormConfig[hellstormCounter];
                    }
                    else if (!canHellstorm)
                        this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }
                    else
                        this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Reloading" }
                    this.turn += 1;
                },
                update: async function () {

                    userLaserConfig = userLaserConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    userHellstormConfig = userHellstormConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });

                    await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, h1_magazine = h1_magazine - ?, h2_magazine = h2_magazine - ?, hS1_magazine = hS1_magazine - ?, hS2_magazine = hS2_magazine - ? WHERE user_id = ?",
                        [ammunition.x1_magazine - userLaserConfig[1].magazine, ammunition.x2_magazine - userLaserConfig[2].magazine, ammunition.x3_magazine - userLaserConfig[3].magazine, ammunition.x4_magazine - userLaserConfig[4].magazine, ammunition.xS1_magazine - userLaserConfig[5].magazine, ammunition.h1_magazine - userHellstormConfig[1].magazine, ammunition.h2_magazine - userHellstormConfig[2].magazine, ammunition.hS1_magazine - userHellstormConfig[3].magazine, ammunition.hS2_magazine - userHellstormConfig[4].magazine, interaction.user.id]);
                }
            }
        }
        else return {
            canHunt: true,
            userStats: userStats,
            boost: { exp: expBoost, honor: honorBoost },
            laser: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
            missile: { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Disabled" },
            hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" },
            messageAmmo: "",
            turn: 6,
            reloadammo: async function () {
                laserCounter = userLaserConfig.length - 1;
                missileCounter = userMissileConfig.length - 1;
                hellstormCounter = userHellstormConfig.length - 1;
            },
            ammunition: async function (threshold, canHellstorm) {
                while (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity || threshold <= userLaserConfig[laserCounter].threshold) {
                    if (userLaserConfig[laserCounter].magazine < this.userStats.laserQuantity) {
                        this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                        userLaserConfig.unshift(userLaserConfig[laserCounter]);
                        userLaserConfig.splice(laserCounter + 1, 1);
                        continue;
                    }
                    laserCounter -= 1;
                }
                userLaserConfig[laserCounter].magazine -= this.userStats.laserQuantity;
                this.laser = userLaserConfig[laserCounter];
                if (!(this.turn % 3)) {
                    while (userMissileConfig[missileCounter].magazine == 0 || threshold <= userMissileConfig[missileCounter].threshold) {
                        if (userMissileConfig[missileCounter].magazine == 0) {
                            this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                            userMissileConfig.unshift(userMissileConfig[missileCounter]);
                            userMissileConfig.splice(missileCounter + 1, 1);
                            continue;
                        }
                        missileCounter -= 1;
                    }
                    userMissileConfig[missileCounter].magazine -= 1;
                    this.missile = userMissileConfig[missileCounter];
                }
                else
                    this.missile = { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Reloading" }
                if (!(this.turn % 6) && canHellstorm) {
                    while (userHellstormConfig[hellstormCounter].magazine < 5 || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                        if (userHellstormConfig[hellstormCounter].magazine < 5) {
                            this.messageAmmo += /*${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'-')}'s */ `\n- Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                            userHellstormConfig.unshift(userHellstormConfig[hellstormCounter]);
                            userHellstormConfig.splice(hellstormCounter + 1, 1);
                            continue;
                        }
                        hellstormCounter -= 1;
                    }
                    userHellstormConfig[hellstormCounter].magazine -= 5;
                    this.hellstorm = userHellstormConfig[hellstormCounter];
                }
                else if (!canHellstorm)
                    this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }
                else
                    this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Reloading" }
                this.turn += 1;
            },
            update: async function () {

                userLaserConfig = userLaserConfig.sort(function (a, b) {
                    return a.location - b.location;
                });
                userMissileConfig = userMissileConfig.sort(function (a, b) {
                    return a.location - b.location;
                });
                userHellstormConfig = userHellstormConfig.sort(function (a, b) {
                    return a.location - b.location;
                });

                await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, m1_magazine = m1_magazine - ?, m2_magazine = m2_magazine - ?, m3_magazine = m3_magazine - ?, m4_magazine = m4_magazine - ?, h1_magazine = h1_magazine - ?, h2_magazine = h2_magazine - ?, hS1_magazine = hS1_magazine - ?, hS2_magazine = hS2_magazine - ? WHERE user_id = ?",
                    [ammunition.x1_magazine - userLaserConfig[1].magazine, ammunition.x2_magazine - userLaserConfig[2].magazine, ammunition.x3_magazine - userLaserConfig[3].magazine, ammunition.x4_magazine - userLaserConfig[4].magazine, ammunition.xS1_magazine - userLaserConfig[5].magazine, ammunition.m1_magazine - userMissileConfig[1].magazine, ammunition.m2_magazine - userMissileConfig[2].magazine, ammunition.m3_magazine - userMissileConfig[3].magazine, ammunition.m4_magazine - userMissileConfig[4].magazine, ammunition.h1_magazine - userHellstormConfig[1].magazine, ammunition.h2_magazine - userHellstormConfig[2].magazine, ammunition.hS1_magazine - userHellstormConfig[3].magazine, ammunition.hS2_magazine - userHellstormConfig[4].magazine, interaction.user.id]);
            }
        }
    }
}

async function playerHandler(serverSettings, interaction, aliens, alienSpeed, mapID, pvpSetting = false, enemyUser = false) {
    let playerInfo = await infoHandler(interaction, alienSpeed, mapID, pvpSetting, enemyUser);
    if (playerInfo.canHunt)
        return {
            userID: interaction.user.id,
            username: interaction.user.username,
            active: true,
            aliensKilled: 0,
            mission: await missionHandler(interaction, aliens, mapID, playerInfo.boost, serverSettings),
            info: playerInfo,
            emojiMessage: `**[${playerInfo.userStats.shipEmiji}]** <a:hp:896118360125870170>: **${playerInfo.userStats.hp}**\t<a:sd:896118359966511104>: **${playerInfo.userStats.shield}**\n`,
            reward: { credit: 0, units: 0, exp: 0, honor: 0 },
            cargo: { storage: playerInfo.userStats.cargo, resources: playerInfo.userStats.resources },
            update: async function () {
                this.mission.update();
                this.info.update();
                this.reward.exp += this.mission.reward.exp;
                this.reward.honor += this.mission.reward.honor;
                this.reward.credit += this.mission.reward.credit;
                this.reward.units += this.mission.reward.units;

                this.reward.exp = Math.ceil(this.reward.exp);
                this.reward.honor = Math.ceil(this.reward.honor);
                this.reward.credit = Math.ceil(this.reward.credit);
                this.reward.units = Math.ceil(this.reward.units);

                this.cargo.resources = this.cargo.resources.join("; ")

                await interaction.client.databaseEditData("UPDATE user_cd SET last_repair = ? WHERE user_id = ?", [new Date(), interaction.user.id]);

                let baseMapID = 0;
                if (playerInfo.userStats.firm == "Terra") {
                    baseMapID = 11;
                }
                else if (playerInfo.userStats.firm == "Luna") {
                    baseMapID = 21;
                }
                else {
                    baseMapID = 31;
                }

                if (playerInfo.userStats.hp == 0) {
                    mapID = baseMapID;
                    this.reward.exp = 0;
                    this.reward.honor = 0;
                    this.reward.credit = 0;
                    this.reward.units = 0;
                    await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`Your ship was destroyed in battle!\nYou lost all your cargo and hunt rewards!`, "Ship destroyed!", interaction.user)], ephemeral: true });
                    if (this.info.userStats.expToLvlUp <= this.mission.reward.exp + this.info.userStats.currentExp) {
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, next_map_id = 1, exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, level = level + 1, user_hp = 0, in_hunt = 0, map_id = ?, cargo = 0, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.mission.reward.exp - this.info.userStats.expToLvlUp, this.mission.reward.credit, this.mission.reward.units, this.mission.reward.honor, mapID, "0; 0; 0; 0; 0; 0; 0; 0; 0", 0, interaction.user.id]);
                        await interaction.followUp({ embeds: [interaction.client.greenEmbedImage(`Congratulations! You are now level ${this.info.userStats.level + 1}`, "Levelled UP!", interaction.user)], ephemeral: true });
                    }
                    else
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, next_map_id = 1, exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, in_hunt = 0, map_id = ?, user_hp = 0, cargo = 0, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.mission.reward.exp, this.mission.reward.credit, this.mission.reward.units, this.mission.reward.honor, mapID, "0; 0; 0; 0; 0; 0; 0; 0; 0", 0, interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = 0, durability = 0 WHERE user_id = ? and equipped = 1", [interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_log SET Died = Died + 1 WHERE user_id = ?", [interaction.user.id]);
                }
                else if (playerInfo.userStats.durability == 1) {
                    await interaction.followUp({ embeds: [interaction.client.redEmbedImage(`Your ship durability has reached zero and got destroyed!\nYou have lost all your cargo!`, "Ship destroyed!", interaction.user)], ephemeral: true });
                    if (this.info.userStats.expToLvlUp <= this.reward.exp + this.info.userStats.currentExp) {
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, next_map_id = 1,exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, level = level + 1, user_hp = 0, in_hunt = 0, map_id = ?, cargo = ?, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.reward.exp - this.info.userStats.expToLvlUp, this.reward.credit, this.reward.units, this.reward.honor, baseMapID, 0, "0; 0; 0; 0; 0; 0; 0; 0; 0", this.aliensKilled, interaction.user.id]);
                        await interaction.followUp({ embeds: [interaction.client.greenEmbedImage(`Congratulations! You are now level ${this.info.userStats.level + 1}`, "Levelled UP!", interaction.user)], ephemeral: true });
                    }
                    else
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, next_map_id = 1, exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, user_hp = 0, in_hunt = 0, map_id = ?, cargo = ?, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.reward.exp, this.reward.credit, this.reward.units, this.reward.honor, baseMapID, 0, "0; 0; 0; 0; 0; 0; 0; 0; 0", this.aliensKilled, interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = 0, durability = 0 WHERE user_id = ? and equipped = 1", [interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_log SET Died = Died + 1 WHERE user_id = ?", [interaction.user.id]);
                }
                else {
                    if (this.info.userStats.expToLvlUp <= this.reward.exp + this.info.userStats.currentExp) {
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, level = level + 1, user_hp = ?, in_hunt = 0, map_id = ?, cargo = ?, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.reward.exp - this.info.userStats.expToLvlUp, this.reward.credit, this.reward.units, this.reward.honor, this.info.userStats.hp, mapID, this.cargo.storage, this.cargo.resources, this.aliensKilled, interaction.user.id]);
                        await interaction.followUp({ embeds: [interaction.client.greenEmbedImage(`Congratulations! You are now level ${this.info.userStats.level + 1}`, "Levelled UP!", interaction.user)], ephemeral: true });
                    }
                    else
                        await interaction.client.databaseEditData("UPDATE users SET username = ?, exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, user_hp = ?, in_hunt = 0, map_id = ?, cargo = ?, resources = ?, aliens_killed = aliens_killed + ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), this.reward.exp, this.reward.credit, this.reward.units, this.reward.honor, this.info.userStats.hp, mapID, this.cargo.storage, this.cargo.resources, this.aliensKilled, interaction.user.id]);
                    await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ?, durability = durability - 1 WHERE user_id = ? and equipped = 1", [this.info.userStats.hp, interaction.user.id]);
                }
                if (playerInfo.messageAmmo != "") {
                    await interaction.followUp({ embeds: [interaction.client.redEmbedImage("\n\`\`\`diff\n" + playerInfo.messageAmmo + " \`\`\`", "Restock supplies!", interaction.user)], ephemeral: true });
                }
            }
        }
    return { active: false }
}