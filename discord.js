const { Client, Intents } = require('discord.js');
const config = require("./config.json")
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

async function sendScore(user, scoreObj, songObj, vf){
    let diffName = await getDiffName(scoreObj,songObj)
    let level = await getDiffLevel(scoreObj, songObj)
    client.channels.cache.get(config.channel_id).send(await buildEmbed(user, songObj,scoreObj,diffName,level,vf))
}

async function getDiffName(scoreObj, songObj){
    if(scoreObj.type < 3){
        return songObj.difficulties[scoreObj.type].diff
    }
    else{
        return songObj.difficulties[3].diff
    }
}

async function getDiffLevel(scoreObj, songObj){
  if(scoreObj.type < 3){
      return songObj.difficulties[scoreObj.type].level
  }
  else{
      return songObj.difficulties[3].level
  }
}

function getColor(diffName){
    switch (diffName) {
        case "NOVICE":
            return 6568625;
            break;
        case "ADVANCED":
            return 15922176;
            break;
        case "EXHAUST":
            return 16711680;
            break;
        case "MAXIMUM":
            return 16777215
            break;
        case "INFINITE":
            return 13640076;
            break;
        case "GRAVITY":
            return 16744740;
            break;
        case "HEAVENLY":
            return 4115455;
            break;
        case "VIVID":
            return 15685514
            break;
    }
}

function buildEmbed(user, songObj, scoreObj, diffName, level, vf){
    const lamps = ['FAILED', 'FAILED', 'CLEAR', 'EXCESSIVE CLEAR', 'ULTIMATE CHAIN', 'PERFECT ULTIMATE CHAIN']
    return {
        "content": null,
        "embeds": [
          {
            "title": "Nouveau Personal Best !",
            "color": getColor(diffName),
            "fields": [
              {
                "name": "Song",
                "value": songObj.title
              },
              {
                "name": "Difficulté",
                "value": `${diffName} ${level}`
              },
              {
                "name": "Score",
                "value": scoreObj.score.toString()
              },
              {
                "name": "Lamp",
                "value": lamps[scoreObj.clear]
              },
              {
                "name" : "Volforce",
                "value" : vf.toString()
              }
            ],
            "author": {
              "name": `${user.name} | Skill Lv ${user.skill}`,
              "icon_url": `https://fairyjoke.net/api/games/sdvx/apecas/${user.appeal}.png`
            },
            "thumbnail": {
              "url": `https://fairyjoke.net/api/games/sdvx/musics/${scoreObj.mid}/${diffName}.png`
            },
            "footer": {
              "text": `Lynarcade Server | Score ID : \`${scoreObj._id}\``
            }
          }
        ],
        "username": "Maxima",
        "avatar_url": "https://static.wikia.nocookie.net/sound-voltex/images/3/3b/Maxima.jpg"
      }
}

client.login(config.discord_token);

module.exports = { sendScore }