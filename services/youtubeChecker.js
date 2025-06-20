// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');
// const cron = require('node-cron');
// const { Client, GatewayIntentBits } = require('discord.js');
// require('dotenv').config();

// const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
// const NOTIFY_CHANNEL_ID = config.youtubeNotifyChannelId;

// const channelsFile = path.join(__dirname, '../db/youtubeChannels.json');
// const notifiedFile = path.join(__dirname, '../db/notifiedVideos.json');

// // Load or init channel list
// function loadYoutubeChannels() {
//   if (!fs.existsSync(channelsFile)) fs.writeFileSync(channelsFile, '[]');
//   return JSON.parse(fs.readFileSync(channelsFile, 'utf-8'));
// }

// // Load or init notified videos
// function loadNotifiedVideos() {
//   if (!fs.existsSync(notifiedFile)) fs.writeFileSync(notifiedFile, '{}');
//   return JSON.parse(fs.readFileSync(notifiedFile, 'utf-8'));
// }

// function saveNotifiedVideos(data) {
//   fs.writeFileSync(notifiedFile, JSON.stringify(data, null, 2));
// }

// async function checkYoutubeChannels(client) {
//   const channels = loadYoutubeChannels();
//   const notified = loadNotifiedVideos();

//   for (const entry of channels) {
//     const { channelId, customName } = entry;

//     try {
//       const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=1`;
//       const res = await axios.get(url);
//       const video = res.data.items.find(item => item.id.kind === 'youtube#video');
//       if (!video) continue;

//       const videoId = video.id.videoId;

//       if (notified[channelId] !== videoId) {
//         const notifyChannel = await client.channels.fetch(NOTIFY_CHANNEL_ID);

//         await notifyChannel.send({
//           content: `🎬 New video from **${customName || channelId}**:\nhttps://youtu.be/${videoId}`
//         });

//         notified[channelId] = videoId;
//         saveNotifiedVideos(notified);
//         console.log(`[LOG] New video from: ${channelId}: ${videoId}`);
//       }
//     } catch (err) {
//       console.error(`[ERROR] Failed to check channel ${channelId}:`, err.response?.data || err);
//     }
//   }
// }

// function startYoutubeMonitor(client) {
//   cron.schedule('*/5 * * * *', () => {
//     checkYoutubeChannels(client);
//   });
//   console.log('[INFO] YouTube monitor started, checking every 5 minutes.');
// }

// module.exports = { startYoutubeMonitor };