const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily reward.'),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 8) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }

            var dailyInfo = await interaction.client.databaseSelectData(`select * from user_daily where user_id = '${interaction.user.id}'`)

            var today = new Date();
            var diffInDays;
            if (dailyInfo.length == 0) {
                await interaction.client.databaseEditData(`insert into user_daily (user_id, next_date) values('${interaction.user.id}', '${today.toJSON().slice(0, 10)}')`)
                //return await interaction.reply({ embeds: [interaction.client.greenEmbed("You have successfully claimed your daily reward.", "Successfull")], components: [] })
                diffInDays = 1;
                dailyInfo = {
                    streak: 1
                }
            } else {
                dailyInfo = dailyInfo[0];
                var mysqlDate = new Date(Date.parse(dailyInfo.next_date.toString().replace(/-/g, '/')));

                const diffInMs = new Date(today) - new Date(mysqlDate)
                diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            }

            let reward = 50

            if (2 > diffInDays && diffInDays >= 1) {
                if (dailyInfo.streak > 0)
                    reward = reward * dailyInfo.streak
                if (reward > 500) reward = 500;
                await interaction.client.databaseEditData(`update users set username = '${interaction.user.username}', units = units + ${reward} where user_id = '${interaction.user.id}'`)
                await interaction.client.databaseEditData(`update user_daily set streak = streak + 1, next_date = '${today.toJSON().slice(0, 10)}' where user_id = '${interaction.user.id}'`)
                return await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, "daily_reward_msg").format(reward, (dailyInfo.streak - 1)), interaction.client.getWordLanguage(serverSettings.lang, 'daily_reward'))], components: [] })
            } else if (diffInDays > 2) {
                await interaction.client.databaseEditData(`update users set username = '${interaction.user.username}', units = units + ${reward} where user_id = '${interaction.user.id}'`)
                await interaction.client.databaseEditData(`update user_daily set streak = 1, next_date = '${today.toJSON().slice(0, 10)}' where user_id = '${interaction.user.id}'`)
                return await interaction.reply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, "daily_reward_msg").format(reward, 0), interaction.client.getWordLanguage(serverSettings.lang, 'daily_reward'))], components: [] })
            } else {
                return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, "daily_claimed_error"), interaction.client.getWordLanguage(serverSettings.lang, "claimed"))], components: [] })
            }

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