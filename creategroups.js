// creategroups.js - BJS code for /creategroups command with GramJS
// Random words list
var randomWords = ['apple', 'blue', 'cloud', 'dream', 'eagle', 'forest', 'galaxy', 'honey', 'island', 'jazz', 'kitten', 'lemon', 'moon', 'nova', 'ocean', 'piano'];

// Load GramJS (from libs/gramjs.js)
var TelegramClient = Libs.gramjs.TelegramClient;
var Api = Libs.gramjs.Api;

// Conversation states using params
if (!params || params.step == undefined) {
    Bot.sendMessage("Please send your Telegram API ID.");
    params.step = "api_id";
    return;
}

if (params.step == "api_id") {
    params.api_id = message;
    Bot.sendMessage("Please send your Telegram API hash.");
    params.step = "api_hash";
    return;
}

if (params.step == "api_hash") {
    params.api_hash = message;
    Bot.sendMessage("Please send your session string.");
    params.step = "session_string";
    return;
}

if (params.step == "session_string") {
    params.session_string = message;
    Bot.sendMessage("How many groups do you want to create (1-100)?");
    params.step = "num_groups";
    return;
}

if (params.step == "num_groups") {
    var num_groups = parseInt(message);
    if (isNaN(num_groups) || num_groups < 1 || num_groups > 100) {
        Bot.sendMessage("Please enter a number between 1 and 100.");
        return;
    }
    params.num_groups = num_groups;
    Bot.sendMessage("What delay (in seconds) between group creations? (e.g., 5)");
    params.step = "delay";
    return;
}

if (params.step == "delay") {
    var delay = parseFloat(message);
    if (isNaN(delay) || delay < 0) {
        Bot.sendMessage("Please enter a valid non-negative number.");
        return;
    }
    params.delay = delay;
    Bot.sendMessage("Starting group creation process...");

    // Initialize GramJS client
    var client = new TelegramClient(params.session_string, parseInt(params.api_id), params.api_hash, { connectionRetries: 5 });
    
    var successful = 0, failed = 0, log = [];
    
    try {
        await client.connect(); // Connect to Telegram
        
        // Create private supergroups loop
        for (var i = 0; i < params.num_groups; i++) {
            try {
                var groupName = randomWords[Math.floor(Math.random() * randomWords.length)].charAt(0).toUpperCase() + randomWords[Math.floor(Math.random() * randomWords.length)].slice(1) + "Group" + (i+1);

                // Create private supergroup
                var chat = await client.invoke(new Api.channels.CreateChannel({
                    title: groupName,
                    about: "Private supergroup created by GroupCreatorBot",
                    megagroup: true, // Supergroup
                    broadcast: false // Private, not a channel
                }));

                var chatId = chat.chats[0].id;

                // Enable visible chat history (Bot API, as MTProto is complex)
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatProtectedContent?chat_id=${chatId}&protected_content=false`);

                // Send random word
                var randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
                await client.sendMessage(chatId, { message: randomWord });

                successful++;
                log.push("Group " + (i+1) + ": '" + groupName + "' created (ID: " + chatId + "), word: " + randomWord);
            } catch (e) {
                failed++;
                log.push("Group " + (i+1) + ": Failed - " + e.message);
            }
            // Delay (test if setTimeout works in BJS)
            if (params.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, params.delay * 1000));
            }
        }
        await client.disconnect();
    } catch (e) {
        Bot.sendMessage("Error initializing client: " + e.message);
        return;
    }

    // Send summary
    var summary = "Group Creation Complete!\nSuccessfully: " + successful + "\nFailed: " + failed + "\n\nLog:\n" + log.join("\n");
    Bot.sendMessage(summary);
            }
