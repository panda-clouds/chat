const PCChat = require('./PCChat.js');

Parse.Cloud.define('createConversation', async request => {
	const result = await PCChat.createConversation(request);

	return result;
});

Parse.Cloud.define('sendMessage', async request => {
	const message_id = await PCChat.sendMessage(request);

	return message_id;
});

Parse.Cloud.define('getConversations', async request => {
	const result = await PCChat.getConversations(request);

	return result;
});

Parse.Cloud.define('getMessages', async request => {
	const result = await PCChat.getMessages(request);

	return result;
});
