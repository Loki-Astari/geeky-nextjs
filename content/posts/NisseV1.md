---
layout: post
title: "A Web Server"
date: 2024-11-06T12:48:31-0800
author: Loki Astari, (C)2024
comments: true
categories: ["C++", "Nisse", "Server", "C++-By-Example", "Coding"]
series: Nisse
tags: Nisse
sharing: true
footer: true
subtitle: Nisse
description: Nisse. The step by step creation of a C++ Server architecture.
image: /images/post/post-3.png
imageInfo:
    original:           https://unsplash.com/photos/W-oqNwbmin0
    License:            Unsplash License
    LicenseLink:        https://unsplash.com/license
    Attribution:        Oscar Nilsson
    AttributionLink:    https://unsplash.com/@oscrse
featured: true
draft: false
disqusId: "http://lokiastari.com/blog/2024/11/06/Nisse/"
---

# [Nisse](https://github.com/Loki-Astari/Nisse)

Before I describe the different parts of Nisse, I want to start with the simplest web application I can build: a web server. A web server maintains no state between calls, and the interface is straightforward. The client sends an [HTTP message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_requests) and, in return, receives an [HTTP response](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses).

Even better, we already have applications (browsers) that handle all the difficult aspects of interacting with a web server, so we don’t need to write a client-side application.

## NisseV1

All the code for this article is in a single [file](https://github.com/Loki-Astari/NisseBlogCode/tree/master/V1). It uses only the standard libraries, which should be easy to build for anybody. A “Makefile” is provided just as an example.

### Build & Run

```bash
  > git clone https://github.com/Loki-Astari/NisseBlogCode.git
  > cd NisseBlogCode/V1
  > make
  > ./NisseV1 8080 /Directory/You/Want/To/Server/On/Port/8080
```

I will go over a couple of things in the file that I believe are worth explicitly pointing out:

### int main()

```C++
int main(int argc, char* argv[])
{
    if (argc != 3)
    {
        std::cerr << "Usage: NisseV1 <port> <documentPath>" << "\n";
        return 1;
    }

    try
    {
        static const int port = std::stoi(argv[1]);
        static const std::filesystem::path  contentDir  = std::filesystem::canonical(argv[2]);

        std::cout << "Nisse Proto 1\n";
        WebServer   server(port, contentDir);
        server.run();
    }
    catch(std::exception const& e)
    {
        std::cerr << "Exception: " << e.what() << "\n";
        throw;
    }
    catch(...)
    {
        std::cerr << "Exception: UNKNOWN\n";
        throw;
    }
}
```

The `main()` function obtains and validates user input to initialize the server. If everything is in order, it creates a `WebServer` object and starts the application dispatch loop by calling `run()`.

Here are two main points to note:

1. Unlike most beginner tutorials, web applications are event-driven. They operate with a "dispatch loop" that executes user code when events occur, rather than following a sequential list of commands. In this example, the `run()` function represents the dispatch loop and manages all the underlying details. Typically, frameworks allow you to register user code for specific events, but since this is a simple application, it simply handles an HTTP request.

2. I use exceptions to handle critical errors. Many engineers believe exceptions are problematic because they obscure control flow (and I partially agree). However, I prefer using exceptions, judiciously, as they reduce the amount of explicit error-handling code required for serious issues that necessitate application shutdown. It is essential to unwind the stack correctly and ensure all relevant destructors are called to release resources; therefore, `abort()` and `exit()` are usually inappropriate in C++ applications (unlike in C). For this reason, you **MUST** catch exceptions in `main()`, as it is implementation-defined whether the stack unwinds if an exception escapes the `main()` function. By catching the exception in `main()`, you ensure the stack unwinds correctly, and all destructors are called. Then, you can generate appropriate messages and logs before re-throwing the exceptions. Re-throwing allows the OS to take necessary actions when the application exits abnormally.

### Socket Code

The socket code is all C code (and thus in the global namespace). You will see in my code that all C code is prefixed by `::`. For example, when creating a server-end socket, I call `::socket(),` `::bind(),` `::listen()`, and `::accept()`. This ensures that I do not accidentally call similarly named methods.

A lot of the code in this example is simply creating and handling sockets and doing a rudimentary job of checking and handling basic errors that these functions could generate; class [Server](https://github.com/Loki-Astari/NisseBlogCode/blob/master/V1/NisseV1.cpp#L230-L280) is 50 lines and class [Socket](https://github.com/Loki-Astari/NisseBlogCode/blob/master/V1/NisseV1.cpp#L282-L470) is another 200 lines and represents at least a third of the code.

This code is so bulky because it requires a lot of explicit code to detect edge cases and potentially retry IO operations, which is needed to handle non-blocking asynchronous code. Additionally, we have not included any code to handle SSL connections, which is required for HTTPS connections, the de facto industry standard.

### What is the next step

We should utilize a C++ sockets library that provides a simpler-to-use interface, has built-in support for SSL, and explicitly handles all the error situations nicely.

### Future Notes

Though the web server can handle a limited number of simultaneous requests, they will all be processed sequentially. The problem is that sending data over a network is orders of magnitude slower than most other operations the server could perform; therefore, when handling a request, the server is usually blocked, waiting for confirmation that its writes have succeeded when it could utilize this time to work on another request.

