const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Gold          "]


module.exports = {
    data: new SlashCommandBuilder()
        .setName('test5')
        .setDescription('Verve Testing'),

    async execute(interaction, userInfo, serverSettings) {

        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        if (userInfo.tutorial_counter < 6 && userInfo.missions_id == null) {
            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
            return;
        }
        let mapId = userInfo.map_id;

        let userResources = await userInfo.resources.split("; ").map(Number);
        let resources = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        let aliens = 0;
        let newAlien = 0;
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
        let alien = [await getAlien(aliens, huntConfiguration[0].mothership)];
        for (let index in aliens) {
            if (aliens[index].mothership == 1)
                aliens.splice(index, 1);
        }


        await interaction.reply({ embeds: [interaction.client.blueEmbed("", "Looking for an aliens...")] });
        await interaction.client.wait(1000);
        let player = [await playerHandler(interaction, aliensName, alien[0].speed, mapId)];
        if (!player[0].active)
            return;
        player[0].log = `Engaging Combat with ->|${alien[0].name}|<-`
            + `\nYour Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
            + `\nAlien Info:\nHP: ${alien[0].hp}\tShield: ${alien[0].shield}\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;

        let shieldDamage = 0;
        let hullDamage = 0;
        let shieldAbsorption = 0;

        let actualTotal = 0;
        let total = 0;

        let turnCounter = 1;
        let threshold = 0;
        let newThreshold = 0;
        let newAlienChance = 0;

        let alienHullDamage = 0;
        let alienShieldDamage = 0;
        let alienInfo = "";

        let huntIndex = 0;
        let aliensKilled = 0;
        let averageAliens = 0;
        let laserUsed = 0;
        let missilesUsed = 0;
        let hellstormUsed = 0;

        let bonusx1 = 0;
        let bonusx2 = 0;
        let bonusx3 = 0;
        let bonusxS1 = 0;
        let bonusCredit = 0;
        let bonusUnits = 0;
        let message = 0;

        for (; huntIndex < 60; huntIndex++) {
            while (player[0].info.userStats.hp > 0 && alien.length > 0) {
                laserUsed++;
                alienHullDamage = 0;
                alienShieldDamage = 0;
                threshold = 100 / alien[0].maxHP * alien[0].hp + 100 / alien[0].maxShield * alien[0].shield;
                await player[0].info.ammunition(threshold, turnCounter);

                shieldAbsorption = player[0].info.laser.shieldDamage + player[0].info.hellstorm.shieldDamage;
                hullDamage = ~~((player[0].info.laser.damage + player[0].info.hellstorm.damage + player[0].info.missile.damage) * interaction.client.random(player[0].info.userStats.minimumAccuracyUser, 100) / 100);

                if (alien[0].shield <= shieldAbsorption) {
                    player[0].info.userStats.shield += alien[0].shield;
                    shieldAbsorption = alien[0].shield;
                }
                else if (alien[0].shield > shieldAbsorption) {
                    player[0].info.userStats.shield += shieldAbsorption;
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

                if (player[0].info.missile.name != 'Disabled')
                    missilesUsed++;
                if (player[0].info.hellstorm.name != 'Disabled')
                    hellstormUsed++;

                if (player[0].info.userStats.shield > player[0].info.userStats.maxShield)
                    player[0].info.userStats.shield = player[0].info.userStats.maxShield;

                if (alien[0].hp > hullDamage) {
                    alien[0].hp -= hullDamage;
                }
                else {
                    player[0].aliensKilled += 1;
                    alien[0].hp = 0;
                    alien[0].damage = 0;
                    aliensKilled++;
                    averageAliens++;

                    player[0].reward.exp += alien[0].exp;
                    player[0].reward.honor += alien[0].honor;
                    player[0].reward.credit += alien[0].credit;
                    player[0].reward.units += alien[0].units;

                    message = `\`\`\`yaml\nTurn Counter : ${turnCounter}\n` +
                        `Aliens Killed : ${aliensKilled}\n` +
                        `Killing streack : ${averageAliens}\n\n` +
                        `Average Alliens Killed : ${aliensKilled / (huntIndex + 1)}\n\n` +
                        `Credit : ${player[0].reward.credit}\n` +
                        `Units : ${player[0].reward.units}\n` +
                        `EXP : ${player[0].reward.exp}\n` +
                        `Honor : ${player[0].reward.honor}\n\n` +
                        `Laser x1 used : ${laserUsed}\n` +
                        `Missile used : ${missilesUsed}\n` +
                        `Hellstorm used : ${hellstormUsed}\n\n` +
                        `Laser x1 ammo : ${player[0].info.laser.magazine}\n` +
                        `Missile m1 ammo : ${player[0].info.missile.magazine}\n` +
                        `Hellstorm h1 ammo : ${player[0].info.hellstorm.magazine}\n\n` +
                        `Bonus Box (x1 ammo) : ${bonusx1}\n` +
                        `Bonus Box (x2 ammo) : ${bonusx2}\n` +
                        `Bonus Box (x3 ammo) : ${bonusx3}\n` +
                        `Bonus Box (xS1 ammo) : ${bonusxS1}\n` +
                        `Bonus Box (Credit) : ${bonusCredit}\n` +
                        `Bonus Box (Units) : ${bonusUnits}\n` +
                        "\n\`\`\`"

                    await interaction.editReply({
                        embeds: [interaction.client.blueEmbed(message, `**Minute ${huntIndex}**`)]
                    });
                    await interaction.client.wait(1700);
                }

                alienInfo = "\n\nAlien Info:";
                for (let index in alien) {
                    alienHullDamage += alien[index].damage;
                    alienInfo += `\n${alien[index].name} HP: ${alien[index].hp}\tShield: ${alien[index].shield}`
                }
                alienHullDamage = ~~(alienHullDamage * interaction.client.random(player[0].info.userStats.minimumAccuracyAlien, 100) / 100)

                if (player[0].info.userStats.shield > 0) {
                    alienShieldDamage = ~~(alienHullDamage * (player[0].info.userStats.absorption - alien[0].penetration));
                    if (player[0].info.userStats.shield <= alienShieldDamage) {
                        player[0].info.userStats.shield = 0;
                    }
                    else {
                        player[0].info.userStats.shield = alienShieldDamage;
                    }
                }

                if (shieldAbsorption > 0) {
                    player[0].log +=
                        `*Turn ${turnCounter}*\n`
                        + `Your Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                        + alienInfo
                        + `\n\n[Laser Damage (${player[0].info.laser.name}): ${~~(actualTotal / total * (player[0].info.laser.damage + player[0].info.laser.shieldDamage))}]`
                        + `\n[Missile Damage (${player[0].info.missile.name}): ${~~(actualTotal / total * player[0].info.missile.damage)}]`
                        + `\n[Hellstorm Damage (${player[0].info.hellstorm.name}): ${~~(actualTotal / total * (player[0].info.hellstorm.damage + player[0].info.hellstorm.shieldDamage))}]`
                        + `\n+ ${shieldAbsorption} Shield Absorbed`
                        + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                }
                else {
                    player[0].log +=
                        `*Turn ${turnCounter}*\n`
                        + `Your Info : \nHP: ${player[0].info.userStats.hp}\tShield: ${player[0].info.userStats.shield}`
                        + alienInfo
                        + `\n\n[Laser Damage (${player[0].info.laser.name}): ${~~(actualTotal / total * (player[0].info.laser.damage + player[0].info.laser.shieldDamage))}]`
                        + `\n[Missile Damage (${player[0].info.missile.name}): ${~~(actualTotal / total * player[0].info.missile.damage)}]`
                        + `\n[Hellstorm Damage (${player[0].info.hellstorm.name}): ${~~(actualTotal / total * (player[0].info.hellstorm.damage + player[0].info.hellstorm.shieldDamage))}]`
                        + `\n[Alien Damage: ${alienHullDamage}]\n\n+++++++++++++++++++++++++++++++++++++\n\n\n`;
                }


                newAlienChance = 100 / (alien[0].maxHP + alien[0].maxShield) * player[0].info.laser.damage - (turnCounter - 1) * 20;
                if (newAlienChance < 15 && turnCounter <= 10)
                    newAlienChance = 0.006*player[0].info.laser.damage;
                newThreshold = interaction.client.random(0, 100);
                if (newThreshold <= newAlienChance) {
                    console.log(`Random Value: ${newThreshold}  ||  Chance: ${newAlienChance}`);
                    newAlien = await getAlien(aliens);
                    alien.push(newAlien);
                    player[0].log += "NEW ALIEN ENCOUNTERED !!!\n\n+++++++++++++++++++++++++++++++++++++\n\n\n";
                    //await interaction.client.wait(1500);
                    //await interaction.client.wait(1500);
                }

                if (alien[0].hp <= 0)
                    alien.shift();

                turnCounter++;

            }

            player[0].log += `*VICTORY!*\nBattle ended after ${turnCounter} turns\n` + player[0].info.messageAmmo
                + `Credits       :  ${player[0].reward.credit}\nUnits         :  ${player[0].reward.units}\nEXP           :  ${player[0].reward.exp}\nHonor         :  ${player[0].reward.honor}`;

            player[0].log += `\n---------------------`;
            player[0].cargo.storage = userInfo.cargo;
            resources = resources.map(function (num, idx) { return num + userResources[idx]; });
            player[0].cargo.resources = resources.join("; ")
            await interaction.client.wait(1000);
            /*await interaction.editReply({
                embeds: [interaction.client.blueEmbed(message, `Wait 50s`)]
            });
            await interaction.client.wait(10000);
            await interaction.editReply({
                embeds: [interaction.client.blueEmbed(message, `Wait 40s`)]
            });
            await interaction.client.wait(10000);
            await interaction.editReply({
                embeds: [interaction.client.blueEmbed(message, `Wait 30s`)]
            });
            await interaction.client.wait(10000);
            await interaction.editReply({
                embeds: [interaction.client.blueEmbed(message, `Wait 20s`)]
            });
            await interaction.client.wait(10000);
            await interaction.editReply({
                embeds: [interaction.client.blueEmbed(message, `Wait 10s`)]
            });
            await interaction.client.wait(10000);*/
            newAlien = await getAlien(aliens);
            alien.push(newAlien);
            averageAliens = 0;
            turnCounter = 1;
            if (huntIndex % 2 === 0) {
                let box = await interaction.client.databaseSelcetData("SELECT * FROM bonus_box", []);
                let indexList = [];
                let index = 0;
                for (index; index < box.length; index++) {
                    indexList = indexList.concat(Array(box[index].chance).fill(index));
                }
                indexList = indexList.sort(() => Math.random() - 0.5)
                index = indexList[Math.floor(Math.random() * (100))];
                if (box[index].column_reward == "x1_magazine") {
                    bonusx1 += box[index].value;
                }
                else if (box[index].column_reward == "x2_magazine") {
                    bonusx2 += box[index].value;
                }
                else if (box[index].column_reward == "x3_magazine") {
                    bonusx3 += box[index].value;
                }
                else if (box[index].column_reward == "xS1_magazine") {
                    bonusxS1 += box[index].value;
                }
                else if (box[index].column_reward == "credit") {
                    bonusCredit += box[index].value;
                }
                else
                    bonusUnits += box[index].value;

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
const download = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('download')
            //.setLabel('Ending')
            .setEmoji('887979579619295284')
            .setStyle('SUCCESS'),
    );

async function missionHandler(interaction, aliens, id, boost) {
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
        reward: { credit: 0, units: 0, exp: 0, honor: 0 },
        isCompleted: async function (alien) {
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

                    await interaction.followUp({ embeds: [interaction.client.yellowEmbedImage(messageReward, "Mission Completed!", interaction.user)] });
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

    let ship = await interaction.client.databaseSelcetData("SELECT ships_info.emoji_id, user_ships.ship_model FROM user_ships INNER JOIN ships_info ON user_ships.ship_model = ships_info.ship_model WHERE  user_ships.user_id = ?", [interaction.user.id]);
    ship = ship[0];
    let mapIDFrist = ~~userInfo.map_id / 10;
    let mapIDSecond = ~~((userInfo.map_id % 1.0) * 10);

    let minimumAccuracyUser = 0;
    let minimumAccuracyAlien = 0;

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
        currentExp: userInfo.exp,
        expToLvlUp: expRequirement[0].exp_to_lvl_up,
        level: userInfo.level,
        cargo: userInfo.cargo,
        resources: userInfo.resources,
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


    let huntConfiguration = await interaction.client.databaseSelcetData("SELECT * FROM hunt_configuration WHERE user_id = ?", [interaction.user.id]);
    huntConfiguration = huntConfiguration[0];
    let ammunition = await interaction.client.databaseSelcetData("SELECT * FROM ammunition WHERE user_id = ?", [interaction.user.id]);
    ammunition = ammunition[0];

    let userLaserConfig = [
        { location: 1, threshold: huntConfiguration.x1, damage: userStats.laserDamage, shieldDamage: 0, magazine: ~~(ammunition.x1_magazine / userStats.laserQuantity), name: "x1" },
        { location: 2, threshold: huntConfiguration.x2, damage: 2 * userStats.laserDamage, shieldDamage: 0, magazine: ~~(ammunition.x2_magazine / userStats.laserQuantity), name: "x2" },
        { location: 3, threshold: huntConfiguration.x3, damage: 3 * userStats.laserDamage, shieldDamage: 0, magazine: ~~(ammunition.x4_magazine / userStats.laserQuantity), name: "x3" },
        { location: 4, threshold: huntConfiguration.x4, damage: 4 * userStats.laserDamage, shieldDamage: 0, magazine: ~~(ammunition.x4_magazine / userStats.laserQuantity), name: "x4" },
        { location: 5, threshold: huntConfiguration.xS1, damage: 0, shieldDamage: 2 * userStats.laserDamage, magazine: ~~(ammunition.xS1_magazine / userStats.laserQuantity), name: "xS1" }
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
            ammunition: async function (threshold, turn) {
                while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                    if (!userLaserConfig[laserCounter].magazine) {
                        this.messageAmmo += /*${interaction.user.username}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                        userLaserConfig.unshift(userLaserConfig[laserCounter]);
                        userLaserConfig.splice(laserCounter + 1, 1);
                    }
                    laserCounter -= 1;
                }
                userLaserConfig[laserCounter].magazine -= 1;
                this.laser = userLaserConfig[laserCounter];
            },
            update: async function () {

                userLaserConfig = userLaserConfig.sort(function (a, b) {
                    return a.location - b.location;
                });

                await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ? WHERE user_id = ?",
                    [ammunition.x1_magazine - userLaserConfig[1].magazine * userStats.laserQuantity, ammunition.x2_magazine - userLaserConfig[2].magazine * userStats.laserQuantity, ammunition.x3_magazine - userLaserConfig[3].magazine * userStats.laserQuantity, ammunition.x4_magazine - userLaserConfig[4].magazine * userStats.laserQuantity, ammunition.xS1_magazine - userLaserConfig[5].magazine * userStats.laserQuantity, interaction.user.id]);
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
                reloadammo: async function () {
                    laserCounter = userLaserConfig.length - 1;
                    missileCounter = userMissileConfig.length - 1;
                },
                ammunition: async function (threshold, turn) {
                    while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (!userLaserConfig[laserCounter].magazine) {
                            this.messageAmmo += /*${interaction.user.username}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.unshift(userLaserConfig[laserCounter]);
                            userLaserConfig.splice(laserCounter + 1, 1);
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= 1;
                    this.laser = userLaserConfig[laserCounter];
                    if (!(turn % 3)) {
                        while (!userMissileConfig[missileCounter].magazine || threshold <= userMissileConfig[missileCounter].threshold) {
                            if (!userMissileConfig[missileCounter].magazine) {
                                this.messageAmmo += /*${interaction.user.username}'s */ `\n- Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                                userMissileConfig.unshift(userMissileConfig[missileCounter]);
                                userMissileConfig.splice(missileCounter + 1, 1);
                            }
                            missileCounter -= 1;
                        }
                        userMissileConfig[missileCounter].magazine -= 1;
                        this.missile = userMissileConfig[missileCounter];
                    }
                    else
                        this.missile = { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Reloading" }
                },
                update: async function () {

                    userLaserConfig = userLaserConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    userMissileConfig = userMissileConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, m1_magazine = m1_magazine - ?, m2_magazine = m2_magazine - ?, m3_magazine = m3_magazine - ?, m4_magazine = m4_magazine - ? WHERE user_id = ?",
                        [ammunition.x1_magazine - userLaserConfig[1].magazine * userStats.laserQuantity, ammunition.x2_magazine - userLaserConfig[2].magazine * userStats.laserQuantity, ammunition.x3_magazine - userLaserConfig[3].magazine * userStats.laserQuantity, ammunition.x4_magazine - userLaserConfig[4].magazine * userStats.laserQuantity, ammunition.xS1_magazine - userLaserConfig[5].magazine * userStats.laserQuantity, ammunition.m1_magazine - userMissileConfig[1].magazine, ammunition.m2_magazine - userMissileConfig[2].magazine, ammunition.m3_magazine - userMissileConfig[3].magazine, ammunition.m4_magazine - userMissileConfig[4].magazine, interaction.user.id]);
                }
            }
        }
        if (huntConfiguration.missile == 0) {
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
                    hellstormCounter = userHellstormConfig.length - 1;
                },
                ammunition: async function (threshold, turn) {
                    while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                        if (!userLaserConfig[laserCounter].magazine) {
                            this.messageAmmo += /*${interaction.user.username}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                            userLaserConfig.unshift(userLaserConfig[laserCounter]);
                            userLaserConfig.splice(laserCounter + 1, 1);
                        }
                        laserCounter -= 1;
                    }
                    userLaserConfig[laserCounter].magazine -= 1;
                    this.laser = userLaserConfig[laserCounter];
                    if (!(turn % 6)) {
                        while (!userHellstormConfig[hellstormCounter].magazine || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                            if (!userHellstormConfig[hellstormCounter].magazine) {
                                this.messageAmmo += /*${interaction.user.username}'s */ `\n- Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                                userHellstormConfig.unshift(userHellstormConfig[hellstormCounter]);
                                userHellstormConfig.splice(hellstormCounter + 1, 1);
                            }
                            hellstormCounter -= 1;
                        }
                        userHellstormConfig[hellstormCounter].magazine -= 1;
                        this.hellstorm = userHellstormConfig[hellstormCounter];
                    }
                    else
                        this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Reloading" }
                },
                update: async function () {

                    userLaserConfig = userLaserConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });
                    userHellstormConfig = userHellstormConfig.sort(function (a, b) {
                        return a.location - b.location;
                    });

                    await interaction.client.databaseEditData("UPDATE ammunition SET x1_magazine = x1_magazine - ?, x2_magazine = x2_magazine - ?, x3_magazine = x3_magazine - ?, x4_magazine = x4_magazine - ?, xS1_magazine = xS1_magazine - ?, h1_magazine = h1_magazine - ?, h2_magazine = h2_magazine - ?, hS1_magazine = hS1_magazine - ?, hS2_magazine = hS2_magazine - ? WHERE user_id = ?",
                        [ammunition.x1_magazine - userLaserConfig[1].magazine * userStats.laserQuantity, ammunition.x2_magazine - userLaserConfig[2].magazine * userStats.laserQuantity, ammunition.x3_magazine - userLaserConfig[3].magazine * userStats.laserQuantity, ammunition.x4_magazine - userLaserConfig[4].magazine * userStats.laserQuantity, ammunition.xS1_magazine - userLaserConfig[5].magazine * userStats.laserQuantity, ammunition.h1_magazine - userHellstormConfig[1].magazine, ammunition.h2_magazine - userHellstormConfig[2].magazine, ammunition.hS1_magazine - userHellstormConfig[3].magazine, ammunition.hS2_magazine - userHellstormConfig[4].magazine, interaction.user.id]);
                }
            }
        }
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
                missileCounter = userMissileConfig.length - 1;
                hellstormCounter = userHellstormConfig.length - 1;
            },
            ammunition: async function (threshold, turn) {
                while (!userLaserConfig[laserCounter].magazine || threshold <= userLaserConfig[laserCounter].threshold) {
                    if (!userLaserConfig[laserCounter].magazine) {
                        this.messageAmmo += /*${interaction.user.username}'s */ `\n- Laser (${userLaserConfig[laserCounter].name}) out of AMMO`;
                        userLaserConfig.unshift(userLaserConfig[laserCounter]);
                        userLaserConfig.splice(laserCounter + 1, 1);
                    }
                    laserCounter -= 1;
                }
                userLaserConfig[laserCounter].magazine -= 1;
                this.laser = userLaserConfig[laserCounter];
                if (!(turn % 3)) {
                    while (!userMissileConfig[missileCounter].magazine || threshold <= userMissileConfig[missileCounter].threshold) {
                        if (!userMissileConfig[missileCounter].magazine) {
                            this.messageAmmo += /*${interaction.user.username}'s */ `\n- Missile (${userMissileConfig[missileCounter].name}) out of AMMO`;
                            userMissileConfig.unshift(userMissileConfig[missileCounter]);
                            userMissileConfig.splice(missileCounter + 1, 1);
                        }
                        missileCounter -= 1;
                    }
                    userMissileConfig[missileCounter].magazine -= 1;
                    this.missile = userMissileConfig[missileCounter];
                }
                else
                    this.missile = { location: 0, threshold: 0, damage: 0, magazine: 1000000, name: "Reloading" }
                if (!(turn % 6)) {
                    while (!userHellstormConfig[hellstormCounter].magazine || threshold <= userHellstormConfig[hellstormCounter].threshold) {
                        if (!userHellstormConfig[hellstormCounter].magazine) {
                            this.messageAmmo += /*${interaction.user.username}'s */ `\n- Hellstorm (${userHellstormConfig[hellstormCounter].name}) out of AMMO`;
                            userHellstormConfig.unshift(userHellstormConfig[hellstormCounter]);
                            userHellstormConfig.splice(hellstormCounter + 1, 1);
                        }
                        hellstormCounter -= 1;
                    }
                    userHellstormConfig[hellstormCounter].magazine -= 1;
                    this.hellstorm = userHellstormConfig[hellstormCounter];
                }
                else
                    this.hellstorm = { location: 0, threshold: 0, damage: 0, shieldDamage: 0, magazine: 1000000, name: "Reloading" }
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
                    [ammunition.x1_magazine - userLaserConfig[1].magazine * userStats.laserQuantity, ammunition.x2_magazine - userLaserConfig[2].magazine * userStats.laserQuantity, ammunition.x3_magazine - userLaserConfig[3].magazine * userStats.laserQuantity, ammunition.x4_magazine - userLaserConfig[4].magazine * userStats.laserQuantity, ammunition.xS1_magazine - userLaserConfig[5].magazine * userStats.laserQuantity, ammunition.m1_magazine - userMissileConfig[1].magazine, ammunition.m2_magazine - userMissileConfig[2].magazine, ammunition.m3_magazine - userMissileConfig[3].magazine, ammunition.m4_magazine - userMissileConfig[4].magazine, ammunition.h1_magazine - userHellstormConfig[1].magazine, ammunition.h2_magazine - userHellstormConfig[2].magazine, ammunition.hS1_magazine - userHellstormConfig[3].magazine, ammunition.hS2_magazine - userHellstormConfig[4].magazine, interaction.user.id]);
            }
        }
    }
}

async function playerHandler(interaction, aliens, alienSpeed, mapID) {
    let playerInfo = await infoHandler(interaction, alienSpeed);
    if (playerInfo.canHunt)
        return {
            active: true,
            aliensKilled: 0,
            mission: await missionHandler(interaction, aliens, mapID, playerInfo.boost),
            info: playerInfo,
            emojiMessage: `**[${playerInfo.userStats.shipEmiji}]** <a:hp:896118360125870170>: **${playerInfo.userStats.hp}**\t<a:sd:896118359966511104>: **${playerInfo.userStats.shield}**\n`,
            log: "",
            reward: { credit: 0, units: 0, exp: 0, honor: 0 },
            cargo: { storage: playerInfo.userStats.cargo, resources: playerInfo.userStats.resources },
            update: async function (message) {

            }
        }
    return { active: false }
}