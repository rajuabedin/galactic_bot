const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const laser = ["x1   :  ", "x2   :  ", "x3   :  ", "x4   :  ", "xS1  :  "];
const missile = ["m1   :  ", "m2   :  ", "m3   :  ", "m4   :  "];
const hellstorm = ["h1   :  ", "h2   :  ", "hS1  :  ", "hS2  :  "];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ammunition')
        .setDescription('display possessed ammunition'),

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
            let ammo = await interaction.client.databaseSelectData("SELECT * FROM ammunition WHERE user_id = ?", [interaction.user.id]);
            ammo = ammo[0];
            let ammoLaser = [ammo.x1_magazine, ammo.x2_magazine, ammo.x3_magazine, ammo.x4_magazine, ammo.xS1_magazine];
            let ammoMissile = [ammo.m1_magazine, ammo.m2_magazine, ammo.m3_magazine, ammo.m4_magazine];
            let ammoHellstorm = [ammo.h1_magazine, ammo.h2_magazine, ammo.hS1_magazine, ammo.hS2_magazine];
            let message = "\`\`\`yaml\nLaser\n";

            for (let index in ammoLaser) {
                if (ammoLaser[index] > 0)
                    message += laser[index] + ammoLaser[index] + "\n";
            }
            message += "\`\`\`\n\`\`\`yaml\nMissile\n";
            for (let index in ammoMissile) {
                if (ammoMissile[index] > 0)
                    message += missile[index] + ammoMissile[index] + "\n";
            }
            message += "\`\`\`\n\`\`\`yaml\nHellstorm\n";
            for (let index in ammoHellstorm) {
                if (ammoHellstorm[index] > 0)
                    message += hellstorm[index] + ammoHellstorm[index] + "\n";
            }
            message += "\`\`\`";
            await interaction.reply({ embeds: [interaction.client.blueEmbedImage(message, "Ammunition", interaction.user)] });
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