const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed, MessageAttachment } = require('discord.js');
const errorLog = require('../Utility/logger').logger;
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

        // START MACRO DETECTOR
        const width = 500
        const height = 80
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const canvas = createCanvas(width, height)
        const context = canvas.getContext('2d')
        context.fillStyle = '#00000'
        context.fillRect(0, 0, width, height)

        function generateString(length) {
            let result = ' ';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            return result;
        }

        function getRandomNumberBetween(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        const text = generateString(8);
        const textWidth = context.measureText(text).width
        context.fillRect(600 - textWidth / 2 - 10, 170 - 5, textWidth + 20, 120)
        context.textBaseline = 'middle';
        context.font = 'bold 20px Arial'
        context.textAlign = 'center'
        context.fillStyle = '#fff'
        context.fillText(text, 250, 40)

        const attachment = new MessageAttachment(canvas.toBuffer(), 'Never_gonna_give_you_up_Never_gonna_let_you_down_Never_gonna_run_around_and_desert_you_Never_gonna_make_you_cry_Never_gonna_say_goodbye_Never_gonna_tell_a_lie_and_hurt_you.png');

        const max_options = 5;

        var options = []

        var rightAnswerIndex = getRandomNumberBetween(1, 5)

        for (var i = 0; i < max_options; i++) {
            if (i !== rightAnswerIndex) {
                var tempData = generateString(8);
                options.push({
                    label: tempData,
                    value: tempData
                })
            } else {
                options.push({
                    label: text,
                    value: text
                })
            }
        }

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(options),
            );


        var textToEmbed = new MessageEmbed()
            .setColor('0x009dff')
            .setAuthor("Macro Detector", interaction.user.avatarURL())
            .setImage('attachment://Never_gonna_give_you_up_Never_gonna_let_you_down_Never_gonna_run_around_and_desert_you_Never_gonna_make_you_cry_Never_gonna_say_goodbye_Never_gonna_tell_a_lie_and_hurt_you.png')
            .setDescription("From the drow down menu please select the option that contain the same text shown on the image.\n**Image:**")


        interaction.reply({ embeds: [textToEmbed], components: [row], files: [attachment] });

        const filter = i => i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;
        let selected = false;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 25000 });

        collector.on('collect', async i => {
            selected = true;
            if (i.values[0] !== text) {
                return await interaction.editReply({ embeds: [interaction.client.redEmbedImage("Captcha validation failed. You have selected the wrong text.", "Validation Failed", i.user)], components: [], files: [] })
            } else {
                return await interaction.editReply({ embeds: [interaction.client.greenEmbedImage("You have successfully selected the right text.", "Validation Successfull", i.user)], components: [], files: [] })
            }
        });
        collector.on('end', collected => {
            if (!selected)
                interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [] , files: []});
        });
        // END MACRO DETECTOR



        /*} catch (error) {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }*/
    }
}

const buy = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('buy')
            .setLabel('BUY')
            .setStyle('SUCCESS'),
    );

const quantityButtonUp = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('1')
            .setLabel('+1')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10')
            .setLabel('+10')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('100')
            .setLabel('+100')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('1000')
            .setLabel('+1K')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('10000')
            .setLabel('+10K')
            .setStyle('PRIMARY'),
    );
const quantityButtonDown = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('-1')
            .setLabel('-1')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10')
            .setLabel('-10')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-100')
            .setLabel('-100')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-1000')
            .setLabel('-1K')
            .setStyle('DANGER'),
        new MessageButton()
            .setCustomId('-10000')
            .setLabel('-10K')
            .setStyle('DANGER'),
    );