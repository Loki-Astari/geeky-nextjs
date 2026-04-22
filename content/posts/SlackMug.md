---
layout: post
title: "SlackMug: A mug plugin for a Slack bot"
date: 2026-04-21T12:00:00-0800
author: Loki Astari, (C)2026
comments: true
categories: ["C++", "Mug", "Slack", "Nisse", "C++-By-Example", "Coding"]
series: Mug
tags: Mug, Nisse, Plugins
sharing: true
footer: true
subtitle: C++ By Example
description: Creating a Slack bot using the Mug plugin architecture.
image: /images/post/post-3.png
featured: false
draft: true
---

This article will walk through the steps of creating a Mug plugin that implements a Slack Bot. It utilizes NisseBolt, a C++ library designed to be similar to the [Slack Bolt](https://docs.slack.dev/tools/bolt-python/) Python libraries. This should greatly simplify the process of getting a simple server stood up quickly.


## Step 1: Install the ThorsAnvil libraries:

ThorsAnvil is a set of C++ libraries that I have written (see my other articles) for creating Web Applications in C++. For this article we will be concentrating on using the [Mug]() Server and writing a [Mug Plugin]() using [NisseBolt]() that implements a [Slack Bot]().

````
> brew install thors-anvil
````

## Step 2: The Simplest Bot

### Makefile:
The most trivial Makefile I can build. Please use your own build tools once you have it working.
````Makefile
SRC				= $(wildcard *.cpp)
OBJ				= $(patsubst %.cpp,%.o,$(SRC))
CXXFLAGS		= -std=c++20
LIBS			= -lNisseBolt -lNisse -lThorsSocket -lThorSerialize -lThorsLogging

all:	$(OBJ)
	$(CXX) -dynamiclib -o libBot.dylib $(OBJ) $(LIBS)
````

### Bot.cpp
The code for a MugPlugin that implements a SlackBot that will respond correctly to events from Slack, thus allowing us to confirm that the application is connecting correctly.
````CPP
#include "NisseBolt/App.h"
#include "NisseBolt/Config.h"

class Bot: public ThorsAnvil::Nisse::Bolt::App
{
	public:
		Bot(ThorsAnvil::Nisse::Bolt::Config const& config)
			: ThorsAnvil::Nisse::Bolt::App(config)
		{}
};

THORS_ANVIL_NISSE_BOLT_SERVER_INIT(ThorsAnvil::Nisse::Bolt::Config, Bot);
````

### config.plugin
The configuration for Mug to load and run your Bot. We will fill in some of the slack configuration as we go through subsequent steps.
````JSON
{
	"controlPort":  8079,
	"libraryCheckTime": 500,
	"servers": [
		{
			"port":     8080,
			"actions": [
				{
					"pluginPath": "<PathToYourDir>/libBot.dylib",
					"config": {
						"slot": "/slack/Bot",
						"botToken": "",
						"userToken": "",
						"signingSecret": ""
					}
				}
			]
		}
	]
}
````

Build the application:

> make

## Step 3: Configure Slack

Slack Bots receive messages from the Slack service and thus have to be registered with Slack.


1. You will need a workspace that you own or are the admin for that your app can be installed into.
 * Setting up your own [workspace](https://slack.com/help/articles/206845317-Create-a-Slack-workspace#create-a-workspace).

2. You will need to Create a "Slack App"

### Creating a Slack App

Go to [api.slack.com/apps](https://api.slack.com/apps). Note:

1. In the top right hand corner is a "Create New App" button. Push this.

2. From the dialog select "From scratch" option.

3. Enter an "App Name" and select a "workspace"

4. Click "Create App"

5. You should now be on the "Basic Information" page of your application. On this page there is a field "Signing Secret". Copy this value and paste it into the "config.plugin" file you created above.

6. Don't close this page you have one last step to do below.

### Run your Slack App

You should now simply run the command below.

> mug --config=config.plugin

If everything is working you have a Slack Bot running on port 8080 of your local machine.

If you have your own domain or a static IP address that should be enough information to connect to your application. But if you are a small home developer you may need this next extra step to forward connections to your home machine.

#### Using ngrok to forward traffic

Install ngrok on your machine.

> brew install ngrok

Run ngrok to forward traffic to your machine:

> ngrok http 8080

You should see a line that looks like:

Forwarding                    https://903d-175-22-89-211.ngrok-free.app -> http://localhost:8080

In the next step use "https://903d-175-22-89-211.ngrok-free.app" as the "Domain-Name"

### Event Subscription

In the Slack Configuration for your app:

7. Click on the "Event Subscriptions" section in the left toolbar.

8. Click the "Enable Events" button.

9. Check your "config.plugin" file for the "slot" information, this will be used in the next line.

10. Set the "Request URL" to be: "<Domain-Name>/<slot>/event"

11. After about 2 seconds Slack should attempt a connection to the server to validate that it can correctly decode an event.

12. Check that you get the "verified" tick.

13. Click the "Subscribe to bot event" drop down.

14. Click the "Add Bot User Event" button.

15. Type "message.channel" and select this value.

16. Click "Save Changes"

17. Click on the "OAuth & Permissions" section in the left toolbar.

18. Under "OAuth Tokens" there should be a button marked "Install to <Workspace>". Click this button. Click the "Allow"

### Add Your Bot to a channel

In the Slack Application. Find a channel in the workspace.

19. Go to the "Channel Details" dialog.

20. Click the "Integrations" tab.

21. In the "Apps" section click "Add Apps"

22. You should be able to see your App in the list. Click the "Add" button next to your bot.

All Done your app is now receiving events from Slack.

## How It All Fits Together

### Mug

Mug is a C++ server similar to Python's Flask in that it allows developers to focus on the business logic while the server handles all the async sockets and threading automatically.

The Mug server is configured via a config file specified as a command line parameter. This config file lets you specify a set of dynamically loaded libraries that implement the ThorsMug interface.

One of the most useful features of Mug is hot-reloading. It monitors your libraries at runtime and, when it detects an update, safely unloads the old version and loads the new one. This allows you to quickly iterate on your plugin without restarting the server.

### ThorsMug

In the `Bot.cpp` file you will find the line `THORS_ANVIL_NISSE_BOLT_SERVER_INIT(<ConfigType>, <AppType>)`. This is a macro provided by NisseBolt that implements the ThorsMug interface for you. It creates an instance of `AppType`, passing an instance of `ConfigType` as the only parameter to the constructor. The `ConfigType` object is created from the config file that was passed to Mug on startup.

In this case, the `config` block from config.plugin (containing `slot`, `botToken`, `userToken`, and `signingSecret`) is passed to the ThorsMug interface. This object is treated as JSON and converted into a C++ object of type `ConfigType` using the `ThorsSerializer` library. This allows you to pass any configuration that you don't want in the code, such as secrets, to your plugin.

### Bolt::App

The `Bolt::App` class is an implementation of `ThorsAnvil::ThorsMug::MugPlugin` that knows how to communicate with the Slack service. It provides an interface similar to the Python Bolt libraries published by Slack, allowing you to configure how the Bot reacts to events from Slack and send appropriate requests back to the Slack service.

In the following articles I will walk you through the different parts of the interface and how to configure both the C++ code and the Slack permissions.






