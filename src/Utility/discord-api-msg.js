require('dotenv').config();
const fetch = require("node-fetch");

/**
 * 
 * @param {import('discord-api-types').Snowflake} channelID - The channel ID to send the message to
 * @param {Dictionary} requestBody - Request body to send, need to be a dictionary
 */
async function sendMSG(channelID, requestBody) {

    var data = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            response = response.json();
            if (response.status == 200) {
                response['code'] = null;
            }
            return response;
        })
        .then(data => { return data });
    return data;
}

/**
 * 
 * @param {Integer} userID - The user ID to send the message to
 * @param {Any} interaction - For db connection
 * @returns {Dictionary} - 'code' value is null if successful, otherwise it contains the error code
 */
async function getDMChannel(userID, interaction) {
    const requestBody = {
        "recipient_id": userID
    }
    var data = await fetch(`https://discord.com/api/v9/users/@me/channels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            response = response.json();
            if (response.status == 200) {
                response['code'] = null;
                interaction.client.databaseEditData('update users set dm_channel = ? where user_id = ?', [response.id, userID]);
            }
            return response;
        })
        .then(data => { return data });

    return data;
}

/**
 * 
 * @param {import('discord-api-types').Snowflake} channelID 
 * @param {import('discord-api-types').Snowflake} messageID 
 * @param {Dictionary} requestBody 
 * @returns 
 */
async function editMessage(channelID, messageID, requestBody) {
    var data = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages/${messageID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            response = response.json();
            if (response.status == 200) {
                response['code'] = null;
            }
            return response;
        })
        .then(data => { return data });
    return data;
}

async function deleteMessage(channelID, messageID, reason = "Not specified") {
    var data = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages/${messageID}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json',
            'X-Audit-Log-Reason': reason
        }
    })
        .then(response => {
            response = response.json();
            if (response.status == 200) {
                response['code'] = null;
            }
            return response;
        })
        .then(data => { return data });
    return data;
}

module.exports = {
    sendMSG,
    getDMChannel,
    deleteMessage,
    editMessage
}