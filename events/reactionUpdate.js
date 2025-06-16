const fs = require('fs');
const path = require('path');

const suggestionsPath = path.join(__dirname, '..', 'db', 'suggestions.json');

function loadSuggestions() {
  if (!fs.existsSync(suggestionsPath)) {
    fs.writeFileSync(suggestionsPath, '{}');
  }
  const data = fs.readFileSync(suggestionsPath);
  return JSON.parse(data);
}

function saveSuggestions(data) {
  fs.writeFileSync(suggestionsPath, JSON.stringify(data, null, 2));
}

// Att the vote field and account for the votes.
async function updateVotesEmbed(reaction) {
  const message = reaction.message;

  await message.fetch();
  await message.reactions.cache;

  const upvoteReaction = message.reactions.cache.get('👍');
  const downvoteReaction = message.reactions.cache.get('👎');

  const upvotes = upvoteReaction ? upvoteReaction.count - 1 : 0;
  const downvotes = downvoteReaction ? downvoteReaction.count - 1 : 0;

  const totalVotes = upvotes + downvotes;
  const opinion = totalVotes === 0 ? 0 : upvotes - downvotes;

  const upvotePercent = totalVotes === 0 ? 0 : Math.round((upvotes / totalVotes) * 100);
  const downvotePercent = totalVotes === 0 ? 0 : Math.round((downvotes / totalVotes) * 100);


  if (!message.embeds.length) return; // if no embeds, do nothing
  const oldEmbed = message.embeds[0].toJSON();

  // Refresh vote field.
  const voteFieldIndex = oldEmbed.fields?.findIndex(f => f.name === '📊 Votes');
  const voteFieldValue = `**Opinion:** ${opinion}\n**Upvotes:** ${upvotes} (${upvotePercent}%)\n**Downvotes:** ${downvotes} (${downvotePercent}%)`;

  if (voteFieldIndex !== -1) {
    oldEmbed.fields[voteFieldIndex].value = voteFieldValue;
  } else {
    if (!oldEmbed.fields) oldEmbed.fields = [];
    oldEmbed.fields.push({
      name: '📊 Votes',
      value: voteFieldValue,
      inline: false,
    });
  }

// Update the embed color based on the opinion.
if (opinion > 0) {
  oldEmbed.color = 0x28a745;
} else if (opinion < 0) {
  oldEmbed.color = 0xdc3545;
} else {
  oldEmbed.color = 0x00b0f4;
}

await message.edit({ embeds: [oldEmbed] });
}


async function onReactionAdd(reaction, user) {
  if (user.bot) return;
  if (!['👍', '👎'].includes(reaction.emoji.name)) return;

  try {
    await updateVotesEmbed(reaction);
  } catch (error) {
    console.error('Erro refreshing votes: (add):', error);
  }
}


async function onReactionRemove(reaction, user) {
  if (user.bot) return;
  if (!['👍', '👎'].includes(reaction.emoji.name)) return;

  try {
    await updateVotesEmbed(reaction);
  } catch (error) {
    console.error('Erro ao atualizar votos (remove):', error);
  }
}

module.exports = {
  reactionAdd: {
    name: 'messageReactionAdd',
    execute: onReactionAdd,
  },
  reactionRemove: {
    name: 'messageReactionRemove',
    execute: onReactionRemove,
  }
};
