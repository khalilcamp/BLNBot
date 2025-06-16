const fs = require("fs").promises;
const path = require("path");

const configPath = path.join(__dirname, "..", "db", "config.json");

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.writeFile(configPath, "{}");
      return {};
    }
    throw err;
  }
}

module.exports = {
  name: "summary",
  description: "Create a summary embed via DM questions",
  async execute(message, args) {
    const user = message.author;

    try {
      await message.delete();
      console.log(`[LOG] Deleted message from ${user.tag}`);
    } catch (err) {
      console.error(`[ERROR] Could not delete message:`, err);
    }

    function cleanLink(input) {
      if (!input) return null;
      const match = input.match(/`([^`]+)`/);
      return match ? match[1].trim() : input.replace(/[`~*_\[\]()]/g, "").trim();
    }

    function isValidImageUrl(url) {
      return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
    }

    let dmChannel;
    try {
      dmChannel = await user.createDM();
      console.log(`[LOG] DM channel created with user ${user.tag}`);
    } catch (err) {
      console.error(`[ERROR] Failed to create DM:`, err);
      return message.reply("I couldn't open a DM with you. Please check your privacy settings.");
    }

    const questions = [
      { key: "summary", question: "Please enter the **Summary** (string):" },
      { key: "image", question: "Optionally, enter an **image URL** or type `none` to skip:" },
    ];

    const answers = {};
    let currentQuestion = 0;

    await dmChannel.send(questions[currentQuestion].question);
    console.log(`[LOG] Sent question: ${questions[currentQuestion].question}`);

    const collector = dmChannel.createMessageCollector({
      filter: (m) => m.author.id === user.id,
      time: 120000,
    });

    collector.on("collect", (m) => {
      console.log(`[LOG] Collected DM from ${m.author.tag}: ${m.content}`);

      const key = questions[currentQuestion].key;
      const response = m.content.trim();

      answers[key] = key === "image" && response.toLowerCase() === "none" ? null : response;

      currentQuestion++;

      if (currentQuestion < questions.length) {
        dmChannel.send(questions[currentQuestion].question);
        console.log(`[LOG] Sent question: ${questions[currentQuestion].question}`);
      } else {
        collector.stop("done");
      }
    });

    collector.on("end", async (collected, reason) => {
      console.log(`[LOG] Collector ended with reason: ${reason}. Collected ${collected.size} messages.`);
      if (reason !== "done") {
        await dmChannel.send("You did not reply in time. Please try the command again.");
        return;
      }

      const cleanedImage = cleanLink(answers.image);
      const summary = answers.summary || "";

      const chunkSize = 1024;
      const chunks = [];

      for (let i = 0; i < summary.length; i += chunkSize) {
        chunks.push(summary.slice(i, i + chunkSize));
      }

      const embeds = chunks.map((chunk, index) => {
        const embed = {
          color: 0x3498db,
          title: index === 0 ? "Summary" : undefined,
          fields: [
            {
              name: `Summary (${index + 1}/${chunks.length})`,
              value: chunk,
              inline: false,
            },
          ],
          timestamp: index === 0 ? new Date() : undefined,
        };

        if (index === 0 && cleanedImage && isValidImageUrl(cleanedImage)) {
          embed.image = { url: cleanedImage };
        }

        return embed;
      });

      try {
        const config = await loadConfig();
        const guildConfig = config[message.guild.id];
        const mention = guildConfig?.reviewerRoleId ? `<@&${guildConfig.reviewerRoleId}>` : null;

        if (mention) {
          await message.channel.send({ content: mention });
        }

        await message.channel.send({ embeds });
        console.log("[LOG] Embed(s) sent to channel");
      } catch (err) {
        console.error("[ERROR] Failed to send embed(s) in channel:", err);
        message.reply("Failed to send the summary embed. Please check bot permissions.");
      }
    });
  },
};
