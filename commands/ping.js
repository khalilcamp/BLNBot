module.exports = {
  name: 'ping',
  description: 'answer with pong!',
  execute(message) {
    message.reply('Pong!');
  }
};
