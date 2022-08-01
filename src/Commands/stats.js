const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require("node-fetch");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('This command is used to check your stats.'),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        function timeConverter(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp);
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
            return time;
        }

        try {
            if (userInfo.tutorial_counter < 8) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }

            if (userInfo.in_hunt != 1) {
                let userCd = await interaction.client.databaseSelectData("SELECT last_repair FROM user_cd WHERE user_id = ?", [interaction.user.id]);
                userInfo.user_hp = Math.trunc(userInfo.user_hp + userInfo.repair_rate * (Date.now() - Date.parse(userCd[0].last_repair)) / 60000)
                if (userInfo.user_hp > userInfo.max_hp)
                    userInfo.user_hp = userInfo.max_hp;
                await interaction.client.databaseEditData("UPDATE users SET user_hp = ? WHERE user_id = ?", [userInfo.user_hp, interaction.user.id]);
                await interaction.client.databaseEditData("UPDATE user_ships SET ship_current_hp = ? WHERE equipped = 1 AND user_id = ?", [userInfo.user_hp, interaction.user.id]);
            }
            await interaction.client.databaseEditData("UPDATE user_cd SET last_repair = ? WHERE user_id = ?", [new Date(), interaction.user.id]);            

            var userShipData = await interaction.client.databaseSelectData('select ships_info.ship_model, ships_info.laser_quantity, ships_info.extra_quantity, ships_info.max_cargo from user_ships join ships_info on user_ships.ship_model = ships_info.ship_model where user_ships.user_id = ? and user_ships.equipped = 1', [interaction.user.id]);
            userShipData = userShipData[0];

            var userShieldData = await interaction.client.databaseSelectData('select * from user_shields where user_id = ? and equipped = 1', [interaction.user.id]);
            if (userShieldData[0] !== undefined) {
                userShieldData = userShieldData[0].length;
            } else {
                userShieldData = 0
            }


            var userEngineData = await interaction.client.databaseSelectData('select * from user_engines where user_id = ? and equipped = 1', [interaction.user.id]);
            if (userEngineData[0] !== undefined) {
                userEngineData = userEngineData[0].length;
            } else {
                userEngineData = 0
            }


            const requestBody = {
                user_id: interaction.user.id,
                pfp_image: interaction.user.avatarURL(),
                username: interaction.user.username,
                discord_username: interaction.user.username + "#" + interaction.user.discriminator,
                achievement_title: userInfo.selected_title,
                clan_tag: userInfo.clan_tag,
                equipped_ship: userShipData.ship_model,
                lasers: `${userInfo.laser_quantity}/${userShipData.laser_quantity}`,
                shields: `${userShieldData}/${userShipData.extra_quantity}`,
                engines: `${userEngineData}/${userShipData.extra_quantity}`,
                speed: userInfo.user_speed.toString(),
                dmg: userInfo.user_damage.toString(),
                cargo: userInfo.cargo,
                max_cargo: userShipData.max_cargo,
                hp: userInfo.user_hp,
                max_hp: userInfo.max_hp,
                shield_value: userInfo.user_shield,
                max_shield: userInfo.max_shield,
                boost: "coming-soon"
            }

            var data = await fetch(`https://api.obelisk.club/SpaceAPI/stats`, {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
                .then(response => response.json())
                .then(data => { return data });
            if (data.success == true) {
                await interaction.reply(`https://obelisk.club/user_files/${interaction.user.id}/${data.filename}`)
            } else {
                let errorID = await errorLog.custom(data, interaction);
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
                errorLog.error(data.Error, { 'command_name': interaction.commandName });
            }

        } catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}