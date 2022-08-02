const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require("node-fetch");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('This command is used to check your profile.')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user you want to check the profile of.')
            .setRequired(false)),

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
            let secondUser = interaction.options.getUser('user');
            let user = interaction.user;

            if (secondUser !== null) {
                user = secondUser;
                userInfo = await interaction.client.getUserAccount(user.id);
                if (typeof userInfo === 'undefined') {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ERROR_USER_NF'))], ephemeral: true });
                }
            }

            if (userInfo.tutorial_counter < 8 && interaction.user.id !== userInfo.user_id) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }

            let userCd = await interaction.client.databaseSelectData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [user.id]);
            if (userCd.length > 0) {
                if (~~((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
                    await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [user.id]);
                    userInfo.map_id = userInfo.next_map_id;
                    await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [userInfo.map_id, user.id]);
                }
            }

            var userMapData = await interaction.client.databaseSelectData('select * from map where map_id = ?', [userInfo.map_id]);
            userMapData = userMapData[0];

            var userLevelData = await interaction.client.databaseSelectData('select * from level where level = ?', [userInfo.level]);
            userLevelData = userLevelData[0];

            var userKillsCount = await interaction.client.databaseSelectData('select * from user_log where user_id = ?', [user.id]);
            userKillsCount = userKillsCount[0];

            if (typeof userKillsCount === 'undefined') {
                userKillsCount = { Enemy: 0 };
            }


            const requestBody = {
                user_id: user.id,
                pfp_image: user.avatarURL(),
                current_exp: userInfo.exp.toString(),
                required_exp: userLevelData.exp_to_lvl_up.toString(),
                username: user.username,
                discord_username: user.username + "#" + user.discriminator,
                achievement_title: userInfo.selected_title,
                clan_tag: userInfo.clan_tag,
                current_map: userMapData.map_name,
                level: userInfo.level.toString(),
                race: userInfo.race,
                credit: userInfo.credit.toString(),
                units: userInfo.units.toString(),
                colony: userInfo.firm,
                joined_on: timeConverter(userInfo.joined_on),
                aliens_killed: userInfo.aliens_killed.toString(),
                enemy_killed: userKillsCount.Enemy.toString(),
            }

            var data = await fetch(`https://api.obelisk.club/SpaceAPI/profile`, {
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
                await interaction.reply(`https://obelisk.club/user_files/${user.id}/${data.filename}`)
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