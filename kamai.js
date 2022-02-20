const axios = require('axios');
const config = require('./config.json')
const auth_header = { headers: { Authorization: `Bearer ${config.kamaitachi_api_key}` } }
const kamai_baseURL = "https://kamaitachi.xyz/api/v1/";

async function statusCheck() {
    const res = await axios.get(`${kamai_baseURL}status`, auth_header)
    const status = res.data.body;
    if (res.data.success) {
        console.log(`Connected to Kamaitachi ${status.version} as userID ${status.whoami}`)
    }
}

async function getTrackedLB() {
    const res = await axios.get(`${kamai_baseURL}games/sdvx/Single/leaderboard`, auth_header)
    const stats = res.data.body.gameStats;
    const users = res.data.body.users
    let tracked = [];
    const final = [];
    for (i in stats) {
        const obj = stats[i];
        if (config.kamai_users_list.indexOf(obj.userID) !== -1) {
            tracked.push(obj)
        }
    }
    tracked = tracked.sort(sortByVF)
    for (i in tracked) {
        const trackedStats = tracked[i];
        for (j in users) {
            const user = users[j];
            if (user.id === trackedStats.userID) {
                trackedStats.username = user.username
                final.push(trackedStats)
            }
        }
    }
    return final
}

async function getTrackedScores(mid, diff) {
    const chartID = await getChartID(mid, diff);
    if (!chartID) return false
    const res = await axios.get(`${kamai_baseURL}games/sdvx/Single/charts/${chartID}/pbs`, auth_header)
    const users = res.data.body.users;
    const scores = res.data.body.pbs;
    let tracked = [];
    const final = [];
    for (i in scores) {
        const obj = scores[i];
        if (config.kamai_users_list.indexOf(obj.userID) !== -1) {
            tracked.push(obj)
        }
    }
    tracked = tracked.sort(sortByScore)
    for (i in tracked) {
        const trackedScores = tracked[i];
        for (j in users) {
            const user = users[j];
            if (user.id === trackedScores.userID) {
                trackedScores.username = user.username
                final.push(trackedScores)
            }
        }
    }
    return final
}

async function getChartID(mid, diff) {
    try{
        const res = await axios.get(`${kamai_baseURL}games/sdvx/Single/songs/${mid}`, auth_header)
        const charts = res.data.body.charts;
        for (i in charts) {
            const obj = charts[i];
            if (obj.difficulty === diff) return obj.chartID
        }
    }
    catch{
        return false
    }
}


function sortByVF(a, b) {
    if (a.ratings.VF6 < b.ratings.VF6) {
        return 1;
    }
    if (a.ratings.VF6 > b.ratings.VF6) {
        return -1;
    }
    return 0
}

function sortByScore(a, b) {
    if (a.scoreData.score < b.scoreData.score) {
        return 1;
    }
    if (a.scoreData.score > b.scoreData.score) {
        return -1;
    }
    if (a.timeAchived < b.timeAchived) {
        return 1;
    }
    if (a.timeAchived > b.timeAchived) {
        return -1;
    }
    return 0
}

statusCheck();

module.exports = { getTrackedScores, getTrackedLB }