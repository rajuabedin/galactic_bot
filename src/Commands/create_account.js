const Command = require('../Structures/Command.js');
const {MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

module.exports = new Command({
    name: "create_account",
    description: "use to create a game account",

    async run(interaction) {

        const firm = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('Earth')
                //.setLabel('Beginning')
                .setEmoji("🌏")
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('Moon')
                //.setLabel('Ending')
                .setEmoji("🌑")
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('Mars')
                //.setLabel('Ending')
                .setEmoji("🍅")
                .setStyle('SUCCESS'),                
            
        );

        var userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof userInfo === 'undefined') {
            interaction.reply({embeds: [interaction.client.yellowEmbed("Which firm would you like to create an account on?")], ephemeral: true, components: [firm] });
        }
        else
            interaction.reply("You already posses an account");                

        const filter = i => i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
        
        collector.on('collect', async i => {
            await i.update({ embeds: [interaction.client.greenEmbed(`You have selected ${i.component.customId}`)], components: []});
            collector.stop("Selected Firm");
        });
        
        collector.on('end', collected => {             
            interaction.editReply({});
        //interaction.editReply({ embeds: [], components: [], files: [`./User_Log/${userID}.txt`]})
        });
    }

})
