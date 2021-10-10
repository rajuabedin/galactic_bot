const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('refine')
        .setDescription('refine cargo to their superior resources'),

    async execute(interaction, userInfo) {
        let resources = userInfo.resources.split("; ").map(Number);
        let cargo = userInfo.cargo;
        let message = "**Refined materials:**" + "\`\`\`yaml\n";
        let resourcesName = ["Rhodochrosite ", "Linarite      ", "Dolomite      ", "Rubellite     ", "Prehnite      ", "Diamond       ", "Radtkeite     ", "Dark Matter   ", "Palladium     "]
        let refined = false;
        [resources, message, refined] = await materialToRefine(resources, 0, 1, 3, message, refined, resourcesName);
        [resources, message, refined] = await materialToRefine(resources, 1, 2, 4, message, refined, resourcesName);
        [resources, message, refined] = await materialToRefine(resources, 3, 4, 5, message, refined, resourcesName);
        [resources, message, refined] = await materialToRefine(resources, 5, 6, 7, message, refined, resourcesName);

        message += " \`\`\`" + "\`\`\`yaml\n" + `Cargo ${cargo} => `;
        cargo = resources.reduce((a, b) => a + b);
        message += `${cargo}` + " \`\`\`";
        if (refined)
            await interaction.reply({ embeds: [interaction.client.greenEmbedImage(message, "Refinement successful", interaction.user)] });
        else
            await interaction.reply({ embeds: [interaction.client.redEmbedImage("**Not enough material to refine**", "Refinement failure", interaction.user)] });
        resources = resources.join("; ");
        await interaction.client.databaseEditData("UPDATE users SET resources = ?, cargo = ? WHERE user_id = ?", [resources, cargo, interaction.user.id]);
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
        message += `${resourcesName[result]}:  ${resources[3]}\n`;
        refined = true;
    }
    return [resources, message, refined]
}