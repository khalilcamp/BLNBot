const fs = require('fs').promises;
const path = require('path');

const ytConfigPath = path.join(__dirname, '..', 'db', 'youtube_config.json');

async function loadYTConfig() {
  try {
    const data = await fs.readFile(ytConfigPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(ytConfigPath, '{}');
      return {};
    }
    throw err;
  }
}

async function saveYTConfig(data) {
  await fs.writeFile(ytConfigPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "youtubersetup",
  description: "Configure YouTube channel IDs to monitor for new videos",
  async execute(message) {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You need administrator permissions to run this command.");
    }

    const filter = m => m.author.id === message.author.id;
    const guildId = message.guild.id;

    try {
      await message.reply("📺 Send the **text channel ID** where video notifications should be posted:");
      const collectedChannel = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const notificationChannelId = collectedChannel.first().content.trim();

      const channel = message.guild.channels.cache.get(notificationChannelId);
      if (!channel || channel.type !== 0) { // ChannelType.GuildText
        return message.reply("❌ Invalid text channel ID. Setup cancelled.");
      }

      await message.reply("📹 Now send the **YouTube channel ID(s)** to monitor, separated by commas:");
      const collectedIDs = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const ytChannels = collectedIDs.first().content.trim().split(",").map(s => s.trim());

      const config = await loadYTConfig();
      config[guildId] = {
        notificationChannelId,
        ytChannels
      };
      await saveYTConfig(config);

      await message.reply(`✅ YouTube setup complete:\n- Notification Channel: <#${notificationChannelId}>\n- YouTube Channels: ${ytChannels.join(', ')}`);
    } catch (err) {
      console.error("[ERROR] YouTube setup failed:", err);
      return message.reply("❌ Setup timed out or failed. Please run the command again.");
    }
  }
};