const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargo')
        .setDescription('To check what you have in your cargo!'),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 7) {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let resourcesName = ["Rhodochrosite :", "Linarite      :", "Dolomite      :", "Rubellite     :", "Prehnite      :", "Diamond       :", "Radtkeite     :", "Dark Matter   :", "Gold          :"];
            let resources = userInfo.resources.split("; ").map(Number);
            let message = "\`\`\`yaml\n";
            let space = " ";
            for (let index in resources) {
                if (resources[index] > 0) {
                    message += `${resourcesName[index]}${space.repeat(6 - resources[index].toString().length)}${resources[index]}\n`;
                }
            }
            message += `---------------------\n`;
            message += "\`\`\`\`\`\`yaml\n";
            message += `Cargo: ${userInfo.cargo} / ${userInfo.max_cargo}` + "\`\`\`";
            await interaction.reply({ embeds: [interaction.client.yellowEmbed(message, "Cargo")] });
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