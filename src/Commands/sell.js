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
            if (userInfo.map_id != 11 && userInfo.map_id != 21 && userInfo.map_id != 31 && userInfo.map_id != 18 && userInfo.map_id != 28 && userInfo.map_id != 38) {
                await interaction.reply({ embeds: [interaction.client.redEmbed("There is **no hanger in this map**\nPlease go to a **base map** and try again", "ERROR!")] });
                return;
            }
            let selectedOption = interaction.options.getString('option').toLowerCase();
            if (selectedOption == 'all') {
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
                resources = `0; 0; 0; 0; 0; 0; 0; 0; ${resources[8]}`
                await interaction.client.databaseEditData("UPDATE users SET resources = ?, credit = credit + ?, cargo = ? WHERE user_id = ?", [resources, credit, resources[8], interaction.user.id]);
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
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}
