const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Get your daily reward.'),

    async execute(interaction, userInfo) {
        try {
            var dailyInfo = await interaction.client.databaseSelcetData(`select * from user_daily where user_id = '${interaction.user.id}'`)

            var today = new Date();

            if (dailyInfo.length === 0) {
                await interaction.client.databaseEditData(`insert into user_daily (user_id, next_date) values('${interaction.user.id}', '${today.toJSON().slice(0, 10)}')`)
                return await interaction.reply({ embeds: [interaction.client.greenEmbed("You have successfully claimed your daily reward.", "Successfull")], components: [] })
            } else {
                dailyInfo = dailyInfo[0];
            }


            var mysqlDate = new Date(Date.parse(dailyInfo.next_date.toString().replace(/-/g, '/')));

            const diffInMs = new Date(today) - new Date(mysqlDate)
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);


            if (2 > diffInDays && diffInDays >= 1) {
                await interaction.client.databaseEditData(`update user_daily set streak = streak + 1, next_date = '${today.toJSON().slice(0, 10)}' where user_id = '${interaction.user.id}'`)
                return await interaction.reply({ embeds: [interaction.client.greenEmbed("You have successfully claimed your daily reward.", "Successfull")], components: [] })
            } else if (diffInDays > 2) {
                await interaction.client.databaseEditData(`update user_daily set streak = 1, next_date = '${today.toJSON().slice(0, 10)}' where user_id = '${interaction.user.id}'`)
                return await interaction.reply({ embeds: [interaction.client.greenEmbed("You have successfully claimed your daily reward.", "Successfull")], components: [] })
            } else {
                return await interaction.reply({ embeds: [interaction.client.redEmbed("Daily already claimed. Come back tomorrow.", "Claimed!")], components: [] })
            }

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