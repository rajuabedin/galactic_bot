const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('refine')
        .setDescription('refine cargo to their superior resources'),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });


        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            if (userInfo.tutorial_counter < 7) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'tutorialFinish'))] });
                return;
            }
            let resources = userInfo.resources.split("; ").map(Number);
            let cargo = userInfo.cargo;
            let message = interaction.client.getWordLanguage(serverSettings.lang, 'refine') + "\`\`\`yaml\n";
            let resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Gold          "]
            let refined = false;
            [resources, message, refined] = await materialToRefine(resources, 0, 1, 3, message, refined, resourcesName);
            [resources, message, refined] = await materialToRefine(resources, 1, 2, 4, message, refined, resourcesName);
            [resources, message, refined] = await materialToRefine(resources, 3, 4, 5, message, refined, resourcesName);
            [resources, message, refined] = await materialToRefine(resources, 5, 6, 7, message, refined, resourcesName);

            let space = " ";
            let spaceCount = space.repeat(4 - cargo.toString().length + 3);
            message += `---------------------\n`;
            message += "\`\`\`\`\`\`yaml\n" + `Cargo:${spaceCount}${cargo} =>`;
            cargo = resources.reduce((a, b) => a + b);
            spaceCount = space.repeat(4 - cargo.toString().length + 1);
            message += `${spaceCount}${cargo}` + " \`\`\`";
            if (refined)
                await interaction.editReply({ embeds: [interaction.client.greenEmbed(message, interaction.client.getWordLanguage(serverSettings.lang, 'refineSuccess'))] });
            else
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'refineFailMessage'), interaction.client.getWordLanguage(serverSettings.lang, 'refineFail'))] });
            resources = resources.join("; ");
            await interaction.client.databaseEditData("UPDATE users SET username = ?, resources = ?, cargo = ? WHERE user_id = ?", [interaction.user.username.replace(/[^a-zA-Z0-9]/g, '-'), resources, cargo, interaction.user.id]);
        }
        catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}

async function materialToRefine(resources, mat1, mat2, result, message, refined, resourcesName) {
    let numberOfMaetrialToConvert = 0;
    if (resources[mat1] >= 10 && resources[mat2] >= 10) {
        if (resources[mat1] < resources[mat2])
            numberOfMaetrialToConvert = Math.floor(resources[mat1] / 10);
        else
            numberOfMaetrialToConvert = Math.floor(resources[mat2] / 10);
        resources[mat1] -= 10 * numberOfMaetrialToConvert;
        resources[mat2] -= 10 * numberOfMaetrialToConvert;
        resources[result] += numberOfMaetrialToConvert;
        let space = " ";
        space = space.repeat(4 - resources[result].toString().length + 2)
        message += `${resourcesName[result]}:${space}${resources[result]}\n`;
        refined = true;
    }
    return [resources, message, refined]
}