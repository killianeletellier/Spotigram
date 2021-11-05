const axios = require("axios");
const fs = require('fs');
const Instagram = require('instagram-web-api');

async function isPlaybackPlaying() {
    let data = JSON.parse(fs.readFileSync("data.json").toString());

    const res = await axios.get("https://api.spotify.com/v1/me/player/", {
        headers: {
            "Authorization": `Bearer ${data.token}`
        }
    });

    return res.data.is_playing;
}

function getCurrentlyPlaying(client) {
    let data = JSON.parse(fs.readFileSync("data.json").toString());

    axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
            "Authorization": `Bearer ${data.token}`
        }
    })
        .then(async res => {
            console.log("[SPOTIFY] Current track gotten");

            if (res.data != "") {
                var playbackPaying = await isPlaybackPlaying();
            }

            const biography = (res.data === "" || playbackPaying === false) ? "Currently listening nothing." : `Currently listening ${res.data.item.name} from ${res.data.item.artists[0].name} on Spotify!`;

            client.getProfile()
                .then(profile => {
                    if (profile.biography === biography) return console.log("[BIOGRAPHY] Didn't need to change the bio");

                    client.updateProfile({
                        biography: biography,
                        email: data.email
                    })
                        .then(() => {
                            console.log("[BIOGRAPHY] Bio changed.");
                        })
                        .catch(err => {
                            console.log("[INSTAGRAM] Couldn't edit bio.");
                        });
                })
                .catch(err => {
                    console.log("[INSTAGRAM] Couldn't fetch profile.");
                });
        })
        .catch(err => {
            console.log("[SPOTIFY] Couldn't get current track. Refreshing token.");

            refresh_token();
        });
}

function refresh_token() {
    let data = JSON.parse(fs.readFileSync("data.json").toString());

    const params = new URLSearchParams();

    params.append("grant_type", "refresh_token");
    params.append("refresh_token", data.refresh_token);
    params.append("client_id", data.client_id);
    params.append("client_secret", data.client_secret);

    axios.post("https://accounts.spotify.com/api/token", params)
        .then(res => {
            console.log("[SPOTIFY] Token refreshed gotten");

            let data = JSON.parse(fs.readFileSync("data.json").toString());

            data.token = res.data.access_token;

            fs.writeFileSync("data.json", JSON.stringify(data));
        })
        .catch(() => {
            console.log("[SPOTIFY] Couldn't get a refreshed token");
        });
}

let data = JSON.parse(fs.readFileSync("data.json").toString());

const username = data.instaUsername;
const password = data.instaPassword;

const client = new Instagram({ username, password });

client.login()
    .then(() => {
        console.log("[LAUNCHING] Connected to Instagram");
        setInterval(() => {
            getCurrentlyPlaying(client);
        }, 15000);
    });