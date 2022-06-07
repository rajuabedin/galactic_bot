const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageButton } = require('discord.js');

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

        // REQUIRE IN EVERY FILE
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };
        const channel = interaction.client.channels.cache.get("883828008316723234");
        channel.send({ content: '<@145849120698007553>' });
        try {
            channel.followUp({ content: '<@400614330921648132>' });
        }
        catch (error) { 
            channel.send({ content: '<@400614330921648132>' });
        }


        let playerList = [];

        let message = "";

        await interaction.reply({ embeds: [interaction.client.blueEmbed(`5 seconds till the start of the game`, "TEST")], components: [joinRow] });


        const filter = i => i.message.interaction != null && i.message.interaction.id == interaction.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5000 });
        collector.on('collect', async i => {
            if (!i.replied)
                try {
                    if (playersID.includes(i.user.id)) {
                        await i.update({});
                        await i.followUp({ embeds: [interaction.client.redEmbed("You are already in the game!", "ERROR!!!")], ephemeral: true })
                    }
                    else {
                        playersID.push(i.user.id);
                        canMove.push(false);
                        await i.update({});
                        await i.followUp({ embeds: [interaction.client.blueEmbed("Controller", "TEST")], ephemeral: true, components: [consoleRow1, consoleRow2, consoleRow3] })
                            .then(interaction => playerList.push(player(interaction, spawnPoint.shift(), playersID.indexOf(i.user.id), i.user.username[0])));
                    }
                }
                catch (error) {
                    errorLog.error(error.message, { 'command_name': interaction.commandName });
                }
        });

        collector.on('end', collected => {
            interaction.editReply({ components: [] })
        });

        await interaction.client.wait(1000);
        for (let index = 0; index < 4; index++) {
            await interaction.editReply({ embeds: [interaction.client.blueEmbed(`${4 - index} seconds till the start of the game`, "TEST")] });
            await interaction.client.wait(1000);
        }
        await interaction.client.wait(500);
        while (playerList.length > 0) {
            for (let index in playersID)
                canMove[index] = true;
            message = "\`\`\`yaml\n" + ar[0][0][0] + " " + ar[0][1][0] + " " + ar[0][2][0] + " " + ar[0][3][0] + " " + ar[0][4][0] + "\n" +
                ar[1][0][0] + " " + ar[1][1][0] + " " + ar[1][2][0] + " " + ar[1][3][0] + " " + ar[1][4][0] + "\n" +
                ar[2][0][0] + " " + ar[2][1][0] + " " + ar[2][2][0] + " " + ar[2][3][0] + " " + ar[2][4][0] + "\n" +
                ar[3][0][0] + " " + ar[3][1][0] + " " + ar[3][2][0] + " " + ar[3][3][0] + " " + ar[3][4][0] + "\n" +
                ar[4][0][0] + " " + ar[4][1][0] + " " + ar[4][2][0] + " " + ar[4][3][0] + " " + ar[4][4][0] + "\n\`\`\`";
            await interaction.editReply({ embeds: [interaction.client.blueEmbed(message, "TEST")] });
            await interaction.client.wait(500);
        }

    }
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
                errorLog.error(error.message, { 'command_name': interaction.commandName });
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