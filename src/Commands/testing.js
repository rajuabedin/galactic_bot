//const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed, MessageAttachment } = require('discord.js');
//const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas } = require('canvas')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('testing'),

    async execute(interaction, userInfo) {
        // chceck if developer
        if (!interaction.client.developersID.includes(interaction.user.id)) {
            return;
        }
        await interaction.reply("Executing...");
        /*
        //let oldAlienNames = ["L1", "L1_boss", "L2", "L2_boss", "L3", "L3_boss", "L4", "L4_boss", "L5", "L5_boss", "L6", "L6_boss", "L7", "L7_boss", "L8", "L8_boss", "L9", "L9_boss", "L10", "L10_boss"];
        let newAlienNames = ["Exyon", "Boss Exyon", "Neon", "Boss Neon", "Skraper", "Boss Skraper", "Comet", "Boss Comet", "Pulsar", "Boss Pulsar", "Yve", "Boss Yve", "Menhir", "Boss Menhir", "Monolith", "Boss Monolith", "Primus", "Boss Primus", "Bastion", "Boss Bastion"];
        for (index in newAlienNames) {
            //let alien = await interaction.client.databaseSelcetData("SELECT * from aliens WHERE alien_name = ?", [oldAlienNames[index]]);
            let alien = await interaction.client.databaseSelcetData("SELECT * from aliens WHERE alien_name = ?", [newAlienNames[index]]);
            if (typeof alien == 'undefined')
                continue;
            else {
                //await interaction.client.databaseSelcetData("UPDATE aliens SET alien_name = ? WHERE alien_name = ?", [newAlienNames[index], oldAlienNames[index]]);
                //await interaction.client.databaseSelcetData("CREATE TEMPORARY TABLE tmp${index} SELECT * from aliens WHERE alien_name = ?", [oldAlienNames[index]]);
                await interaction.client.databaseSelcetData(`CREATE TEMPORARY TABLE tmp${index} SELECT * from aliens WHERE alien_name = ? AND map_id NOT IN (?, ?)`, [newAlienNames[index], 41, 42]);
                await interaction.client.databaseSelcetData(`ALTER TABLE tmp${index} drop alien_id`, []);
                //await interaction.client.databaseSelcetData(`DELETE FROM tmp${index} WHERE map_id = ? AND map_id = ?`, [41, 42]);
                //await interaction.client.databaseSelcetData("UPDATE tmp${index} SET map_id = map_id + 10, alien_name = ?", [newAlienNames[index]]);
                await interaction.client.databaseSelcetData(`UPDATE tmp${index} SET map_id = map_id + 10`, []);
                await interaction.client.databaseSelcetData(`INSERT INTO aliens SELECT 0,tmp${index}.* FROM tmp${index}`, []);
                //await interaction.client.databaseSelcetData("UPDATE tmp${index} SET map_id = map_id + 10, alien_name = ?", [newAlienNames[index]]);
                await interaction.client.databaseSelcetData(`UPDATE tmp${index} SET map_id = map_id + 10`, []);
                await interaction.client.databaseSelcetData(`INSERT INTO aliens SELECT 0,tmp${index}.* FROM tmp${index}`, []);
                await interaction.client.databaseSelcetData(`DROP TEMPORARY TABLE tmp${index}`, []);
                await interaction.client.wait(500);
                await interaction.editReply("Executed index: " + index);
            }
        };
        await interaction.editReply("Done");
        */
        let userCd = await interaction.client.databaseSelcetData("SELECT last_hunt, last_repair, moving_to_map FROM user_cd WHERE user_id = ?", [interaction.user.id]);
        console.log((Date.now() - Date.parse(userCd[0].last_repair)) / 60000);
    }
}