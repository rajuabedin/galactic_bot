const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { ShardClientUtil, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const channelMSG = require('../Utility/discord-api-msg').sendMSG;
const channelEditMessage = require('../Utility/discord-api-msg').editMessage;


let ar = [
    [["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0]],
    [["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0]],
    [["[     ]", 0], ["[--X--]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0]],
    [["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0]],
    [["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0], ["[     ]", 0]]
];

let playersID = [];
let canMove = [];
const spawnPoint = [[0, 4, 1], [4, 0, 2]];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test5')
        .setDescription('Verve Testing'),

    async execute(interaction, userInfo, serverSettings) {
        let msg = await interaction.deferReply({ fetchReply: true });




        if (interaction.user.id != 833953239706763284) {
            return;
        }

        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        await interaction.editReply({ embeds: [interaction.client.yellowEmbed("testing", "TEST")], components: [consoleRow1] });


        const collector = msg.createMessageComponentCollector({ time: 5000 });

        let count = 0
        collector.on('collect', async i => {
            i.deferUpdate();
            count = 0;
            await interaction.editReply({ embeds: [interaction.client.yellowEmbed(i.customId, "Pressed")], components: [consoleRow1] });
        });

        collector.on('end', collected => {
            interaction.editReply({components: [] });
        });

        while (count < 10) {
            count++;
            collector.resetTimer({ time: 5000 });
            await interaction.editReply({ embeds: [interaction.client.yellowEmbed(count + "seconds", "Counting...")], components: [consoleRow1] });
            await interaction.client.wait(1000);

        }
    }

}

async function sendingMessage(channel, interaction) {
    channel.send(({ embeds: [interaction.client.blueEmbed("", "Looking for an enemy...")] }))
    await interaction.client.wait(1000);
    channel.editReply({ embeds: [interaction.client.yellowEmbed("", "Looking for an enemy...2")] });
}

async function player(interaction, pos, listIndex, alias) {
    let messageError = " ";
    let movX = 0, movY = 0;
    ar[pos[0]][pos[1]][1] += 1;
    let storedMessage = ar[pos[0]][pos[1]][0];
    ar[pos[0]][pos[1]][0] = `[--${alias}--]`;
    const filter2 = iPlayer => iPlayer.user.id == playersID[listIndex] && iPlayer.message.id == interaction.id;
    const collector2 = interaction.channel.createMessageComponentCollector({ filter2, time: 25000 });
    collector2.on('collect', async iPlayer => {
        collector2.resetTimer({ time: 25000 });
        if (!iPlayer.replied)
            try {
                if (canMove[listIndex] && iPlayer.user.id == playersID[listIndex]) {
                    movX = parseInt(iPlayer.customId);
                    movY = ~~(movX / 10);
                    movX -= movY * 10;
                    ar[pos[0]][pos[1]][1] -= 1;
                    ar[pos[0]][pos[1]][0] = storedMessage;
                    pos = [pos[0] + movY - 1, pos[1] + movX - 1];
                    if (pos[0] < 0 || pos[0] > 4 || pos[1] < 0 || pos[1] > 4) {
                        pos = [pos[0] - movY + 1, pos[1] - movX + 1];
                        ar[pos[0]][pos[1]][0] = `[--${alias}--]`;
                        ar[pos[0]][pos[1]][1] += 1;
                        messageError = "OUT of BOND!!!!";
                    }
                    else if (ar[pos[0]][pos[1]][0] == "[--X--]") {
                        pos = [pos[0] - movY + 1, pos[1] - movX + 1];
                        ar[pos[0]][pos[1]][0] = `[--${alias}--]`;
                        ar[pos[0]][pos[1]][1] += 1;
                        messageError = "You can not move there!";
                    }
                    else {
                        storedMessage = ar[pos[0]][pos[1]][0];
                        ar[pos[0]][pos[1]][0] = `[--${alias}--]`;
                        ar[pos[0]][pos[1]][1] += 1;
                        messageError = " ";

                    }
                    await iPlayer.update({ content: messageError, embeds: [] });
                }
                else
                    await iPlayer.update({});
            }
            catch (error) {
                await errorLog.error(error, interaction);
            }
    });

    collector2.on('end', collected => {
    });
}

const consoleRow1 = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('00')
            .setLabel("🡴")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('01')
            .setLabel("🡱")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('02')
            .setLabel("🡵")
            .setStyle('PRIMARY'),
    );
const consoleRow2 = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('10')
            .setLabel("🡰")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('11')
            .setLabel("⨭")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('12')
            .setLabel("🡲")
            .setStyle('PRIMARY'),
    );
const consoleRow3 = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('20')
            .setLabel("🡷")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('21')
            .setLabel("🡳")
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('22')
            .setLabel("🡶")
            .setStyle('PRIMARY'),
    );
const joinRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('join')
            .setLabel("JOIN")
            .setStyle('SUCCESS'),
    );