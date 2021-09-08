const {MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const Command = require('../Structures/Command.js');

const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('back')
            //.setLabel('Beginning')
            .setEmoji('755733114042449950')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('next')
            //.setLabel('Ending')
            .setEmoji('755733114537508894')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('download')
            //.setLabel('Ending')
            .setEmoji('📁')
            .setStyle('SUCCESS'),
        
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
        )

module.exports = new Command({
    name: "hunt",
    description: "Hunt allien",

    async run(interaction) {
        //let user_ammo = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 25, 15, 5];
        //[a, b, c, d] = [threshold, damage, "shield damage", user_ammo]
        let user_laser_config = [[-2, 2, 0, 10000, "x2"], [0, 1, 0, 10000, "x1"], [20, 3, 0, 14900, "x3"], [80, 4, 0, 14900, "x4"], [140, 0, 2, 25000, "xS1"]];
        let user_missile_config = [[0, 1000, 100, "m1"], [60, 2000, 100, "m2"], [100, 4000, 100, "m3"], [150, 6000, 100, "m4"]];
        let user_hellstorm_config = [[0, 10000, 0, 900, "l1"], [50, 20000, 0, 1000, "l2"], [100, 0, 12500, 1100, "lS1"], [140, 0, 30000, 4, "lS2"]];
        // Damage, HP, Max Shield,  Shield, Speed, Penetration, Shield absorb rate, laser quantity
        let user_stats = [2000, 250000,350000, 350000, 350, 0, 0.8, 30];
        let alien_stats = [280, 80000, 80000, 280, 0, 0.8];
        await battle(user_laser_config, user_missile_config, user_hellstorm_config, user_stats, alien_stats, interaction);
    }

})

async function battle(user_laser_config, user_missile_config, user_hellstorm_config, user_stats, enemy_stats, interaction) {
    await interaction.reply({ embeds: [interaction.client.blueEmbed("", "Looking for an aliens...")] });
    await interaction.client.wait(1000);
    let alien_list = [enemy_stats.slice()];
    //let message = "**Engaging Combat with XY**";
    let message = `\n**Your Info**:\nHP: **${user_stats[1]}**\tShield: **${user_stats[3]}**`;
    message += `\n**Alien Info**:\nHP: **${enemy_stats[1]}**\tShield: **${enemy_stats[2]}**`;
    let message_damage = "";
    await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, "**Engaging Combat with XY**")] });
    let log_message = [[message, "**Engaging Combat with XY**"]];
    let message_ammo = "";
    user_laser_config.push([-1, 0, 0, 1000000, "No AMMO"]);
    user_laser_config = user_laser_config.sort(function (a, b) {
        return a[0] - b[0];
    });
    let laser_counter = user_laser_config.length - 1;
    user_missile_config.push([-1, 0, 0, 100000, "No AMMO"]);
    user_missile_config = user_missile_config.sort(function (a, b) {
        return a[0] - b[0];
    });
    let missile_counter = user_missile_config.length - 1;
    user_hellstorm_config.push([-1, 0, 0, 100000, "No AMMO"]);
    user_hellstorm_config = user_hellstorm_config.sort(function (a, b) {
        return a[0] - b[0];
    });
    let hellstorm_counter = user_hellstorm_config.length - 1;

    let missile_launch_after_turns = 3;
    let laser = user_laser_config[laser_counter];
    let missile = user_missile_config[missile_counter];
    let hellstorm = user_hellstorm_config[hellstorm_counter];
    let turn_counter = 0;

    let can_use_hellstorm = true;
    let user_max_shield = user_stats[2];
    let alien_max_hp = enemy_stats[1];
    let alien_max_shield = enemy_stats[2];

    let total_aliens_damage = enemy_stats[0];

    if (alien_max_hp + alien_max_shield < 12000 || alien_max_hp / user_stats[0] <= 7) {
        can_use_hellstorm = false;
        hellstorm = [-1, 0, 0, 100000, "Disabled"];
    }
    let minimum_accuracy_user = 80;
    let minimum_accuracy_alien = 80;

    if (user_stats[4] > enemy_stats[3]) {
        minimum_accuracy_user = 90 - (user_stats[4] - enemy_stats[3]) / 5;
        minimum_accuracy_alien = 85 + (enemy_stats[3] - user_stats[4]) / 2.5;
    }
    else if (user_stats[4] == enemy_stats[3]) {
        minimum_accuracy_user = 80;
        minimum_accuracy_alien = 80;
    }
    else {
        minimum_accuracy_user = 85 + (enemy_stats[3] - user_stats[4]) / 2.5;
        minimum_accuracy_alien = 90 - (user_stats[4] - enemy_stats[3]) / 5;
    }
    while (user_stats[1] > 0 && alien_list.length > 0) {
        let alien_stats = alien_list[0];
        let accuracy_user = interaction.client.random(minimum_accuracy_user, 100) / 100;
        let accuracy_alien = interaction.client.random(minimum_accuracy_alien, 100) / 100;
        //await wait(1000);
        turn_counter += 1;
        let has_laser_ammo = laser[3] / user_stats[7] >= 1;
        let has_missile_ammo = missile[2] / 2 >= 1;
        let has_hellstorm_ammo = hellstorm[3] / 5 >= 1;

        let laser_shield_absorption = 0;
        let laser_shield_damage = 0;
        let laser_hp_damage = 0;
        let missile_hp_damage = 0;
        let missile_shield_damage = 0;
        let hellstorm_hp_damage = 0;
        let hellstorm_shield_damage = 0;
        let hellstorm_shield_absorption = 0;        

        let threshold = 100 / alien_max_hp * alien_stats[1] + 100 / alien_max_shield * alien_stats[2];

        while (!has_laser_ammo || threshold <= laser[0]) {
            if (!has_laser_ammo) {
                message_ammo += `\n- Laser (${laser[4]}) out of AMMO`;
                laser[0] = -2;
                user_laser_config = user_laser_config.sort(function (a, b) {
                    return a[0] - b[0];
                });
            }
            laser_counter -= 1;
            laser = user_laser_config[laser_counter];
            has_laser_ammo = laser[3] / user_stats[7] >= 1;
        }

        while (!has_missile_ammo || threshold <= missile[0]) {
            if (!has_missile_ammo) {
                message_ammo += `\n- Missile (${missile[3]}) out of AMMO`;
                missile[0] = -2;
                user_missile_config = user_missile_config.sort(function (a, b) {
                    return a[0] - b[0];
                });
            }
            missile_counter -= 1;
            missile = user_missile_config[missile_counter];
            has_missile_ammo = missile[2] / 2 >= 1;
        }

        if (can_use_hellstorm)
            while (!has_hellstorm_ammo || threshold <= hellstorm[0]) {
                if (!has_hellstorm_ammo) {
                    message_ammo += `\n- Hellstorm (${hellstorm[4]}) out of AMMO`;
                    hellstorm[0] = -2;
                    user_hellstorm_config = user_hellstorm_config.sort(function (a, b) {
                        return a[0] - b[0];
                    });
                }
                hellstorm_counter -= 1;
                hellstorm = user_hellstorm_config[hellstorm_counter];
                has_hellstorm_ammo = hellstorm[3] / 5 >= 1;
            }

        if (alien_stats[2] > 0) {
            laser[3] -= user_stats[7];
            laser_shield_absorption = Math.trunc(laser[2] * user_stats[0] * accuracy_user);
            laser_shield_damage = Math.trunc((alien_stats[5] - user_stats[5]) * laser[1] * user_stats[0] * accuracy_user);
            laser_hp_damage = Math.trunc(laser[1] * user_stats[0] * accuracy_user - laser_shield_damage);
            if (alien_stats[2] <= laser_shield_absorption) {
                user_stats[3] += alien_stats[2];
                laser_shield_absorption = Math.trunc(alien_stats[2] * accuracy_user);
                alien_stats[2] = 0;
                laser_hp_damage = laser[1] * user_stats[0];
            }
            else {
                user_stats[3] += laser_shield_absorption;
                alien_stats[2] -= laser_shield_absorption;
                if (alien_stats[2] <= laser_shield_damage) {
                    laser_hp_damage += laser_shield_damage - alien_stats[2];
                    laser_shield_damage = alien_stats[2] + laser_shield_absorption;
                    alien_stats[2] = 0;
                }
                else {
                    alien_stats[2] -= laser_shield_damage;
                    laser_shield_damage += laser_shield_absorption;
                }
            }
            alien_stats[1] -= laser_hp_damage;
            message_damage = `\n\`\`\`ini\n[Laser Damage (${laser[4]}): ${laser_hp_damage}/${laser_shield_damage}]`;

            if (turn_counter % missile_launch_after_turns == 0) {
                missile[2] -= 1;
                missile_shield_damage = Math.trunc((alien_stats[5] - user_stats[5]) * missile[1] * accuracy_user);
                missile_hp_damage = Math.trunc(missile[1] * accuracy_user - missile_shield_damage);
                if (alien_stats[2] <= missile_shield_damage) {
                    missile_hp_damage += missile_shield_damage - alien_stats[2];
                    missile_shield_damage = alien_stats[2];
                    alien_stats[2] = 0;
                }
                else
                    alien_stats[2] -= missile_shield_damage;
                alien_stats[1] -= missile_hp_damage;
                message_damage += `\n[Missile Damage (${missile[3]}): ${missile_hp_damage}/${missile_shield_damage}]`;
            }
            if (can_use_hellstorm && turn_counter % 6 == 0) {
                hellstorm[3] -= 5;
                hellstorm_shield_absorption = Math.trunc(hellstorm[2] * accuracy_user);
                hellstorm_shield_damage = Math.trunc((alien_stats[5] - user_stats[5]) * hellstorm[1] * accuracy_user);
                hellstorm_hp_damage = Math.trunc(hellstorm[1] * accuracy_user - hellstorm_shield_damage);
                if (alien_stats[2] <= hellstorm_shield_absorption) {
                    user_stats[3] += alien_stats[2];
                    hellstorm_shield_absorption = alien_stats[2];
                    alien_stats[2] = 0;
                    hellstorm_hp_damage = hellstorm[1];
                }
                else {
                    user_stats[3] += hellstorm_shield_absorption;
                    alien_stats[2] -= hellstorm_shield_absorption;
                    if (alien_stats[2] <= hellstorm_shield_damage) {
                        hellstorm_hp_damage += hellstorm_shield_damage - alien_stats[2];
                        hellstorm_shield_damage = alien_stats[2] + hellstorm_shield_absorption;
                        alien_stats[2] = 0;
                    }
                    else {
                        alien_stats[2] -= hellstorm_shield_damage;
                        hellstorm_shield_damage += hellstorm_shield_absorption;
                    }
                }
                alien_stats[1] -= hellstorm_hp_damage;
                message_damage += `\n[Hellstorm Damage (${hellstorm[4]}): ${hellstorm_hp_damage}/${hellstorm_shield_damage}]`;
            }
        }
        else {
            laser[3] -= user_stats[7];
            laser_shield_absorption = 0;
            laser_hp_damage = Math.trunc(laser[1] * user_stats[0] * accuracy_user);
            alien_stats[1] -= laser_hp_damage;
            message_damage = `\n\`\`\`ini\n[Laser Damage (${laser[4]}): ${laser_hp_damage}/0]`;

            if (turn_counter % missile_launch_after_turns == 0) {
                missile[2] -= 1;
                missile_hp_damage = Math.trunc(missile[1] * accuracy_user);
                alien_stats[1] -= missile_hp_damage;
                message_damage += `\n[Missile Damage (${missile[3]}): ${missile_hp_damage}/0]`;
            }

            if (turn_counter % 6 == 0 && can_use_hellstorm) {
                hellstorm[3] -= 5;
                hellstorm_shield_absorption = 0;
                hellstorm_hp_damage = Math.trunc(hellstorm[1] * accuracy_user);
                alien_stats[1] -= hellstorm_hp_damage;
                message_damage += `\n[Hellstorm Damage (${hellstorm[4]}): ${hellstorm_hp_damage}/0]`;
            }
        }
        let alien_shield_damage = Math.trunc((user_stats[6] - alien_stats[4]) * total_aliens_damage * accuracy_alien);
        let alien_hp_damage = Math.trunc(total_aliens_damage * accuracy_alien - alien_shield_damage);
        if (user_stats[3] <= alien_shield_damage) {
            alien_hp_damage += alien_shield_damage - user_stats[3];
            alien_shield_damage = user_stats[3];
            user_stats[3] = 0;
        }
        else
            user_stats[3] -= alien_shield_damage;
        user_stats[1] -= alien_hp_damage;
        if (user_stats[3] > user_max_shield)
            user_stats[3] = user_max_shield;

        if (alien_stats[1] <= 0) {
            alien_stats[1] = 0;
            total_aliens_damage -= alien_stats[0];
            alien_list.shift();

            if (alien_list.length > 0) {
                alien_max_hp = alien_list[0][1];
                alien_max_shield = alien_list[0][2];

                laser_counter = user_laser_config.length - 1;
                missile_counter = user_missile_config.length - 1;
                hellstorm_counter = user_hellstorm_config.length - 1;
                laser = user_laser_config[laser_counter];
                missile = user_missile_config[missile_counter];
                hellstorm = user_hellstorm_config[hellstorm_counter];

                if (alien_max_hp + alien_max_shield < 12000 || alien_max_hp / user_stats[0] <= 7) {
                    can_use_hellstorm = false;
                    hellstorm = [-1, 0, 0, 100000, "Disabled"];
                }
                else
                    can_use_hellstorm = true;

                if (user_stats[4] > alien_stats[3]) {
                    minimum_accuracy_user = 90 - (user_stats[4] - alien_stats[3]) / 5;
                    minimum_accuracy_alien = 85 + (alien_stats[3] - user_stats[4]) / 2.5;
                }
                else if (user_stats[4] == alien_stats[3]) {
                    minimum_accuracy_user = 80;
                    minimum_accuracy_alien = 80;
                }
                else {
                    minimum_accuracy_user = 85 + (alien_stats[3] - user_stats[4]) / 2.5;
                    minimum_accuracy_alien = 90 - (user_stats[4] - alien_stats[3]) / 5;
                }
            }
        }
        new_threshold = 100 / alien_max_hp * alien_stats[1] + 100 / alien_max_shield * alien_stats[2];
        chance_to_encounter_new_alien = (threshold - new_threshold - (turn_counter - 1) * 40) / 2;

        if (chance_to_encounter_new_alien < 10 && turn_counter <= 11)
            chance_to_encounter_new_alien = 10;

        //message = `\n__Turn ${turn_counter}__`;
        message = `\n**Your Info**:\nHP: **${user_stats[1]}**\tShield: **${user_stats[3]}**`;
        message += `\n**Alien Info**:\nHP: **${alien_stats[1]}**\tShield: **${alien_stats[2]}**`;

        message_damage += `\`\`\`**\`\`\`diff\n+ ${laser_shield_absorption + hellstorm_shield_absorption} Shield Absorbed`;
        message_damage += `\`\`\`**\`\`\`css\n[Alien Damage: ${alien_hp_damage}/${alien_shield_damage}]\`\`\``;
        log_message.push([message + message_damage, `\n__Turn ${turn_counter}__`]);
        //await interaction.editReply({ embeds: [blueEmbed(message + message_damage, `\n__Turn ${turn_counter}__`)] });

        if (interaction.client.random(0, 95) <= chance_to_encounter_new_alien) {
            await interaction.client.wait(1000);
            alien_list.push(enemy_stats.slice());
            total_aliens_damage += enemy_stats[0];
            await interaction.editReply({ embeds: [interaction.client.yellowEmbed("\`\`\`json\n\"NEW ALIEN ENCOUNTERED !!!\"\n\`\`\`")] });
            log_message[turn_counter][0] += "\n\`\`\`json\n\"NEW ALIEN ENCOUNTERED !!!\"\n\`\`\`";
            await interaction.client.wait(1000);
            let message_update = `\n**Your Info**:\nHP: **${user_stats[1]}**\tShield: **${user_stats[3]}**`;
            message_update += `\n**Alien Info**:\nHP: **${enemy_stats[1]}**\tShield: **${enemy_stats[2]}**`;
            await interaction.editReply({ embeds: [interaction.client.blueEmbed(message_update, "**Engaging Combat with XY**")] });
        }
    }
    //await wait(1000);
    let message_user_info = `**Battle ended after ${turn_counter} turns**\n`;
    message_user_info += `**Your Info**:\nHP: **${user_stats[1]}**\tShield: **${user_stats[3]}**`;
    await interaction.client.wait(1000 + 5 * turn_counter);
    if (user_stats[1] > 0) {
        await interaction.editReply({ embeds: [interaction.client.greenEmbed(message_user_info + "\n\`\`\`diff\n" + message_ammo + " \`\`\`", "VICTORY!")], components: [row, row1] });
        log_message.push([message_user_info + "\n\`\`\`diff\n" + message_ammo + " \`\`\`", "VICTORY!"]);
    }
    else {
        await interaction.editReply({ embeds: [interaction.client.redEmbed(message_user_info + "\n\`\`\`diff\n" + message_ammo + " \`\`\`", "DEFEAT! Ship is destroyed!")], components: [row, row1] });
        log_message.push([message_user_info + "\n\`\`\`diff\n" + message_ammo + " \`\`\`", "DEFEAT! Ship is destroyed!"]);
    }
    buttonHandler(interaction, interaction.user.id, log_message);
}

function buttonHandler(interaction, userID, log_message){
    let maxIndex = log_message.length -1;
    let index = maxIndex;
    let downloaded = false;
    const filter = i => i.user.id === userID;

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        if (i.customId === 'back') {
            collector.resetTimer({time: 10000});
            if(index === 0)
                index = maxIndex;
            else
                index--;
            await i.update({ embeds: [interaction.client.blueEmbed(log_message[index][0], log_message[index][1])], components: [row, row1] });
        }
        else if (i.customId === 'next'){
            collector.resetTimer({time: 10000});
            if(index === maxIndex)
                index = 0;
            else
                index++;
            await i.update({ embeds: [interaction.client.blueEmbed(log_message[index][0], log_message[index][1])], components: [row, row1] });
        }
        else if (i.customId === 'select'){   
            collector.resetTimer({time: 10000});         
            if(i.component.options.value === "0")
                index = 0;
            else if (i.values[0] === "+5")
                index += 5;
            else if (i.values[0] === "+10")
                index += 10;
            else if (i.values[0] === "-10")
                index -= 10;
            else if (i.values[0] === "-5")
                index -= 5;
            else 
                index = maxIndex;
            if(index > maxIndex)
                index -= maxIndex;
            else if (index < 0)
                index += maxIndex;
            await i.update({ embeds: [interaction.client.blueEmbed(log_message[index][0], log_message[index][1])], components: [row, row1] });
        }
        else{
            await interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]});
            downloaded = true;
            collector.stop("Download")
        }
    });

    var fs = require('fs');

    var file = fs.createWriteStream(`./User_Log/${userID}.txt`);
    file.on('error', function(err) { console.log(`ERROR on creating log FILE for user: ${userID}`) });
    log_message.forEach(function(v) { file.write(v.join('\n\n ') + '\n'); });
    file.end();

    collector.on('end', collected => { 
        if(!downloaded)
        interaction.editReply({components: []})
        //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
    });
}