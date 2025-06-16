const fs = require("fs");
const path = require("path");
const { ChannelType } = require("discord.js");

const suggestionsPath = path.join(__dirname, "..", "suggestions.json");
const configPath = path.join(__dirname, "..", "db", "config.json");

function loadSuggestions() {
  if (!fs.existsSync(suggestionsPath)) {
    fs.writeFileSync(suggestionsPath, "{}");
  }
  return JSON.parse(fs.readFileSync(suggestionsPath));
}

function saveSuggestions(suggestions) {
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
}

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath));
}

module.exports = {
  name: "accept",
  description: "Approve a suggestion and send it to the final suggestions channel",
  async execute(message, args) {
    const guildId = message.guild.id;
    const config = loadConfig();

    if (!config[guildId] || !config[guildId].finalChannelId) {
      return message.reply("Final suggestions channel is not configured. Please run !setup first.");
    }

    const suggestions = loadSuggestions();
    if (!suggestions[guildId]) {
      return message.reply("No suggestions found for this server.");
    }

    const suggestionId = parseInt(args[0], 10);
    if (isNaN(suggestionId)) {
      return message.reply("Please provide a valid suggestion ID.");
    }

    const suggestion = suggestions[guildId].find(s => s.id === suggestionId);
    if (!suggestion) {
      return message.reply(`Suggestion ID ${suggestionId} not found.`);
    }

    if (suggestion.status === "Approved") {
      return message.reply("This suggestion has already been approved.");
    }

    try {
      const finalChannel = await message.guild.channels.fetch(config[guildId].finalChannelId);
      if (!finalChannel) {
        return message.reply("Configured final suggestions channel not found or bot has no access.");
      }
      if (finalChannel.type !== ChannelType.GuildText) {
        return message.reply("Final suggestions channel is not a text channel.");
      }

      const embed = {
        color: 0x00b0f4,
        author: {
          name: `Suggestion from ${message.author.tag}`,
          icon_url: message.author.displayAvatarURL({ dynamic: true }),
        },
        description: suggestion.content,
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
            value: `${suggestion.id}`,
            inline: true,
          },
          {
            name: "Submitted at",
            value: new Date(suggestion.date).toLocaleString(),
            inline: true,
          },
        ],
        thumbnail: {
          url: message.author.displayAvatarURL({ dynamic: true, size: 128 }),
        },
        timestamp: new Date(),
      };

      const sent = await finalChannel.send({ embeds: [embed] });
      await sent.react("👍");
      await sent.react("👎");

      suggestion.status = "Approved";
      suggestion.messageId = sent.id;
      suggestion.channelId = finalChannel.id;

      saveSuggestions(suggestions);

      return message.reply(`Suggestion ID ${suggestionId} approved and sent to final channel.`);
    } catch (error) {
      console.error("Error sending approved suggestion:", error);
      return message.reply("Failed to send suggestion to final channel. Check bot permissions and channel ID.");
    }
  },
};