require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const reactionEvents = require('./events/reactionUpdate');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});


client.on(reactionEvents.reactionAdd.name, reactionEvents.reactionAdd.execute);
client.on(reactionEvents.reactionRemove.name, reactionEvents.reactionRemove.execute);
client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "summaryModal") {
      const summary = interaction.fields.getTextInputValue("summaryInput");
      const thumbnail = interaction.fields.getTextInputValue("thumbnailInput");

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Summary")
        .addFields({ name: "Summary", value: summary })
        .setTimestamp();

      if (thumbnail) {
        embed.setThumbnail(thumbnail);
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});


client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}


const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);

  
  if (file === 'reactionUpdate.js') continue;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}


client.login(process.env.TOKEN)
  .then(() => console.log('Bot is online!'))
  .catch(err => console.error('Failed to login:', err));
