---
layout: post
title: "SlackHAndlers: Slack Bot handling events"
date: 2026-05-02:00:00-0800
author: Loki Astari, (C)2026
comments: true
categories: ["C++", "Mug", "Slack", "Nisse", "C++-By-Example", "Coding"]
series: Mug
tags: Mug, Nisse, Plugins
sharing: true
footer: true
subtitle: C++ By Example
description: Handling events in the Slack Bot
image: /images/post/post-4.png
featured: false
draft: true
---

## Overview

I the previews article I walked through creating a Slack Bot and registering it with Slack. That article simply verified that events coming from Slack were correctly being received by the Bot. This article will expand on that and show how to respond to these events.


## Configuring Your Slack

In the previous article you should have already subscribed your Bot to 'message.channels' and added the 'botToken' and 'signingSecret' to your 'config.plugin' file.

### Add Your Bot to a Channel

In the Slack Application, find a channel in the workspace.

1. Go to the "Channel Details" dialog. (Click on the channel name in the main window).

2. Click the "Integrations" tab.

3. In the "Apps" section, click "Add Apps".

4. You should be able to see your app in the list. Click the "Add" button next to your bot.

All done — your app is now receiving events about this channel from Slack.

## Updating your Bot

In the previous article we created the most trivial Bot that did nothing (it would simply verify itself with Slack).  
Here we add a message handler that responds to the message "Knock Knock" and replies "Who is there?".


````CPP
#include "NisseBolt/App.h"
#include "NisseBolt/AppConfig.h"

class Bot: public ThorsAnvil::Nisse::Bolt::App
{
	public:
		Bot(ThorsAnvil::Nisse::Bolt::AppConfig const& config)
			: ThorsAnvil::Nisse::Bolt::App(config)
		{
			// Listen for "knock knock" and respond with "who's there?" in italics.
			message("knock knock", [](ThorsAnvil::Slack::Event::Message const& message, ThorsAnvil::Nisse::Bolt::Say const& say)
			{
				// note the string is "MarkUp"
				say("_who's there?_");
			});
		}
};

THORS_ANVIL_NISSE_BOLT_SERVER_INIT(ThorsAnvil::Nisse::Bolt::AppConfig, Bot);
````

The `message()` above takes two parameters, A filter which it checks against the message and a lambda to execute if the filter matches the input message from Slack. In this case the filter is a string, if the incoming event message contains the string `knock knock` the Bot will respond with "who's there?".

## Checking it works.

If you type "knock knock" as a message into the channel you registered your bot with. **Nothing Will Happen** but you will see an error message from the "Mug Server" that looks like this:

````
2026-05-03 09:07:20.652 (  11.673s) [         318C1EC]                Say.cpp:56     ERR| id: 58 ThorsAnvil::Nisse::Bolt::Say::sendMessage: Failed|Data|{"ok":false,"error":"missing_scope","needed":"chat:write:bot","provided":"channels:history"}
````

The important part is `"error":"missing_scope","needed":"chat:write:bot"`. Slack is letting you know that your Bot does not have enough permissions to write to the channel `"missing_scope"` and the name of that scope `chat:write` for a `bot`. So the next step is to add this permissions.

Go to [api.slack.com/apps](https://api.slack.com/apps).

1. Select you app from the list.

2. This should bring you to the "Basic Information" information page for your bot.

3. Select "OAuth & Permissions" from the left side bar.

4. Scroll down to the "Scopes" paine. In the "Bot Token Scopes" section find the button "Add an OAuth Scope" and click it.

5. In the selection box that appears type "chat:write" and click on the item that appears.

6. You will need to "ReInstall" your app, so scroll up to the "OAuth Tokens" section there should be a green button "ReInstall to <Workspace>" click this.

7. Click the "Allow" button.

Your Bot should now be able to write to the channel. Try typing "knock knock" into the channel in the slack application.


## Slack Message Interface
### message() method

The `message()` API registers a filter and an action. The filter is checked against the message and if it is true the action is executed. There are two helper filters, these are `std::string` or `std::regex` but if you want a bit more control you can pass a lambda that accepts the message object and you can interrogate the message object to see if you need to respond.

````CPP
namespace ThorsAnvil::Nisse::Bolt
{

// Message see: https://github.com/Loki-Astari/NisseBolt/blob/master/src/ThorsSlack/EventCallbackMessage.h#L72-L94
using Filter         = std::function<bool(ThorsAnvil::Slack::Event::Message const&)>;
using MessageHandler = std::function<void(ThorsAnvil::Slack::Event::Message const&, Say const& say)>;


class App
{
	public:
		// Helper methods. That simplify the use of Filter.
		void message(std::string filter, MessageHandler&& mh);
		void message(std::regex  filter, MessageHandler&& mh);

		// Helper method. Where the helper always returns true.
		void message(MessageHandler&& mh);

		// Main version of message() for the hard core engineer that wants to check message.
		void message(Filter&&    filter, MessageHandler&& mh);
....


};
}
````

### MessageHandler

The `MessageHandler` is a lambda that is called when the filter matches. It has two parameters the [Slack::Event::Message const& message](https://github.com/Loki-Astari/NisseBolt/blob/master/src/ThorsSlack/EventCallbackMessage.h#L72-L94) and the [Say const& say](https://github.com/Loki-Astari/NisseBolt/blob/master/src/NisseBolt/Say.h#L23C1-L35). The `message` contains details about the what a user (or Bot) just said in a channel. The `say` interface allows you to reply back to the message. The `say` object is configured so by default it will reply to the current message but you can customize this by providing a `Where` object that specifies where the reply should go.

````CPP
	say("_who's there_");                                     // uses the channel and time ts of the current message to reply directly to this message.
	say("__Door Knocked__", Where{.channel="AdminChannelId"}) // Sends a message to the "Admin Channel".
````

The first question you have is: "What is a `ChannelId`."?

But this is the wrong question. A Bot can only write to channels that it has explicitly been added to (see above). But when you add your bot to the channel in step 1 you open the "Channel Details Dialog". When you open this you will see the "Channel Id" at the bottom of the page (it should be a string of 11, random looking, characters).

With this addition lets create another listener that looks for bad words.

````CPP
#include "NisseBolt/App.h"
#include "NisseBolt/AppConfig.h"

class Bot: public ThorsAnvil::Nisse::Bolt::App
{
	public:
		Bot(ThorsAnvil::Nisse::Bolt::AppConfig const& config)
			: ThorsAnvil::Nisse::Bolt::App(config)
		{
			// Listen for "knock knock" and respond with "who's there?" in italics.
			message("knock knock", [](ThorsAnvil::Slack::Event::Message const& message, ThorsAnvil::Nisse::Bolt::Say const& say)
			{
				// note the string is "MarkUp"
				say("_who's there?_");
			});

		// Report bad words on the main channel to the admin channel.
			message(std::regex("Grud|Jovus|Stomm|Drokk|Spug"), [](ThorsAnvil::Slack::Event::Message const& message, ThorsAnvil::Nisse::Bolt::Say const& say)
			{
				if (message.channel == "mainChannelId") {
					std::string  reply	= "2000AD language detected: ";
					reply += message.text;
					say(reply, {.channel = "AdminChannel"});
				}
			}
		}
};

THORS_ANVIL_NISSE_BOLT_SERVER_INIT(ThorsAnvil::Nisse::Bolt::AppConfig, Bot);
````

## Event Interface

The `message()` interface is used to interact with events of type `ThorsAnvil::Slack::Event::Message`. But there are approximately [112 different events](https://github.com/Loki-Astari/NisseBolt/blob/master/src/ThorsSlack/EventCallback.h#L49-L75) that Slack can report. Rather than an interface for each of these event types there is a generic interface to handle all these different types.

````CPP
namespace ThorsAnvil::Nisse::Bolt
{

template<typename T>
using EventHandler = std::function<void(T const& event, Say const& say)>;

class App
{
	public:
		template<typename T>
		void event(EventHandler<T>&& handler);
};
````

Note: using `event()` to handle `Message` event is equivalent to simply calling `message()`.


Using the `event()` interface you can react all the potential events that are sent by Slack. Unlike the `message()` interface there is no filter functionality and you must do this manually in your handler:

###Example Star Event Handler

````CPP
#include "NisseBolt/App.h"
#include "NisseBolt/AppConfig.h"

class Bot: public ThorsAnvil::Nisse::Bolt::App
{
	public:
		Bot(ThorsAnvil::Nisse::Bolt::AppConfig const& config)
			: ThorsAnvil::Nisse::Bolt::App(config)
		{
			// Listen for "knock knock" and respond with "who's there?" in italics.
			message("knock knock", [](ThorsAnvil::Slack::Event::Message const& message, ThorsAnvil::Nisse::Bolt::Say const& say)
			{
				// note the string is "MarkUp"
				say("_who's there?_");
			});

			// React to Star events in the team channel
			event([](ThorsAnvil::Slack::Event::StarAdded const& event, ThorsAnvil::Nisse::Bolt::Say const& say)
			{
				if (event.item.channel == "TeamChannel") {
					say(std::string("We have a star by: ") + event.user, {.channel = "AdminChannel"});
				}
			}
}
};

THORS_ANVIL_NISSE_BOLT_SERVER_INIT(ThorsAnvil::Nisse::Bolt::AppConfig, Bot);
````






