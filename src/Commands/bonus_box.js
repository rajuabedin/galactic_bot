const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonus_box')
        .setDescription('Try your luck in some random boxes'),

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

            let userCd = await interaction.client.databaseSelcetData("SELECT last_bonus_box FROM user_cd WHERE user_id = ?", [interaction.user.id]);
            let elapsedTimeFromBox = Math.floor((Date.now() - Date.parse(userCd[0].last_bonus_box)) / 1000);
            if (elapsedTimeFromBox < 60) {
                await interaction.reply({
                    embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'boxCD').format(60 - elapsedTimeFromBox), interaction.client.getWordLanguage(serverSettings.lang, 'inCD'))]
                });
                return;
            }
            let box = await interaction.client.databaseSelcetData("SELECT * FROM bonus_box", []);
            let bonusBoxCD = new Date();
            //bonusBoxCD.setMinutes(bonusBoxCD.getMinutes() + 1);
            let indexList = [];
            let index = 0;
            let reward = {
                "x1_magazine": 0,
                "x2_magazine": 0,
                "x3_magazine": 0,
                "xS1_magazine": 0,
                "credit": 0,
                "units": 0
            }
            let description = {
                "x1_magazine":  "[x1]  Ammunition :",
                "x2_magazine":  "[x2]  Ammunition :",
                "x3_magazine":  "[x3]  Ammunition :",
                "xS1_magazine": "[xS1] Ammunition :",
                "credit":       "[C]   Credit     :",
                "units":        "[U]   Units      :"
            }
            let random = userInfo.user_speed / 100;
            for (index; index < box.length; index++) {
                indexList = indexList.concat(Array(box[index].chance).fill(index));
            }
            random = interaction.client.random(Math.round(random * 2), Math.trunc(random * 3));
            let storeRandom = random;
            let message = `\`\`\`yaml\n`;
            let space = " ";
            
            for (random; random > 0; random--) {
                indexList = indexList.sort(() => Math.random() - 0.5);
                index = indexList[Math.floor(Math.random() * (100))];

                reward[box[index].column_reward] += box[index].value;
            }
            for (const [key, value] of Object.entries(reward)) {
                if (value > 0)
                    message += `\n-${description[key]}${space.repeat(6 - value.toString().length)}${value}`;
            }
            message += " \`\`\`";
            await interaction.reply({
                embeds: [interaction.client.greenEmbed(
                    message,
                    `Opening [ ${storeRandom} ] bonus boxes:`
                )]
            });
            await interaction.client.databaseEditData(`UPDATE ammunition SET x1_magazine = x1_magazine + ?, x2_magazine = x2_magazine + ?, x3_magazine = x3_magazine + ?, xS1_magazine = xS1_magazine + ? WHERE user_id = ?`, [reward.x1_magazine, reward.x2_magazine, reward.x3_magazine, reward.xS1_magazine, interaction.user.id]);
            await interaction.client.databaseEditData(`UPDATE users SET credit = credit + ?, units = units + ? WHERE user_id = ?`, [reward.credit, reward.units, interaction.user.id]);
            await interaction.client.databaseEditData(`UPDATE user_cd SET last_bonus_box = ? WHERE user_id = ?`, [bonusBoxCD, interaction.user.id]);
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}