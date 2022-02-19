const { Client, Intents } = require('discord.js');
const { MessageAttachment } = require('discord.js');
const config = require("./config.json")
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

async function sendScore(user, scoreObj, songObj, vf, rank) {
  let diffName = await getDiffName(scoreObj, songObj)
  let level = await getDiffLevel(scoreObj, songObj)
  const file = new MessageAttachment(`./assets/grade_${scoreObj.grade}.png`);
  client.channels.cache.get(config.channel_id).send(await buildEmbed(user, songObj, scoreObj, diffName, level, vf, rank, file))
}

async function getDiffName(scoreObj, songObj) {
  if (scoreObj.type < 3) {
    return songObj.difficulties[scoreObj.type].diff
  }
  else {
    return songObj.difficulties[3].diff
  }
}

async function getDiffLevel(scoreObj, songObj) {
  if (scoreObj.type < 3) {
    return songObj.difficulties[scoreObj.type].level
  }
  else {
    return songObj.difficulties[3].level
  }
}

function getColor(diffName) {
  switch (diffName) {
    case "NOVICE":
      return 6568625;
    case "ADVANCED":
      return 15922176;
    case "EXHAUST":
      return 16711680;
    case "MAXIMUM":
      return 16777215
    case "INFINITE":
      return 13640076;
    case "GRAVITY":
      return 16744740;
    case "HEAVENLY":
      return 4115455;
    case "VIVID":
      return 15685514
  }
}

function buildEmbed(user, songObj, scoreObj, diffName, level, vf, rank, file) {
  const lamps = ['FAILED', 'FAILED', 'CLEAR', 'EXCESSIVE CLEAR', 'ULTIMATE CHAIN', 'PERFECT ULTIMATE CHAIN']
  return {
    "content": null,
    "embeds": [
      {
        "title": `Nouveau Personal Best !`,
        "color": getColor(diffName),
        "fields": [
          {
            "name": "Song",
            "value": `${truncate(songObj.artist)} - ${truncate(songObj.title)}`,
            "inline": true
          },
          {
            "name": "Difficulté",
            "value": `${diffName} ${level}`,
            "inline": true
          },
          {
            "name": '\u200b',
            "value": '\u200b',
            "inline": true,
          },
          {
            "name": "Score",
            "value": scoreObj.score.toString(),
            "inline": true
          },
          {
            "name": "Lamp",
            "value": lamps[scoreObj.clear],
            "inline": true
          },
          {
            "name": "Volforce",
            "value": vf.toString(),
            "inline": true
          },
          {
            "name": "Rank Lynarcade",
            "value": `**#${rank}**`,
            "inline": true
          },
          {
            "name": "Rank Français",
            "value": `**--**`,
            "inline": true
          }
        ],
        "author": {
          "name": `${user.name} - Skill Lv ${user.skill} - VF ${user.volforce}`,
          "icon_url": `attachment://grade_${scoreObj.grade}.png`
        },
        "image": {
          "url": `https://fairyjoke.net/api/games/sdvx/musics/${scoreObj.mid}/${diffName}.png`,
          "height": 100
        },
        "thumbnail": {
          "url": `https://fairyjoke.net/api/games/sdvx/apecas/${user.appeal}.png`
        },
        "footer": {
          "text": `Music ID : ${scoreObj.mid} | Score ID : ${scoreObj._id}`
        }
      }
    ],
    "username": "Maxima",
    "avatar_url": "https://static.wikia.nocookie.net/sound-voltex/images/3/3b/Maxima.jpg",
    "files": [file]
  }
}

function truncate(str) {
  if (str.length > 25) {
    return str.substring(0, 22) + "..."
  }
  return str
}


client.login(config.discord_token);

module.exports = { sendScore }