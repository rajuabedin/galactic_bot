const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonus_box')
        .setDescription('Try your luck in some random boxes'),

    async execute(interaction, userInfo) {
        try {
            let box = await interaction.client.databaseSelcetData("SELECT * FROM bonus_box", []);
            let indexList = [];
            let index = 0;
            for (index; index < box.length; index++) {
                indexList = indexList.concat(Array(box[index].chance).fill(index));
            }
            indexList = indexList.sort(() => Math.random() - 0.5)
            index = indexList[Math.floor(Math.random() * (100))];
            await interaction.client.databaseEditData(`UPDATE ${box[index].table_reward} SET ${box[index].column_reward} = ${box[index].column_reward} + ${box[index].value} WHERE user_id = ?`, [interaction.user.id]);
            await interaction.reply({ embeds: [interaction.client.greenEmbed("\`\`\`css\n" + box[index].description + "\`\`\`", "Congratulations!")] });
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