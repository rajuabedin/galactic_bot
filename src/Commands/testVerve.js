const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageButton } = require('discord.js');
const resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Gold          "]


module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Verve Testing')
        .addStringOption(option =>
            option.setName('option')
                .setDescription('something')
                .setRequired(true)),

    async execute(interaction, userInfo, serverSettings) {

        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        if (userInfo.tutorial_counter < 6 && userInfo.mission_id == null) {
            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
            return;
        }
        let elapsedTimeFromHunt = await interaction.client.databaseSelcetData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
        elapsedTimeFromHunt = Math.floor((Date.now() - Date.parse(elapsedTimeFromHunt[0].last_hunt)) / 1000);
        if (elapsedTimeFromHunt < 60) {
            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'huntCD').format(60 - elapsedTimeFromHunt), interaction.client.getWordLanguage(serverSettings.lang, 'inCD'))] });
            return;
        }
        let mapId = userInfo.map_id;
        let userCd = await interaction.client.databaseSelcetData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
        if (Math.floor((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
            mapId = userInfo.next_map_id;
            await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [mapId, interaction.user.id]);
        }


        let aliens = 0;
        let huntConfiguration = await interaction.client.databaseSelcetData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
        if (huntConfiguration[0].mothership === 1)
            aliens = await interaction.client.databaseSelcetData("SELECT * FROM aliens WHERE map_id = ?", [mapId]);
        else
            aliens = await interaction.client.databaseSelcetData("SELECT * FROM aliens WHERE map_id = ? and mothership = 0", [mapId]);
        if (typeof aliens[0] === 'undefined') {
            await interaction.reply({ embeds: [interaction.client.redEmbed("**No aliens found**", "ERROR!")] });
            return;
        }
        let aliensName = aliens.map(x => x.alien_name);
        enemyStats = await getAlien(aliens, huntConfiguration[0].mothership);
        for (let index in aliens) {
            if (aliens[index].mothership == 1)
                aliens.splice(index, 1);
        }


        await interaction.reply({ embeds: [interaction.client.blueEmbed("", "Looking for an aliens...")] });
        let turnCounter = 0;
        let players = [await playerHandler(interaction, aliensName, enemyStats.speed, mapId)]
        let runRow = battleButtonHandler();
        
        await interaction.client.wait(1000);
        
        








        let alienStats = alienList[0];
        let accuracyUser = 0;
        let accuracyAlien = 0;
        let hasLaserAmmo = 0;
        let hasMissileAmmo = 0;
        let hasHellstormAmmo = 0;

        let laserShieldAbsorption = 0;
        let laserShieldDamage = 0;
        let laserHpDamage = 0;
        let missileHpDamage = 0;
        let missileShieldDamage = 0;
        let hellstormHpDamage = 0;
        let hellstormShieldDamage = 0;
        let hellstormShieldAbsorption = 0;

        let threshold = 0;
        let new_threshold = 0;
        let chance_to_encounter_new_alien = 0;

        const filter = i => i.message.interaction.id === interaction.id;
        const collectorRun = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });
        collectorRun.on('collect', async i => {
            collectorRun.resetTimer({ time: 25000 });
            await i.deferUpdate();
            await infoHandler(i);

        });
    }
}

async function getAlien(aliens, addition = 0) {
    let indexList = [];
    let index = 0;
    for (index; index < aliens.length; index++) {
            indexList = indexList.concat(Array(aliens[index].encounter_chance).fill(index));
        }
    indexList = indexList.sort(() => Math.random() - 0.5);
    index = indexList[Math.floor(Math.random() * (100 + addition * 40))];
    let resources = aliens[index].resources.split("; ").map(Number);
    return {
        name: aliens[index].alien_name,
        damage: aliens[index].damage,
        hp: aliens[index].alien_hp,
        shield: aliens[index].alien_shield,
        speed: aliens[index].alien_speed,
        penetration: aliens[index].alien_penetration / 100,
        absorption: aliens[index].shield_absorption_rate / 100,
        credit: aliens[index].credit,
        units: aliens[index].units,
        exp: aliens[index].exp_reward,
        honor: aliens[index].honor,
        resources: resources,
        emoji: aliens[index].emoji_id
    }


    async function missionHandler(interaction, aliens, id) {
        let missionTask = 0;
        let missionTaskLeft = 0;
        let reward = 0;
        let total = 0;
        let mission = await interaction.client.databaseSelcetData("SELECT * FROM user_missions INNER JOIN missions ON user_missions.mission_id = missions.mission_id WHERE user_missions.user_id = ? AND user_missions.mission_status = 'active'", [interaction.user.id]);
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
            reward: reward,
            isCompleted: async function (alien, boost) {
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

                        let messageReward = "\`\`\`yaml\n";
                        if (boost.honor && boost.exp)
                            messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp} + [${~~(reward.exp * 0.1)}]\nHonor         :  ${reward.honor} + [${~~(reward.honor * 0.1)}]` + " \`\`\`";
                        else if (boost.honor)
                            messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp}\nHonor         :  ${reward.honor} + [${~~(reward.honor * 0.1)}]` + " \`\`\`";
                        else if (boost.exp)
                            messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp} + [${~~(reward.exp * 0.1)}]\nHonor         :  ${reward.honor}` + " \`\`\`";
                        else
                            messageReward += `Credits       :  ${reward.credit}\nUnits         :  ${reward.units}\nEXP           :  ${reward.exp}\nHonor         :  ${reward.honor}` + " \`\`\`";

                        await interaction.followUp({ embeds: [interaction.client.yellowEmbed(messageReward, "Mission Completed!")] });

                        return true;
                    }
                }
                return false;
            },
            update: async function () {
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

    async function infoHandler(interaction, alienSpeed) {
        let userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (userInfo.user_hp === 0) {
            await interaction.followUp({ embeds: [interaction.client.redEmbed(`Please **repair** ship before hunting`, "Ship destroyed!")] });
            return { canHunt: false };
        }
        if (userInfo.in_hunt === 1) {
            await interaction.followUp({ embeds: [interaction.client.redEmbed(`You are already in a battle`, "Battle in progress...")], ephemeral: true });
            return { canHunt: false };
        }

        let userCd = await interaction.client.databaseSelcetData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
        userInfo.user_hp = ~~(userInfo.user_hp + userInfo.repair_rate * (Date.now() - Date.parse(userCd[0].last_repair)) / 60000)
        if (userInfo.user_hp > userInfo.max_hp)
            userInfo.user_hp = userInfo.max_hp;

        let ship = await interaction.client.databaseSelcetData("SELECT ships_info.emoji_id, user_ships.ship_model FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);
        let mapIDFrist = ~~userInfo.map_id / 10;
        let mapIDSecond = ~~((userInfo.map_id % 1.0) * 10);

        let minimumAccuracyUser = 80;
        let minimumAccuracyAlien = 80;

        if (userInfo.user_speed > alienSpeed) {
            minimumAccuracyUser = 90 - (userInfo.user_speed - alienSpeed) / 5;
            minimumAccuracyAlien = 85 + (alienSpeed - userInfo.user_speed) / 2.5;
        }
        else if (userInfo.user_speed == alienSpeed) {
            minimumAccuracyUser = 80;
            minimumAccuracyAlien = 80;
        }
        else {
            minimumAccuracyUser = 85 + (alienSpeed - userInfo.user_speed) / 2.5;
            minimumAccuracyAlien = 90 - (userInfo.user_speed - alienSpeed) / 5;
        }

        let expRequirement = await interaction.client.databaseSelcetData("SELECT exp_to_lvl_up FROM level WHERE level = ?", [userInfo.level]);

        let userStats = {
            laserDamage: userInfo.user_damage,
            hp: userInfo.user_hp,
            maxShield: userInfo.max_shield,
            shield: userInfo.user_shield,
            speed: userInfo.user_speed,
            penetration: userInfo.user_penetration / 100,
            absorption: userInfo.absorption_rate / 100,
            laserQuantity: userInfo.laser_quantity,
            minimumAccuracyUser: minimumAccuracyUser,
            minimumAccuracyAlien: minimumAccuracyAlien,
            expToLvlUp: expRequirement[0].exp_to_lvl_up,
            shipEmoji: ship.emoji_id
        };

        if (ship.ship_model === "S5") {
            if (mapIDSecond < 5 && ((userInfo.firm === "Luna" && mapIDFrist == 2) || (userInfo.firm === "Terra" && mapIDFrist == 1) || (userInfo.firm === "Marte" && mapIDFrist == 3))) {
                userStats.hp += 60000;
                userStats.laserDamage *= 2;
                userStats.shield *= 2;
                userStats.maxShield *= 2;
            }
        }

        let boost = await interaction.client.databaseSelcetData("SELECT * FROM boost WHERE user_id = ?", [interaction.user.id]);

        if (Math.floor((Date.now() - Date.parse(boost[0].hp_boost)) / 1000) < 0)
            userStats.hp = ~~(userStats.hp * 1.1);
        if (Math.floor((Date.now() - Date.parse(boost[0].damage_boost)) / 1000) < 0)
            userStats.laserDamage = ~~(userStats.laserDamage * 1.1);
        if (Math.floor((Date.now() - Date.parse(boost[0].shield_boost)) / 1000) < 0) {
            userStats.shield = ~~(userStats.shield * 1.2);
            userStats.maxShield = ~~(userStats.maxShield * 1.2);
        }

        let expBoost = false;
        let honorBoost = false;
        if (Math.floor((Date.now() - Date.parse(boost[0].exp_boost)) / 1000) < 0)
            expBoost = true;
        if (Math.floor((Date.now() - Date.parse(boost[0].honor_boost)) / 1000) < 0)
            honorBoost = true;

        await interaction.client.databaseEditData("UPDATE users SET in_hunt = 1 WHERE user_id = ?", [interaction.user.id]);

        let huntConfiguration = await interaction.client.databaseSelcetData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
        huntConfiguration = huntConfiguration[0];
        huntConfiguration.pop();
        let ammunition = await interaction.client.databaseSelcetData("SELECT * FROM ammunition WHERE user_id = ?", [interaction.user.id]);
        ammunition = ammunition[0];
        ammunition.pop();

        let userLaserConfig = [
            { location: 1, threshold: huntConfiguration.x1, damage: 1, shieldDamage: 0, magazine: ~~(ammunition.x1_magazine / userStats.laserQuantity), name: "x1" },
            { location: 2, threshold: huntConfiguration.x2, damage: 2, shieldDamage: 0, magazine: ~~(ammunition.x2_magazine / userStats.laserQuantity), name: "x2" },
            { location: 3, threshold: huntConfiguration.x3, damage: 3, shieldDamage: 0, magazine: ~~(ammunition.x4_magazine / userStats.laserQuantity), name: "x3" },
            { location: 4, threshold: huntConfiguration.x4, damage: 4, shieldDamage: 0, magazine: ~~(ammunition.x4_magazine / userStats.laserQuantity), name: "x4" },
            { location: 5, threshold: huntConfiguration.xS1, damage: 0, shieldDamage: 2, magazine: ~~(ammunition.xS1_magazine / userStats.laserQuantity), name: "xS1" }
        ];
        let userMissileConfig = [
            { location: 1, threshold: huntConfiguration.m1, damage: 1000, magazine: ammunition.m1_magazine, name: "m1" },
            { location: 2, threshold: huntConfiguration.m2, damage: 2000, magazine: ammunition.m2_magazine, name: "m2" },
            { location: 3, threshold: huntConfiguration.m3, damage: 4000, magazine: ammunition.m3_magazine, name: "m3" },
            { location: 4, threshold: huntConfiguration.m4, damage: 6000, magazine: ammunition.m4_magazine, name: "m4" }
        ];
        let userHellstormConfig = [
            { location: 1, threshold: huntConfiguration.h1, damage: 10000, shieldDamage: 0, magazine: ~~(ammunition.h1_magazine / huntConfiguration.helstorm_missiles_number), name: "h1" },
            { location: 2, threshold: huntConfiguration.h2, damage: 20000, shieldDamage: 0, magazine: ~~(ammunition.h2_magazine / huntConfiguration.helstorm_missiles_number), name: "h2" },
            { location: 3, threshold: huntConfiguration.hS1, damage: 0, shieldDamage: 12500, magazine: ~~(ammunition.hS1_magazine / huntConfiguration.helstorm_missiles_number), name: "hS1" },
            { location: 4, threshold: huntConfiguration.hS2, damage: 0, shieldDamage: 25000, magazine: ~~(ammunition.hS2_magazine / huntConfiguration.helstorm_missiles_number), name: "hS2" }
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

        let messageAmmo = "";

        if (huntConfiguration.hellstorm == 0 && huntConfiguration.missile == 0) {
            return {
                canHunt: true,
                userStats: userStats,
                boost: { exp: expBoost, honor: honorBoost },
                ammunition: async function (threshold, turn) {
                    while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (!userLaserConfig[laserCounter].magazine) {
                            messageAmmo += `\n- **${interaction.user.username}**'s Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.splice(laserCounter, 1);
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= 1;
                    return { laser: userLaserConfig[laserCounter], missile: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }, hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }, message: messageAmmo };
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
                    ammunition: async function (threshold, turn) {
                        while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                            if (!userLaserConfig[laserCounter].magazine) {
                                messageAmmo += `\n- **${interaction.user.username}**'s Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                                userLaserConfig.splice(laserCounter, 1);
                            }
                            laserCounter -= 1;
                        }
                        userLaserConfig[laserCounter].magazine -= 1;
                        if (!turn % 3) {
                            while (!userMissileConfig[missileCounter].magazine || threshold <= userMissileConfig[missileCounter].threshold) {
                                if (!userMissileConfig[missileCounter].magazine) {
                                    messageAmmo += `\n- **${interaction.user.username}**'s Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                                    userMissileConfig.splice(missileCounter, 1);
                                }
                                missileCounter -= 1;
                            }
                            userMissileConfig[missileCounter].magazine -= 1;
                        }
                        return { laser: userLaserConfig[laserCounter], missile: userMissileConfig[missileCounter], hellstorm: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }, message: messageAmmo };
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
            if (huntConfiguration.missile == 0) {
                return {
                    canHunt: true,
                    userStats: userStats,
                    boost: { exp: expBoost, honor: honorBoost },
                    ammunition: async function (threshold, turn) {
                        while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                            if (!userLaserConfig[laserCounter].magazine) {
                                messageAmmo += `\n- **${interaction.user.username}**'s Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                                userLaserConfig.splice(laserCounter, 1);
                            }
                            laserCounter -= 1;
                        }
                        userLaserConfig[laserCounter].magazine -= 1;
                        if (!turn % 6) {
                            while (!userHellstormConfig[hellstormCounter].magazine || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                                if (!userHellstormConfig[hellstormCounter].magazine) {
                                    messageAmmo += `\n- **${interaction.user.username}**'s Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                                    userHellstormConfig.splice(hellstormCounter, 1);
                                }
                                hellstormCounter -= 1;
                            }
                            userHellstormConfig[hellstormCounter].magazine -= 1;
                        }
                        return { laser: userLaserConfig[laserCounter], missile: { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Disabled" }, hellstorm: userHellstormConfig[hellstormCounter], message: messageAmmo };
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
            return {
                canHunt: true,
                userStats: userStats,
                boost: { exp: expBoost, honor: honorBoost },
                ammunition: async function (threshold, turn) {
                    while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (!userLaserConfig[laserCounter].magazine) {
                            messageAmmo += `\n- **${interaction.user.username}**'s Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.splice(laserCounter, 1);
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= 1;
                    if (!turn % 3) {
                        while (!userMissileConfig[missileCounter].magazine || threshold <= userMissileConfig[missileCounter].threshold) {
                            if (!userMissileConfig[missileCounter].magazine) {
                                messageAmmo += `\n- **${interaction.user.username}**'s Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                                userMissileConfig.splice(missileCounter, 1);
                            }
                            missileCounter -= 1;
                        }
                        userMissileConfig[missileCounter].magazine -= 1;
                    }
                    if (!turn % 6) {
                        while (!userHellstormConfig[hellstormCounter].magazine || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                            if (!userHellstormConfig[hellstormCounter].magazine) {
                                messageAmmo += `\n- **${interaction.user.username}**'s Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                                userHellstormConfig.splice(hellstormCounter, 1);
                            }
                            hellstormCounter -= 1;
                        }
                        userHellstormConfig[hellstormCounter].magazine -= 1;
                    }
                    return { laser: userLaserConfig[laserCounter], missile: userMissileConfig[missileCounter], hellstorm: userHellstormConfig[hellstormCounter], message: messageAmmo };
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

    async function playerHandler(interaction, aliens, alienSpeed, mapID) {
        let playerInfo = await infoHandler(interaction, alienSpeed);
        if (playerInfo.canHunt)
            return {
                active: true,
                mission: await missionHandler(interaction, aliens, mapID),
                info: playerInfo,
                emojiMessage: `**[${this.info.userStats.shipEmiji}]** <a:hp:896118360125870170>: **${this.info.userStats.hp}**\t<a:sd:896118359966511104>: **${this.info.userStats.shield}**\n`,
                log: "",
                update: async function () {
                    this.mission.update();
                    this.info.update();
                }
            }
        return { active: false }
    }
    const testButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('test')
                .setLabel('TEST')
                .setStyle('PRIMARY'),
        );