const { MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('hunt')
        .setDescription('Hunt Allien!'),

    async execute(interaction, userInfo) {
        try {
        if (userInfo.tutorial_counter < 4) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("**Please finish the tutorial first**")] });
            return;
        }
        let resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Palladium     "]
        let maxCargo = userInfo.max_cargo;
        let cargo = userInfo.cargo;
        let damageDealt = 0;
        let damageReceived = 0;
        let userCd = await interaction.client.databaseSelcetData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
        let mapId = 1;
        if (Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
            mapId = userInfo.next_map_id;
            await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [mapId, interaction.user.id]);
        }
        else
            mapId = userInfo.map_id;

        let aliens = await interaction.client.databaseSelcetData("SELECT * FROM aliens WHERE map_id = ?", [mapId]);

        if (typeof aliens[0] === 'undefined') {
            await interaction.reply({ embeds: [interaction.client.redEmbed("**No aliens found**", "ERROR, unknown map!")] });
            return;
        }

        let elapsedTimeFromHunt = Math.floor((Date.now() - Date.parse(userCd[0].last_hunt)) / 1000);
        if (elapsedTimeFromHunt < 60) {
            await interaction.reply({ embeds: [interaction.client.redEmbed(`Please wait ${60 - elapsedTimeFromHunt} seconds before hunting again`, "Hunt in cooldown")] });
            return;
        }

        const filterRun = iRun => iRun.user.id === interaction.user.id && iRun.message.interaction.id === interaction.id && iRun.customId === "Run";
        const collectorRun = interaction.channel.createMessageComponentCollector({ filterRun, time: 25000 });
        let run = false;
        collectorRun.on('collect', async iRun => {
            run = true;
            iRun.update({ embeds: [interaction.client.blueEmbed("**Initializing escape command...**", `**Loading**`)], components: [] });
            await interaction.client.wait(1000);
            collectorRun.stop();
        });

        let shipEmiji = await interaction.client.databaseSelcetData("SELECT ships_info.emoji_id FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);
        shipEmiji = shipEmiji[0].emoji_id;

        let expRequirement = await interaction.client.databaseSelcetData("SELECT exp_to_lvl_up FROM level WHERE level = ?", [userInfo.level]);
        expRequirement = expRequirement[0].exp_to_lvl_up;
        await interaction.client.databaseEditData("UPDATE user_cd SET last_hunt = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
        let [credit, units, exp_reward, honor, resources] = [0, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0]];
        let huntConfiguration = await interaction.client.databaseSelcetData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
        let ammunition = await interaction.client.databaseSelcetData("SELECT * FROM ammunition WHERE user_id = ?", [interaction.user.id]);
        //let user_ammo = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 25, 15, 5];
        //[a, b, c, d] = [threshold, damage, "shield damage", user_ammo]
        //[a] -3 <= DISABLED, -2 <= NO AMMO, -1 <= ONLY FOR X1, 0 <= USE THAT AMMUNITION TILL ALIEN DIES
        let userLaserConfig = [[huntConfiguration[0].x2, 2, 0, ammunition[0].x2_magazine, "x2"], [huntConfiguration[0].x1, 1, 0, ammunition[0].x1_magazine, "x1"], [huntConfiguration[0].x3, 3, 0, ammunition[0].x4_magazine, "x3"], [huntConfiguration[0].x4, 4, 0, ammunition[0].x4_magazine, "x4"], [huntConfiguration[0].xS1, 0, 2, ammunition[0].xS1_magazine, "xS1"]];
        let userMissileConfig = [[huntConfiguration[0].m1, 1000, ammunition[0].m1_magazine, "m1"], [huntConfiguration[0].m2, 2000, ammunition[0].m2_magazine, "m2"], [huntConfiguration[0].m3, 4000, ammunition[0].m3_magazine, "m3"], [huntConfiguration[0].m4, 6000, ammunition[0].m4_magazine, "m4"]];
        let userHellstormConfig = [[huntConfiguration[0].h1, 2000, 0, ammunition[0].h1_magazine, "h1"], [huntConfiguration[0].h2, 4000, 0, ammunition[0].h2_magazine, "h2"], [huntConfiguration[0].hS1, 0, 2500, ammunition[0].hS1_magazine, "hS1"], [huntConfiguration[0].hS2, 0, 5000, ammunition[0].hS2_magazine, "hS2"]];

        // Damage, HP, Max Shield,  Shield, Speed, Penetration, Shield absorb rate, laser quantity   
        let userHp = Math.trunc(userInfo.user_hp + userInfo.repair_rate * (Date.now() - Date.parse(userCd[0].last_repair)) / 60000)
        if (userHp > userInfo.max_hp)
            userHp = userInfo.max_hp;
        let userStats = [userInfo.user_damage, userHp, userInfo.max_shield, userInfo.user_shield, userInfo.user_speed, userInfo.user_penetration / 100, userInfo.absorption_rate / 100, userInfo.laser_quantity];


        let enemyStats = await getAlien(aliens);//[1500, 10000, 1500, 310, 0, 0.8, "Test"];
        await interaction.reply({ embeds: [interaction.client.blueEmbed("", "Looking for an aliens...")] });
        await interaction.client.wait(1000);
        let alienList = [enemyStats];
        //let message = "**Engaging Combat with XY**";
        let messageDamage = "";
        let message = `\n**Your Info**:\nHP: **${userStats[1]}**\tShield: **${userStats[3]}**`;
        message += `\n**Alien Info**:\nHP: **${enemyStats[1]}**\tShield: **${enemyStats[2]}**`;

        let emojiMessage = `\n**Your Info**:\n**[${shipEmiji}]** <a:hp:896118360125870170>: **${userStats[1]}**\t<a:sd:896118359966511104>: **${userStats[3]}**\n`;
        emojiMessage += `\n**Alien Info**:\n**[${enemyStats[12]}]** <a:hp:896118360125870170>: **${enemyStats[1]}**\t<a:sd:896118359966511104>: **${enemyStats[2]}**`;
        await interaction.editReply({ embeds: [interaction.client.blueEmbed(emojiMessage, `**Engaging Combat with ${enemyStats[6]}**`)], components: [runRow] });
        await interaction.client.wait(1000);

        let logMessage = [[message, `**Engaging Combat with ${enemyStats[6]}**`]];
        let messageAmmo = "";
        userLaserConfig.push([-2, 0, 0, 1000000, "No AMMO"]);
        userLaserConfig = userLaserConfig.sort(function (a, b) {
            return a[0] - b[0];
        });
        let laserCounter = userLaserConfig.length - 1;
        userMissileConfig.push([-2, 0, 100000, "No AMMO"]);
        userMissileConfig = userMissileConfig.sort(function (a, b) {
            return a[0] - b[0];
        });
        let missileCounter = userMissileConfig.length - 1;
        userHellstormConfig.push([-2, 0, 0, 100000, "No AMMO"]);
        userHellstormConfig = userHellstormConfig.sort(function (a, b) {
            return a[0] - b[0];
        });
        let hellstormCounter = userHellstormConfig.length - 1;

        let missileLaunchAfterTurns = 3;
        let laser = userLaserConfig[laserCounter];
        let missile = userMissileConfig[missileCounter];
        let hellstorm = userHellstormConfig[hellstormCounter];
        let turnCounter = 0;

        let canUseHellstorm = true;
        if (huntConfiguration[0].hellstorm == 0) {
            canUseHellstorm = false;
        }
        let canUseMissile = true;
        if (huntConfiguration[0].missile == 0) {
            canUseMissile = false;
        }

        let userMaxShield = userStats[2];
        let alienMaxHp = enemyStats[1];
        let alienMaxShield = enemyStats[2];

        let totalAliensDamage = enemyStats[0];

        if (alienMaxHp + alienMaxShield < 12000 || alienMaxHp / userStats[0] <= 7 || !canUseHellstorm) {
            canUseHellstorm = false;
            hellstorm = [0, 0, 0, 100000, "Disabled"];
        }
        if (!canUseMissile)
            missile = [0, 0, 100000, "Disabled"];
        let minimumAccuracyUser = 80;
        let minimumAccuracyAlien = 80;

        if (userStats[4] > enemyStats[3]) {
            minimumAccuracyUser = 90 - (userStats[4] - enemyStats[3]) / 5;
            minimumAccuracyAlien = 85 + (enemyStats[3] - userStats[4]) / 2.5;
        }
        else if (userStats[4] == enemyStats[3]) {
            minimumAccuracyUser = 80;
            minimumAccuracyAlien = 80;
        }
        else {
            minimumAccuracyUser = 85 + (enemyStats[3] - userStats[4]) / 2.5;
            minimumAccuracyAlien = 90 - (userStats[4] - enemyStats[3]) / 5;
        }
        while (userStats[1] > 0 && alienList.length > 0) {
            if (run)
                break;
            let alienStats = alienList[0];
            let accuracyUser = interaction.client.random(minimumAccuracyUser, 100) / 100;
            let accuracyAlien = interaction.client.random(minimumAccuracyAlien, 100) / 100;
            //await wait(1000);
            turnCounter += 1;
            let hasLaserAmmo = laser[3] / userStats[7] >= 1;
            let hasMissileAmmo = missile[2] / 2 >= 1;
            let hasHellstormAmmo = hellstorm[3] / 5 >= 1;

            let laserShieldAbsorption = 0;
            let laserShieldDamage = 0;
            let laserHpDamage = 0;
            let missileHpDamage = 0;
            let missileShieldDamage = 0;
            let hellstormHpDamage = 0;
            let hellstormShieldDamage = 0;
            let hellstormShieldAbsorption = 0;

            let threshold = 100 / alienMaxHp * alienStats[1] + 100 / alienMaxShield * alienStats[2];

            while (!hasLaserAmmo || threshold <= laser[0]) {
                if (!hasLaserAmmo) {
                    messageAmmo += `\n- Laser (${laser[4]}) out of AMMO`;
                    userLaserConfig.splice(laserCounter, 1);
                }
                laserCounter -= 1;
                laser = userLaserConfig[laserCounter];
                hasLaserAmmo = laser[3] / userStats[7] >= 1;
            }

            if (canUseMissile)
                while (!hasMissileAmmo || threshold <= missile[0]) {
                    if (!hasMissileAmmo) {
                        messageAmmo += `\n- Missile (${missile[3]}) out of AMMO`;
                        userMissileConfig.splice(missileCounter, 1);
                    }
                    missileCounter -= 1;
                    missile = userMissileConfig[missileCounter];
                    hasMissileAmmo = missile[2] >= 1;
                }

            if (canUseHellstorm)
                while (!hasHellstormAmmo || threshold <= hellstorm[0]) {
                    if (!hasHellstormAmmo) {
                        messageAmmo += `\n- Hellstorm (${hellstorm[4]}) out of AMMO`;
                        userHellstormConfig.splice(hellstormCounter, 1);
                    }
                    hellstormCounter -= 1;
                    hellstorm = userHellstormConfig[hellstormCounter];
                    hasHellstormAmmo = hellstorm[3] / 5 >= 1;
                }

            if (alienStats[2] > 0) {
                laser[3] -= userStats[7];
                laserShieldAbsorption = Math.trunc(laser[2] * userStats[0] * accuracyUser);
                laserShieldDamage = Math.trunc((alienStats[5] - userStats[5]) * laser[1] * userStats[0] * accuracyUser);
                laserHpDamage = Math.trunc(laser[1] * userStats[0] * accuracyUser - laserShieldDamage);
                if (alienStats[2] <= laserShieldAbsorption) {
                    userStats[3] += alienStats[2];
                    laserShieldAbsorption = Math.trunc(alienStats[2] * accuracyUser);
                    alienStats[2] = 0;
                    laserHpDamage = laser[1] * userStats[0];
                }
                else {
                    userStats[3] += laserShieldAbsorption;
                    alienStats[2] -= laserShieldAbsorption;
                    if (alienStats[2] <= laserShieldDamage) {
                        laserHpDamage += laserShieldDamage - alienStats[2];
                        laserShieldDamage = alienStats[2] + laserShieldAbsorption;
                        alienStats[2] = 0;
                    }
                    else {
                        alienStats[2] -= laserShieldDamage;
                        laserShieldDamage += laserShieldAbsorption;
                    }
                }
                alienStats[1] -= laserHpDamage;
                messageDamage = `\n\`\`\`ini\n[Laser Damage (${laser[4]}): ${laserHpDamage}/${laserShieldDamage}]`;

                if (turnCounter % missileLaunchAfterTurns == 0 && canUseMissile) {
                    missile[2] -= 1;
                    missileShieldDamage = Math.trunc((alienStats[5] - userStats[5]) * missile[1] * accuracyUser);
                    missileHpDamage = Math.trunc(missile[1] * accuracyUser - missileShieldDamage);
                    if (alienStats[2] <= missileShieldDamage) {
                        missileHpDamage += missileShieldDamage - alienStats[2];
                        missileShieldDamage = alienStats[2];
                        alienStats[2] = 0;
                    }
                    else
                        alienStats[2] -= missileShieldDamage;
                    alienStats[1] -= missileHpDamage;
                    messageDamage += `\n[Missile Damage (${missile[3]}): ${missileHpDamage}/${missileShieldDamage}]`;
                }
                if (canUseHellstorm && turnCounter % 6 == 0) {
                    hellstorm[3] -= huntConfiguration[0].hellstorm;
                    hellstormShieldAbsorption = Math.trunc(hellstorm[2] * accuracyUser * huntConfiguration[0].hellstorm);
                    hellstormShieldDamage = Math.trunc((alienStats[5] - userStats[5]) * hellstorm[1] * accuracyUser * huntConfiguration[0].hellstorm);
                    hellstormHpDamage = Math.trunc(hellstorm[1] * accuracyUser * huntConfiguration[0].hellstorm - hellstormShieldDamage);
                    if (alienStats[2] <= hellstormShieldAbsorption) {
                        userStats[3] += alienStats[2];
                        hellstormShieldAbsorption = alienStats[2];
                        alienStats[2] = 0;
                        hellstormHpDamage = hellstorm[1];
                    }
                    else {
                        userStats[3] += hellstormShieldAbsorption;
                        alienStats[2] -= hellstormShieldAbsorption;
                        if (alienStats[2] <= hellstormShieldDamage) {
                            hellstormHpDamage += hellstormShieldDamage - alienStats[2];
                            hellstormShieldDamage = alienStats[2] + hellstormShieldAbsorption;
                            alienStats[2] = 0;
                        }
                        else {
                            alienStats[2] -= hellstormShieldDamage;
                            hellstormShieldDamage += hellstormShieldAbsorption;
                        }
                    }
                    alienStats[1] -= hellstormHpDamage;
                    messageDamage += `\n[Hellstorm Damage (${hellstorm[4]}): ${hellstormHpDamage}/${hellstormShieldDamage}]`;
                }
            }
            else {
                laser[3] -= userStats[7];
                laserShieldAbsorption = 0;
                laserHpDamage = Math.trunc(laser[1] * userStats[0] * accuracyUser);
                alienStats[1] -= laserHpDamage;
                messageDamage = `\n\`\`\`ini\n[Laser Damage (${laser[4]}): ${laserHpDamage}/0]`;

                if (turnCounter % missileLaunchAfterTurns == 0 && canUseMissile) {
                    missile[2] -= 1;
                    missileHpDamage = Math.trunc(missile[1] * accuracyUser);
                    alienStats[1] -= missileHpDamage;
                    messageDamage += `\n[Missile Damage (${missile[3]}): ${missileHpDamage}/0]`;
                }

                if (turnCounter % 6 == 0 && canUseHellstorm) {
                    hellstorm[3] -= huntConfiguration[0].hellstorm;
                    hellstormShieldAbsorption = 0;
                    hellstormHpDamage = Math.trunc(hellstorm[1] * accuracyUser * huntConfiguration[0].hellstorm);
                    alienStats[1] -= hellstormHpDamage;
                    messageDamage += `\n[Hellstorm Damage (${hellstorm[4]}): ${hellstormHpDamage}/0]`;
                }
            }

            damageDealt += laserShieldDamage + laserHpDamage + missileShieldDamage + missileHpDamage + hellstormHpDamage + hellstormShieldDamage;
            damageReceived += Math.trunc(totalAliensDamage * accuracyAlien);

            let alien_shield_damage = Math.trunc((userStats[6] - alienStats[4]) * totalAliensDamage * accuracyAlien);
            let alien_hp_damage = Math.trunc(totalAliensDamage * accuracyAlien - alien_shield_damage);
            if (userStats[3] <= alien_shield_damage) {
                alien_hp_damage += alien_shield_damage - userStats[3];
                alien_shield_damage = userStats[3];
                userStats[3] = 0;
            }
            else
                userStats[3] -= alien_shield_damage;
            userStats[1] -= alien_hp_damage;
            if (userStats[3] > userMaxShield)
                userStats[3] = userMaxShield;

            if (alienStats[1] <= 0) {
                alienStats[1] = 0;
                totalAliensDamage -= alienStats[0];
                credit += alienStats[7];
                units += alienStats[8];
                exp_reward += alienStats[9];
                honor += alienStats[10];
                let totalResources = alienStats[11].reduce((a, b) => a + b) + resources.reduce((a, b) => a + b) + cargo;
                if (totalResources <= maxCargo) {
                    resources = resources.map(function (num, idx) { return num + alienStats[11][idx]; });
                }
                else {
                    let difference = maxCargo - cargo - resources.reduce((a, b) => a + b);
                    let index = 0;
                    while (difference > 0) {
                        difference -= alienStats[11][index];
                        if (difference >= 0) {
                            resources[index] += alienStats[11][index];
                            index++;
                        }
                        else {
                            resources[index] += difference;
                        }
                    }
                }

                alienList.shift();

                if (alienList.length > 0) {
                    alienMaxHp = alienList[0][1];
                    alienMaxShield = alienList[0][2];

                    laserCounter = userLaserConfig.length - 1;
                    missileCounter = userMissileConfig.length - 1;
                    hellstormCounter = userHellstormConfig.length - 1;
                    laser = userLaserConfig[laserCounter];
                    missile = userMissileConfig[missileCounter];
                    hellstorm = userHellstormConfig[hellstormCounter];

                    if (alienMaxHp + alienMaxShield < 12000 || alienMaxHp / userStats[0] <= 7) {
                        canUseHellstorm = false;
                        hellstorm = [-1, 0, 0, 100000, "Disabled"];
                    }
                    else if (huntConfiguration[0].hellstorm != 0)
                        canUseHellstorm = true;

                    if (userStats[4] > alienStats[3]) {
                        minimumAccuracyUser = 90 - (userStats[4] - alienStats[3]) / 5;
                        minimumAccuracyAlien = 85 + (alienStats[3] - userStats[4]) / 2.5;
                    }
                    else if (userStats[4] == alienStats[3]) {
                        minimumAccuracyUser = 80;
                        minimumAccuracyAlien = 80;
                    }
                    else {
                        minimumAccuracyUser = 85 + (alienStats[3] - userStats[4]) / 2.5;
                        minimumAccuracyAlien = 90 - (userStats[4] - alienStats[3]) / 5;
                    }
                }
            }
            new_threshold = 100 / alienMaxHp * alienStats[1] + 100 / alienMaxShield * alienStats[2];
            let chance_to_encounter_new_alien = (threshold - new_threshold - (turnCounter - 1) * 40) / 2;

            if (chance_to_encounter_new_alien < 10 && turnCounter <= 11)
                chance_to_encounter_new_alien = 10;

            //message = `\n__Turn ${turn_counter}__`;
            message = `\n**Your Info**:\nHP: **${userStats[1]}**\tShield: **${userStats[3]}**`;
            message += `\n**Alien Info**:\nHP: **${alienStats[1]}**\tShield: **${alienStats[2]}**`;

            messageDamage += `\`\`\`**\`\`\`diff\n+ ${laserShieldAbsorption + hellstormShieldAbsorption} Shield Absorbed`;
            messageDamage += `\`\`\`**\`\`\`css\n[Alien Damage: ${alien_hp_damage}/${alien_shield_damage}]\`\`\``;
            logMessage.push([message + messageDamage, `__Turn ${turnCounter}__`]);
            //await interaction.editReply({ embeds: [blueEmbed(message + message_damage, `\n__Turn ${turn_counter}__`)] });

            if (interaction.client.random(1, 95) <= chance_to_encounter_new_alien) {
                await interaction.client.wait(1000);
                if (run)
                    break;
                let newAlien = await getAlien(aliens);
                alienList.push(newAlien.slice());
                totalAliensDamage += newAlien[0];
                await interaction.editReply({ embeds: [interaction.client.yellowEmbed("\`\`\`json\n\"NEW ALIEN ENCOUNTERED !!!\"\n\`\`\`")] });
                logMessage[turnCounter][0] += `\n\`\`\`json\n\"${newAlien[6]} joined the fight !!!\"\n\`\`\``;
                await interaction.client.wait(1000);
                if (run)
                    break;
                if (turnCounter % 6 != 0 && alienList.length > 0) {
                    emojiMessage = `*Turn* ***${turnCounter}***\n**Your Info**:\n**[${shipEmiji}]** <a:hp:896118360125870170>: **${userStats[1]}**\t<a:sd:896118359966511104>: **${userStats[3]}**\n`;
                    emojiMessage += `**Total dealt damage: __${damageDealt}__**\n`;
                    emojiMessage += "\n**Alien Info**:\n";
                    for (index in alienList) {
                        emojiMessage += `**[${alienList[index][12]}]** <a:hp:896118360125870170>: **${alienList[index][1]}**\t<a:sd:896118359966511104>: **${alienList[index][2]}**\n`;
                    }
                    emojiMessage += `**Total received damage: __${damageReceived}__**`;
                    damageReceived = 0;
                    await interaction.editReply({ embeds: [interaction.client.blueEmbed(emojiMessage, `**In Combat with ${alienStats[6]}**`)] });
                    await interaction.client.wait(1000);
                }
                //let message_update = `\n**Your Info**:\nHP: **${userStats[1]}**\tShield: **${userStats[3]}**`;
                //message_update += `\n**Alien Info**:\nHP: **${enemyStats[1]}**\tShield: **${enemyStats[2]}**`;
                //await interaction.editReply({ embeds: [interaction.client.blueEmbed(message_update, "**Engaging Combat with XY**")] });
            }
            if (turnCounter % 6 == 0 && alienList.length > 0) {
                emojiMessage = `*Turn* ***${turnCounter}***\n**Your Info**:\n**[${shipEmiji}]** <a:hp:896118360125870170>: **${userStats[1]}**\t<a:sd:896118359966511104>: **${userStats[3]}**\n`;
                emojiMessage += `**Total dealt damage: __${damageDealt}__**\n`;
                emojiMessage += "\n**Alien Info**:\n";
                for (index in alienList) {
                    emojiMessage += `**[${alienList[index][12]}]** <a:hp:896118360125870170>: **${alienList[index][1]}**\t<a:sd:896118359966511104>: **${alienList[index][2]}**\n`;
                }
                emojiMessage += `**Total received damage: __${damageReceived}__**`;
                damageReceived = 0;
                await interaction.editReply({ embeds: [interaction.client.blueEmbed(emojiMessage, `**In Combat with ${alienStats[6]}**`)] });
                await interaction.client.wait(1000);
            }
        }
        //await wait(1000);
        let messageUserInfo = `**Battle ended after ${turnCounter} turns**\n`;
        messageUserInfo += `**Your Info**:\nHP: **${userStats[1]}**\tShield: **${userStats[3]}**`;
        //await interaction.client.wait(1000 + 5 * turnCounter);
        let messageReward = "\`\`\`yaml\n" + `EXP           :  ${exp_reward}\nCredits       :  ${credit}\nUnits         :  ${units}\nHonor         :  ${honor}`;
        for (item in resources) {
            if (resources[item] > 0)
                messageReward += `\n${resourcesName[item]}:  ${resources[item]}`;
        }
        messageReward += " \`\`\`";
        if (run) {
            let escapeTurns = Math.floor((462 + enemyStats[3]) / userInfo.user_speed * 3);
            let escapeDamage = 0;
            let alienStats = alienList[0];
            while (userStats[1] > 0 && escapeTurns > 0) {
                escapeTurns--;
                turnCounter++;
                let accuracyAlien = interaction.client.random(minimumAccuracyAlien, 100) / 100;
                escapeDamage = Math.trunc(totalAliensDamage * accuracyAlien);

                let alien_shield_damage = Math.trunc((userStats[6] - alienStats[4]) * escapeDamage);
                let alien_hp_damage = Math.trunc(escapeDamage - alien_shield_damage);
                if (userStats[3] <= alien_shield_damage) {
                    alien_hp_damage += alien_shield_damage - userStats[3];
                    alien_shield_damage = userStats[3];
                    userStats[3] = 0;
                }
                else
                    userStats[3] -= alien_shield_damage;
                userStats[1] -= alien_hp_damage;

                let escapeEmojiMessage = `*Turn* ***${turnCounter}***\n**Your Info**:\n**[${shipEmiji}]** <a:hp:896118360125870170>: **${userStats[1]}**\t<a:sd:896118359966511104>: **${userStats[3]}**\n`;
                escapeEmojiMessage += "\n**Alien Info**:\n";
                for (index in alienList) {
                    escapeEmojiMessage += `**[${alienList[index][12]}]** <a:hp:896118360125870170>: **${alienList[index][1]}**\t<a:sd:896118359966511104>: **${alienList[index][2]}**\n`;
                }
                escapeEmojiMessage += `**Total received damage: __${escapeDamage}__**`;
                damageReceived = 0;
                messageUserInfo = `**Battle ended after ${turnCounter} turns**\n`;
                messageUserInfo += `**Your Info**:\nHP: **${userStats[1]}**\tShield: **${userStats[3]}**`;
                await interaction.editReply({ embeds: [interaction.client.redEmbed(escapeEmojiMessage, `**Fleeing...**`)] });
                await interaction.client.wait(1000);
            }
            if (userStats[1] > 0) {
                await interaction.editReply({ embeds: [interaction.client.greenEmbed(messageUserInfo + "\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "ESCAPE SUCCESSFULLY")], components: [row] });
                logMessage.push([messageUserInfo + "\n\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "ESCAPE SUCCESSFULLY"]);
            }
            else {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(messageUserInfo + "\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "ESCAPE FAILED! Ship is destroyed!")], components: [row] });
                logMessage.push([messageUserInfo + "\n\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "ESCAPE FAILED! Ship is destroyed!"]);
            }
        }
        else if (userStats[1] > 0) {
            await interaction.editReply({ embeds: [interaction.client.greenEmbed(messageUserInfo + "\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "VICTORY!")], components: [row] });
            logMessage.push([messageUserInfo + "\n\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "VICTORY!"]);
        }
        else {
            await interaction.editReply({ embeds: [interaction.client.redEmbed(messageUserInfo + "\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "DEFEAT! Ship is destroyed!")], components: [row] });
            logMessage.push([messageUserInfo + "\n\`\`\`diff\n" + messageAmmo + " \`\`\`" + messageReward, "DEFEAT! Ship is destroyed!"]);
        }

        let userResources = await interaction.client.databaseSelcetData("SELECT resources FROM users WHERE user_id = ?", [interaction.user.id]);

        userResources = await userResources[0].resources.split("; ").map(Number);
        resources = resources.map(function (num, idx) { return num + userResources[idx]; });
        cargo = resources.reduce((a, b) => a + b);
        resources = resources.join("; ");

        if ((userInfo.exp + exp_reward) >= expRequirement) {
            await interaction.client.databaseEditData("UPDATE users SET exp = ?, level = level + 1, credit = credit + ?, units = units + ?, honor = honor + ?, user_hp = ?, resources = ?, cargo = ? WHERE user_id = ?", [userInfo.exp + exp_reward - expRequirement, credit, units, honor, userStats[1], resources, cargo, interaction.user.id]);
            logMessage[turnCounter][0] += "\n**YOU LEVELLED UP**";
        }
        else
            await interaction.client.databaseEditData("UPDATE users SET exp = exp + ?, credit = credit + ?, units = units + ?, honor = honor + ?, user_hp = ?, resources = ?, cargo = ? WHERE user_id = ?", [exp_reward, credit, units, honor, userStats[1], resources, cargo, interaction.user.id]);
        await interaction.client.databaseEditData("UPDATE user_cd SET last_repair = ? WHERE user_id = ?", [new Date(), interaction.user.id]);
        await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, m1_magazine = m1_magazine - ?, m2_magazine = m2_magazine - ?, m3_magazine = m3_magazine - ?, m4_magazine = m4_magazine - ?, h1_magazine = h1_magazine - ?, h2_magazine = h2_magazine - ?, hS1_magazine = hS1_magazine - ?, hS2_magazine = hS2_magazine - ? WHERE user_id = ?",
            [ammunition[0].x1_magazine - userLaserConfig[1][3], ammunition[0].x2_magazine - userLaserConfig[2][3], ammunition[0].x3_magazine - userLaserConfig[3][3], ammunition[0].x4_magazine - userLaserConfig[4][3], ammunition[0].xS1_magazine - userLaserConfig[5][3], ammunition[0].m1_magazine - userMissileConfig[1][2], ammunition[0].m2_magazine - userMissileConfig[2][2], ammunition[0].m3_magazine - userMissileConfig[3][2], ammunition[0].m4_magazine - userMissileConfig[4][2], ammunition[0].h1_magazine - userHellstormConfig[1][3], ammunition[0].h2_magazine - userHellstormConfig[2][3], ammunition[0].hS1_magazine - userHellstormConfig[3][3], ammunition[0].hS2_magazine - userHellstormConfig[4][3], interaction.user.id]);
        buttonHandler(interaction, interaction.user.id, logMessage);
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

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('back')
            //.setLabel('Beginning')
            .setEmoji('887811358509379594')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('next')
            //.setLabel('Ending')
            .setEmoji('887811358438064158')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('download')
            //.setLabel('Ending')
            .setEmoji('887979579619295284')
            .setStyle('SUCCESS'),

    );

/*const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('-10')
            //.setLabel('Ending')
            .setEmoji('⏪')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('-5')
            //.setLabel('Beginning')
            .setEmoji('◀️')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('0')
            //.setLabel('Beginning')
            .setEmoji('⏺️')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('+5')
            //.setLabel('Ending')
            .setEmoji('▶️')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('+10')
            //.setLabel('Ending')
            .setEmoji('⏩')
            .setStyle('PRIMARY'),

    );

const row1 = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId('select')
            .setPlaceholder('Select battle turn')
            .addOptions([
                {
                    label: 'Turn 0',
                    description: 'Return to the beginning',
                    value: '0',
                },
                {
                    label: '+ 5 turns',
                    description: 'move forward by 5',
                    value: '+5',
                },
                {
                    label: '+ 10 turns',
                    description: 'move forward by 10',
                    value: '+10',
                },
                {
                    label: '- 10 turns',
                    description: 'move backward by 10',
                    value: '-10',
                },
                {
                    label: '- 5 turns',
                    description: 'move backward by 5',
                    value: '-5',
                },
                {
                    label: 'Battle end',
                    description: 'move to the end of the battle',
                    value: 'end',
                },
            ]),
    )*/


function buttonHandler(interaction, userID, logMessage) {
    let maxIndex = logMessage.length - 1;
    let index = maxIndex;
    let downloaded = false;

    const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        collector.resetTimer({ time: 15000 });
        if (i.customId === 'download') {
            await interaction.editReply({ embeds: [], components: [], files: [`./Last_hunt_log/${userID}.txt`] });
            downloaded = true;
            collector.stop("Download");
        }
        else if (i.customId === 'back') {
            index--;
        }
        else if (i.customId === 'next') {
            index++;
        }
        else {
            await i.update({});
            return;
        }
        if (index < 0) {
            index += maxIndex + 1;
        }
        if (index > maxIndex) {
            index -= maxIndex + 1;
        }
        if (!downloaded) {
            await i.update({ embeds: [interaction.client.blueEmbed(logMessage[index][0], logMessage[index][1])] });
        }
    });

    var fs = require('fs');

    var file = fs.createWriteStream(`./Last_hunt_log/${userID}.txt`);
    file.on('error', function (err) { console.log(`ERROR on creating log FILE for user: ${userID}`) });

    let newLogMessage = logMessage.slice();
    for (index in logMessage) {
        let message1 = logMessage[index][1].replaceAll("*", "").replaceAll("diff", "").replaceAll("`", "").replaceAll("ini", "").replaceAll("json", "").replaceAll("css", "").replaceAll("yaml", "").replaceAll("_", "");
        let message2 = logMessage[index][0].replaceAll("*", "").replaceAll("diff", "").replaceAll("`", "").replaceAll("ini", "").replaceAll("json", "").replaceAll("css", "").replaceAll("yaml", "") + "\n\n----------------------------------\n";
        newLogMessage[index] = [message1, message2];
    }
    newLogMessage.forEach(function (v) { file.write(v.join('\n\n ') + '\n'); });
    file.end();

    collector.on('end', collected => {
        if (!downloaded)
            interaction.editReply({ components: [] })
        //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
    });
}

async function getAlien(aliens) {
    let indexList = [];
    let index = 0;
    for (index; index < aliens.length; index++) {
        indexList = indexList.concat(Array(aliens[index].encounter_chance).fill(index));
    }
    indexList = indexList.sort(() => Math.random() - 0.5)
    index = indexList[Math.floor(Math.random() * (100))];
    let resources = aliens[index].resources.split("; ").map(Number)
    return [aliens[index].damage, aliens[index].alien_hp, aliens[index].alien_shield, aliens[index].alien_speed, aliens[index].alien_penetration / 100, aliens[index].shield_absortion_rate / 100, aliens[index].alien_name, aliens[index].credit, aliens[index].units, aliens[index].exp_reward, aliens[index].honor, resources, aliens[index].emoji_id];
}

const runRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("Run")
            .setLabel("ESCAPE")
            .setStyle("DANGER"),
    );
