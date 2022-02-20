const fs = require('fs');
const { watch } = require('fs/promises');
const { getSongInformation } = require('./fairyjoke.js')
const { sendScore } = require('./discord.js')
const MDB = require('./music_db.json');
const { ApplicationCommandPermissionsManager } = require('discord.js');
const rawDB = fs.readFileSync('../savedata/sdvx@asphyxia.db');
const kamai = require('./kamai.js')
let currentDB;
let users;

start();

async function start() {
    currentDB = await parseDB(rawDB);
    users = await loadUsers()
    console.log(`Tracking ${users.length} users.`)
    startWatcher();
}

async function parseDB(DB) {
    DB = DB.slice(0, -1)
    let parsed = `[${DB}]`;
    let arr = parsed.split('\n');
    let newarr = [];
    for (i in arr) {
        if (i == arr.length - 1) {
            newarr.push(`${arr[i]}`);
        }
        else {
            newarr.push(`${arr[i]},`);
        }
    }
    let formatted = JSON.parse(newarr.join("\n"));
    return formatted;
}


async function loadUsers() {
    const tempUsers = []
    for (i in currentDB) {
        const obj = currentDB[i];
        if (obj.collection === "profile") {
            if (tempUsers.map(function (e) { return e.refid; }).indexOf(obj.__refid) === -1) {
                tempUsers.push({ name: obj.name, appeal: obj.appeal, refid: obj.__refid, skill: 0, volforce: 0 })
            };
        }
    }
    for (i in currentDB) {
        const obj = currentDB[i];
        if (obj.collection === "skill") {
            for (i in tempUsers) {
                if (tempUsers[i].refid === obj.__refid && obj.level > tempUsers[i].skill) {
                    tempUsers[i].skill = obj.level !== 12 ? obj.level : "∞";
                }
            }
        }
    }
    finalUsers = await appendVolforce(tempUsers)
    return finalUsers
}

async function appendVolforce(users) {
    for (i in users) {
        const obj = users[i];
        const scores = await getScores(obj.refid);
        const VF = await calculateVolforce(scores);
        obj.volforce = VF
    }
    return users
}

async function getScores(refid) {
    const scores = []
    for (i in currentDB) {
        const obj = currentDB[i];
        if (obj.collection === "music" && obj.__refid === refid) {
            scores.push(obj)
        }
    }
    return scores
}

async function startWatcher() {
    try {
        const watcher = watch('./../savedata/sdvx@asphyxia.db');
        for await (const event of watcher)
            updateChanges()
    } catch (err) {
        throw err;
    }
}

async function updateChanges() {
    let rawNewDB = fs.readFileSync('./../savedata/sdvx@asphyxia.db');
    let newDB = await parseDB(rawNewDB)
    if (newDB.length !== currentDB.length) {
        const obj = newDB[newDB.length - 1];
        if (obj.collection === "music") {
            const bestScore = await scanBestScore(obj.mid, obj.type, obj.__refid)
            if (obj.score > bestScore) {
                const info = await getSongInformation(obj.mid);
                let user;
                for (i in users) {
                    if (users[i].refid === obj.__refid) user = users[i];
                }
                let vf = (await singleScoreVolforce(obj) / 100)
                vf = toFixed(vf, 3)
                let rank = await getServerRank(obj)
                await sendScore(user, obj, info, vf, rank)
            }
        }
    }
    currentDB = newDB;
}

async function scanBestScore(mid, type, refid) {
    let bestScore = 0
    const scores = await getScores(refid);
    for (i in scores) {
        const score = scores[i]
        if (score.mid === mid && score.type === type && score.score > bestScore) bestScore = score.score
    }
    return bestScore
}

async function calculateVolforce(score_db) {
    const volforceArray = []
    for (var i in score_db) {
        var temp = singleScoreVolforce(score_db[i]);
        temp = parseFloat(toFixed(temp, 1));
        volforceArray.push(temp);
    }
    volforceArray.sort(function (a, b) { return b - a });
    var VF = 0;
    if (volforceArray.length > 50) {
        for (var i = 0; i < 50; i++) {
            VF += volforceArray[i];
        }
    } else {
        for (var i = 0; i < volforceArray.length; i++) {
            VF += volforceArray[i];
        }
    }
    VF /= 100;
    return toFixed(VF, 3);
}


function singleScoreVolforce(score) {
    var level = getSongLevel(score.mid, score.type);
    var tempVF = parseInt(level) * (parseInt(score.score) / 10000000) * getGrade(score.grade) * getMedal(score.clear) * 2;
    return tempVF;
}

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function getGrade(grade) {
    switch (grade) {
        case 0:
            return 0;
        case 1:
            return 0.80;
        case 2:
            return 0.82;
        case 3:
            return 0.85;
        case 4:
            return 0.88;
        case 5:
            return 0.91;
        case 6:
            return 0.94;
        case 7:
            return 0.97;
        case 8:
            return 1.00;
        case 9:
            return 1.02;
        case 10:
            return 1.05;
    }
}

function getMedal(clear) {
    switch (clear) {
        case 0:
            return 0;
        case 1:
            return 0.5;
        case 2:
            return 1.0;
        case 3:
            return 1.02;
        case 4:
            return 1.05;
        case 5:
            return 1.10;
    }
}

function getSongLevel(musicid, type) {
    var result = MDB["mdb"]["music"].filter(object => object["@id"] == musicid);
    if (result.length == 0) {
        return "1"
    }
    var diffnum = 0;
    switch (type) {
        case 0:
            if (!(result[0]["difficulty"]["novice"] === undefined))
                diffnum = result[0]["difficulty"]["novice"]["difnum"]["#text"]
            // return result[0]["difficulty"]["novice"]["difnum"]["#text"]
            break;
        case 1:
            if (!(result[0]["difficulty"]["advanced"] === undefined))
                diffnum = result[0]["difficulty"]["advanced"]["difnum"]["#text"]
            // return result[0]["difficulty"]["advanced"]["difnum"]["#text"]
            break;
        case 2:
            if (!(result[0]["difficulty"]["exhaust"] === undefined))
                diffnum = result[0]["difficulty"]["exhaust"]["difnum"]["#text"]
            // return result[0]["difficulty"]["exhaust"]["difnum"]["#text"]
            break;
        case 3:
            if (!(result[0]["difficulty"]["infinite"] === undefined))
                diffnum = result[0]["difficulty"]["infinite"]["difnum"]["#text"]
            // return result[0]["difficulty"]["infinite"]["difnum"]["#text"]
            break;
        case 4:
            if (!(result[0]["difficulty"]["maximum"] === undefined))
                diffnum = result[0]["difficulty"]["maximum"]["difnum"]["#text"]
            // return result[0]["difficulty"]["maximum"]["difnum"]["#text"]
            break;
    }
    if (diffnum == 0) {
        diffnum = 1;
    }
    return diffnum;

}

async function getServerRank(score){
    let scores = []
    for (i in currentDB){
        const obj = currentDB[i];
        if (obj.collection === "music" && obj.mid === score.mid && obj.type === score.type && obj.__refid !== score.__refid) scores.push(obj)
    }
    scores.push(score)
    sortedScores = scores.sort(compare);
    for (i in sortedScores){
        const obj = sortedScores[i]
        if (obj._id === score._id) return {rank : (sortedScores.length - i).toString(), total : scores.length.toString()}
    }
}

function compare(a,b){
    if ( a.score < b.score ){
        return -1;
    }
    if ( a.score > b.score ){
        return 1;
    }
    if ( a.updatedAt.$$date < b.updatedAt.$$date){
        return -1;
    }
    if (a.updatedAt.$$date > b.updatedAt.$$date){
        return 1;
    }
    return 0
}