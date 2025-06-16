module.exports = {
  name: 'help',
  description: 'List all commands',
  execute(message, args) {
    const commandList = message.client.commands.map(cmd => `**!${cmd.name}** - ${cmd.description}`).join('\n');
    message.channel.send({ content: `📜 **Available Commands:**\n${commandList}` });
  }
};
