const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '..', 'db', 'config.json');

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(configPath, '{}');
      return {};
    }
    throw err;
  }
}

async function saveConfig(data) {
  await fs.writeFile(configPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "setup",
  description: "Setup the suggestion channels (review and approved) and reviewer role",
  async execute(message, args) {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You need administrator permissions to run this command.");
    }

    const filter = m => m.author.id === message.author.id;

    try {
      await message.reply("Please send the ID of the **channel where suggestions will be sent for review**.");
      const collectedReview = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const reviewChannelId = collectedReview.first().content.trim();

      const reviewChannel = message.guild.channels.cache.get(reviewChannelId);
      if (!reviewChannel) return message.reply("Invalid channel ID for review channel. Setup cancelled.");

      await message.reply("Please send the ID of the **channel where approved suggestions will be published**.");
      const collectedApproved = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const approvedChannelId = collectedApproved.first().content.trim();

      const approvedChannel = message.guild.channels.cache.get(approvedChannelId);
      if (!approvedChannel) return message.reply("Invalid channel ID for approved channel. Setup cancelled.");

      await message.reply("Please send the ID of the **event notificarions role** (the role that will be notified or referenced).");
      const collectedRole = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
      const reviewerRoleId = collectedRole.first().content.trim();

      const role = message.guild.roles.cache.get(reviewerRoleId);
      if (!role) return message.reply("Invalid role ID. Setup cancelled.");

      const config = await loadConfig();
      config[message.guild.id] = {
        reviewChannelId,
        approvedChannelId,
        reviewerRoleId,
      };
      await saveConfig(config);

      await message.reply(
        `✅ Setup complete:\n- Review Channel: <#${reviewChannelId}>\n- Approved Channel: <#${approvedChannelId}>\n- Reviewer Role: <@&${reviewerRoleId}>`
      );
    } catch (err) {
      console.error("[ERROR] Setup failed:", err);
      return message.reply("Setup timed out or failed. Please run the command again.");
    }
  }
};
