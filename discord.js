const { Client, Intents } = require('discord.js');
const { MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const { getTrackedLB, getTrackedScores, searchSong } = require('./kamai.js')
const config = require("./config.json");
const { getSongInformation } = require('./fairyjoke.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
  console.log('Connected to Discord');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  switch (commandName) {
    case "lb":
      await interaction.reply(await buildLBEmbed());
      break;
    case "clb":
      let mid = interaction.options.getInteger('mid');
      let diff = interaction.options.getString('diff');
      await interaction.reply(await buildSongLBEmbed(mid, diff));
      break;
    case "search":
      let str = interaction.options.getString('song');
      let song = await searchSong(str)
      await interaction.reply(await buildSongEmbed(song))
  }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
  switch (interaction.customId.split('-')[0]){
    case "LB" :
      const mid = interaction.customId.split('-')[1];
      const diff = interaction.customId.split('-')[2]
	    await interaction.reply(await buildSongLBEmbed(mid, diff));
      break;
  }
});

async function sendScore(user, scoreObj, songObj, vf, rank) {
  let diffName = await getDiffName(scoreObj, songObj)
  let level = await getDiffLevel(scoreObj, songObj)
  const file = new MessageAttachment(`./assets/grade_${scoreObj.grade}.png`);
  client.channels.cache.get(config.channel_id).send(await buildPBEmbed(user, songObj, scoreObj, diffName, level, vf, rank, file))
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

async function buildPBEmbed(user, songObj, scoreObj, diffName, level, vf, rank, file) {
  const kamaiRank = await getKamaiRank(user, diffName, scoreObj)
  const row = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('primary')
      .setLabel('Leaderboard')
      .setStyle('PRIMARY')
      .setCustomId(`LB-${scoreObj.mid}-${getShortDiffName(diffName)}`)
  );
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
            "value": boldScore(scoreObj.score.toString()),
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
            "value": `**#${rank.rank}**/${rank.total}`,
            "inline": true
          },
          {
            "name": "Rank Français",
            "value": `**#${kamaiRank.rank}**/${kamaiRank.total}`,
            "inline": true
          }
        ],
        "author": {
          "name": `${user.name} - Skill Lv ${user.skill} - VF ${user.volforce}`,
          "icon_url": `attachment://grade_${scoreObj.grade}.png`
        },
        "image": {
          "url": `https://fairyjoke.net/api/games/sdvx/musics/${scoreObj.mid}/${diffName}.png`,
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
    "files": [file],
    "components" : [row]
  }
}

async function buildLBEmbed() {
  const LB = await getTrackedLB();
  let users = "";
  let vf = "";
  let dans = "";
  for (i in LB) {
    const obj = LB[i];
    users += `${i == 0 ? `**#${parseInt(i) + 1} ${obj.username}**` : `#${parseInt(i) + 1} ${obj.username}`}\n`
    vf += `${(Math.round((obj.ratings.VF6 + Number.EPSILON) * 1000) / 1000).toFixed(3)}\n`
    if (typeof obj.classes.dan !== "undefined") {
      dans += `${obj.classes.dan !== 11 ? `Skill Lv ${obj.classes.dan + 1}` : "Skill Lv ∞"}\n`
    }
    else {
      dans += "--\n";
    }
  }
  return {
    "content": null,
    "embeds": [
      {
        "title": `Leaderboard Français`,
        "color": 16777215,
        "fields": [
          {
            "name": "Joueur",
            "value": users,
            "inline": true
          },
          {
            "name": "Volforce",
            "value": vf,
            "inline": true
          },
          {
            "name": "Dan",
            "value": dans,
            "inline": true
          }
        ],
        "author": {
          "name": `Kamaitachi Leaderboard`,
          "icon_url": `https://cdn.kamaitachi.xyz/logos/logo-mark.png`
        },
      }
    ],
    "username": "Maxima",
    "avatar_url": "https://static.wikia.nocookie.net/sound-voltex/images/3/3b/Maxima.jpg"
  }
}

async function buildSongLBEmbed(mid, diff) {
  const songInfo = await getSongInformation(mid)
  diff = getInfDiff(songInfo, diff)
  const LB = await getTrackedScores(mid, diff);
  if (!LB) return {content: 'Chart not found.'}
  let users = "";
  let score = "";
  let global = "";
  for (i in LB) {
    const obj = LB[i];
    users += `${i == 0 ? `**#${parseInt(i) + 1} ${obj.username}**` : `#${parseInt(i) + 1} ${obj.username}`}\n`
    score += `${boldScore(obj.scoreData.score.toString())}\n`
    global += `${obj.rankingData.rank == 1 ? `**#${obj.rankingData.rank}**/${obj.rankingData.outOf}` : `#${obj.rankingData.rank}/${obj.rankingData.outOf}`}\n`
  }
  return {
    "content": null,
    "embeds": [
      {
        "title": `Leaderboard Français`,
        "description": `${songInfo.artist} - ${songInfo.title} [${diff}]`,
        "color": getColor(getLongDiffName(diff)),
        "fields": [
          {
            "name": "Joueur",
            "value": users,
            "inline": true
          },
          {
            "name": "Score",
            "value": score,
            "inline": true
          },
          {
            "name": "Global",
            "value": global,
            "inline": true
          },

        ],
        "timestamp": new Date(),
        "author": {
          "name": `Kamaitachi Leaderboard`,
          "icon_url": `https://cdn.kamaitachi.xyz/logos/logo-mark.png`
        },
        "image": {
          "url": `https://fairyjoke.net/api/games/sdvx/musics/${mid}/${getLongDiffName(diff)}.png`,
        },
        "footer": {
          "text": `Music ID : ${mid}`
        }
      }
    ],
    "username": "Maxima",
    "avatar_url": "https://static.wikia.nocookie.net/sound-voltex/images/3/3b/Maxima.jpg"
  }
}

async function buildSongEmbed(songObj){
  if (!songObj) return {content: 'Chart not found.'}
  const songInfo = await getSongInformation(songObj.id)
  let diffs = ""
  const row = new MessageActionRow()
  for (i in songInfo.difficulties){
    const diff = getShortDiffName(songInfo.difficulties[i].diff)
    const level = songInfo.difficulties[i].level
    diffs += `[${diff}] **${level}**\n`
    row.addComponents(
      new MessageButton()
        .setCustomId('primary')
        .setLabel(`${diff}`)
        .setStyle('SECONDARY')
        .setCustomId(`LB-${songObj.id}-${diff}`)
    );
  }
  return {
    "content": null,
    "embeds": [
      {
        "title": `${songInfo.artist} - ${songInfo.title}`,
        "color": 16777215,
        "fields": [
          {
            "name": "Difficulties",
            "value": diffs,
            "inline": true
          },
          {
            "name": "BPM",
            "value": songInfo.bpm,
            "inline": true
          }
        ],
        "timestamp": new Date(),
        "author": {
          "name": `Song Search`,
          "icon_url": `https://cdn.kamaitachi.xyz/logos/logo-mark.png`
        },
        "image": {
          "url": `https://fairyjoke.net/api/games/sdvx/musics/${songObj.id}/NOVICE.png`,
        },
        "footer": {
          "text": `Music ID : ${songObj.id}`
        }
      }
    ],
    "components" : [row],
    "username": "Maxima",
    "avatar_url": "https://static.wikia.nocookie.net/sound-voltex/images/3/3b/Maxima.jpg"
  }
}

function truncate(str) {
  if (str.length > 25) {
    return str.substring(0, 22) + "..."
  }
  return str
}

function boldScore(str) {
  return `**${str.substring(0, 3)}**${str.substring(3)}`
}

function getLongDiffName(str) {
  switch (str) {
    case "NOV":
      return "NOVICE"
    case "ADV":
      return "ADVANCED"
    case "EXH":
      return "EXHAUST"
    case "MXM":
      return "MAXIMUM"
    case "INF":
      return "INFINITE"
    case "GRV":
      return "GRAVITY"
    case "HVN":
      return "HEAVENLY"
    case "VVD":
      return "VIVID"
  }
}

function getShortDiffName(str) {
  switch (str) {
    case "NOVICE":
    case "ADVANCED":
    case "EXHAUST":
      return str.slice(0, 3).toUpperCase()
    case "MAXIMUM":
      return "MXM"
    case "INF":
      return "INFINITE"
    case "GRAVITY":
      return "GRV"
    case "HEAVENLY":
      return "HVN"
    case "VIVID":
      return "VVD"
  }
}

async function getKamaiRank(user,diffName,scoreObj){
  const LB = await getTrackedScores(scoreObj.mid, getShortDiffName(diffName));
  const total = LB.length
  console.log(LB);
  for (i in LB) {
    const obj = LB[i];
    if (obj.username.toLowerCase().substring(0,4) === user.name.toLowerCase().substring(0,4)) LB.splice(i,1)
  }
  for (i in LB){
    const obj = LB[i];
    console.log({rank : (parseInt(i) + 1).toString(), total})
    if (scoreObj.score > obj.scoreData.score) return {rank : (parseInt(i) + 1).toString(), total}
  }
  return {rank : total, total}
}

function getInfDiff(songInfo, diff){
  if (diff !== 'MXM') return diff;
  if (typeof songInfo.difficulties[3] !== "undefined") return getShortDiffName(songInfo.difficulties[3].diff);
  return ""
}

client.login(config.discord_token);

module.exports = { sendScore }