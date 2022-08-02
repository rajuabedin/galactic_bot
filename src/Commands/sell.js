const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

let resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Gold          "]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sells cargo resources')
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Select from [ prices - all ]')
                .setRequired(true)
                .addChoice('prices', 'prices')
                .addChoice('all', 'all')
        ),

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
            let selectedOption = interaction.options.getString('option').toLowerCase();
            if (selectedOption == 'all') {
                let userCd = await interaction.client.databaseSelectData("SELECT moving_to_map FROM user_cd WHERE user_id = ?", [user.id]);
                if (userCd.length > 0) {
                    if (~~((Date.now() - Date.parse(userCd[0].moving_to_map)) / 1000) >= 0 && userInfo.next_map_id !== 1) {
                        await interaction.client.databaseEditData("UPDATE user_log SET warps = warps + 1 WHERE user_id = ?", [user.id]);
                        userInfo.map_id = userInfo.next_map_id;
                        await interaction.client.databaseEditData("UPDATE users SET map_id = ?, next_map_id = 1 WHERE user_id = ?", [userInfo.map_id, user.id]);
                    }
                }
                if (userInfo.map_id != 11 && userInfo.map_id != 21 && userInfo.map_id != 31 && userInfo.map_id != 18 && userInfo.map_id != 28 && userInfo.map_id != 38) {
                    await interaction.reply({ embeds: [interaction.client.redEmbed("There is **no hanger in this map**\nPlease go to a **base map** and try again", "ERROR!")] });
                    return;
                }
                let message = "\`\`\`yaml\n";
                let resources = userInfo.resources.split("; ").map(Number);
                let price = await interaction.client.databaseSelectData("SELECT price FROM resources", []);
                price = price.map(x => x.price);
                let credit = 0;
                let space = " ";
                let sold = false;
                for (index in resources) {
                    if (resources[index] > 0 && index != 8) {
                        let spaceCount = space.repeat(4 - resources[index].toString().length + 2)
                        message += `${resourcesName[index]}:${spaceCount}${resources[index]}\n`;
                        credit += resources[index] * Math.trunc(price[index] * (userInfo.honor / 500000 + 100) / 100);
                        sold = true;
                    }
                }
                space = space.repeat(6 - credit.toString().length);
                message += `---------------------\nTotal Credit  :${space}${credit}`;
                message += "\n\`\`\`";
                let resources2 = `0; 0; 0; 0; 0; 0; 0; 0; ${resources[8]}`
                await interaction.client.databaseEditData("UPDATE users SET resources = ?, credit = credit + ?, cargo = ? WHERE user_id = ?", [resources2, credit, resources[8], interaction.user.id]);
                if (sold)
                    await interaction.reply({ embeds: [interaction.client.greenEmbed(message, "Resources sold")] });
                else
                    await interaction.reply({ embeds: [interaction.client.redEmbed("No resources in cargo that can be sold", "ERROR!")] });
            }
            else {
                let price = await interaction.client.databaseSelectData("SELECT price FROM resources", []);
                price = price.map(x => x.price);
                let message = "\`\`\`yaml\n";
                let space = " ";
                for (index in resourcesName) {
                    if (index != 8) {
                        price[index] = Math.trunc(price[index] * (userInfo.honor / 500000 + 100) / 100);
                        let spaceCount = space.repeat(4 - price[index].toString().length + 2)
                        message += `${resourcesName[index]}:${spaceCount}${price[index]}\n`;
                    }
                    else
                        message += `${resourcesName[index]}:   N/A\n`;
                }
                message += "\n\`\`\`";
                await interaction.reply({ embeds: [interaction.client.greenEmbed(message, "Resources price per item")] });
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
