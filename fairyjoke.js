const axios = require('axios');
const baseURL = "https://fairyjoke.net/api/games/sdvx/musics/";

async function getSongInformation(mid){
    const res = await axios.get(`${baseURL}${mid}`)
    return res.data;
}

module.exports = { getSongInformation }