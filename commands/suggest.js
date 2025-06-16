const fs = require("fs");
const path = require("path");

const suggestionsPath = path.join(__dirname, "..", "suggestions.json");
const configPath = path.join(__dirname, "..", "db", "config.json");

function loadSuggestions() {
  if (!fs.existsSync(suggestionsPath)) {
    fs.writeFileSync(suggestionsPath, "{}");
  }
  const data = fs.readFileSync(suggestionsPath);
  return JSON.parse(data);
}

function saveSuggestions(suggestions) {
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
}

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    return {};
  }
  const data = fs.readFileSync(configPath);
  return JSON.parse(data);
}

module.exports = {
  name: "suggest",
  description: "Suggest a new feature or improvement",
  async execute(message, args) {
    const content = args.join(" ");
    if (!content) {
      return message.reply("Please provide a suggestion.");
    }

    const guildId = message.guild.id;

    const config = loadConfig();
    if (!config[guildId] || !config[guildId].reviewChannelId) {
      return message.reply(
        "Suggestion system is not set up yet. Please contact an administrator."
      );
    }

    const reviewChannel = message.guild.channels.cache.get(
      config[guildId].reviewChannelId
    );
    if (!reviewChannel) {
      return message.reply(
        "Configured review channel not found. Please contact an administrator."
      );
    }

    const suggestions = loadSuggestions();
    if (!suggestions[guildId]) {
      suggestions[guildId] = [];
    }
    const nextId = suggestions[guildId].length + 1;

    const embed = {
      color: 0x00b0f4,
      author: {
        name: `Suggestion from ${message.author.tag}`,
        icon_url: message.author.displayAvatarURL({ dynamic: true }),
      },
      description: content,
      image: {
        url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1otHRl7NeVPRtDBK6bHd_WNWQs-wrxCFJ2A&s",
      },
      fields: [
        {
          name: "📊 Votes",
          value: `Opinion: **0**\nUpvotes: **0** (0%)\nDownvotes: **0** (0%)`,
          inline: false,
        },
        {
          name: "Suggestion ID",
          value: `${nextId}`,
          inline: true,
        },
        {
          name: "Submitted at",
          value: new Date().toLocaleString(),
          inline: true,
        },
      ],
      thumbnail: {
        url: message.author.displayAvatarURL({ dynamic: true, size: 128 }),
      },
      timestamp: new Date(),
    };

    const sent = await reviewChannel.send({ embeds: [embed] });
    await sent.react("👍");
    await sent.react("👎");

    suggestions[guildId].push({
      id: nextId,
      author: message.author.tag,
      userId: message.author.id,
      content: content,
      status: "Open",
      messageId: sent.id,
      channelId: reviewChannel.id,
      date: new Date().toISOString(),
    });

    message.reply(
      `Your suggestion has been submitted for review! ID: **${nextId}**`
    );
    saveSuggestions(suggestions);
  },
};
