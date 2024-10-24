---
layout: post
title: "Socket Programming in C"
date: 2016-04-08T09:47:01-0700
author: Loki Astari (C)2016
comments: true
categories: ["C++", "Sockets", "C++-By-Example", "Coding"]
series: Sockets
tags: Sockets
sharing: true
footer: true
subtitle: So you want to learn C++
description: Socket wrappers in C++
image: /images/post/post-3.png
imageInfo:
    original:           https://unsplash.com/photos/d6dxQwmxV2Q
    License:            Unsplash License
    LicenseLink:        https://unsplash.com/license
    Attribution:        Ken Blode
    AttributionLink:    https://unsplash.com/@benkolde
featured: false
draft: false
disqusId: "http://lokiastari.com/blog/2016/04/08/socket-programming-in-c-version-1/"
---

Building a simple client/server application is the common first internet based applications developers attempt. These applications are built on top of the socket communication library, but socket programming in C++ is not obvious as there are no standard libraries and thus you have to fall back to the C API. The closest "standardish" sort of thing we have is [Boost.asio](https://www.boost.org/doc/libs/1_60_0/doc/html/boost_asio/overview.html) which is at the other end of the spectrum in terms of API and involves a cognitive leap to understand what is happening underneath (or you can just trust the library maintainers). The other alternative is [libcurl](https://curl.haxx.se/libcurl/c/); the "easy curl" layer is an abstraction of the `socket()` API, while the "multi curl" layer is an abstraction of the `pselect()` API that allows multiple sockets to be handled in a single thread.

I am writing a series of articles that start with a basic C++ client/server application and walk through building a C++ communication library. During this processes I will be using examples from [codereview.stackexchange.com](https://codereview.stackexchange.com) to illustrate common mistakes and try to show how to write the code correctly (This will also be a learning exercise for me so please let me know if you spot a mistake).

Currently the plan is to write the following articles:

{/* Server listening for program sockets */}
* Client/Server C
* Client/Server C Read/Write
* Client/Server C++ Wrapper
* Mult-Threaded Server
* Non-Blocking Socket
* Co-Routines


## Client/Server C++ Basic Version

The minimum example of a working Client/Server application in C++:
The full working version is [here](https://github.com/Loki-Astari/Examples/tree/master/Version1)

[C Server](https://github.com/Loki-Astari/Examples/blob/master/Version1/server.cpp)
```c
#include <netinet/in.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define SERVER_BUFFER_SIZE      1024

int main()
{
    int socketId = socket(PF_INET, SOCK_STREAM, 0);

    struct sockaddr_in serverAddr;
    bzero((char*)&serverAddr, sizeof(serverAddr));
    serverAddr.sin_family       = AF_INET;
    serverAddr.sin_port         = htons(8080);
    serverAddr.sin_addr.s_addr  = INADDR_ANY;
    bind(socketId, (struct sockaddr *) &serverAddr, sizeof(serverAddr));

    listen(socketId, 5);

    int                         finished    = 0;
    while(!finished)
    {
        struct  sockaddr_storage    serverStorage;
        socklen_t                   addr_size   = sizeof serverStorage;
        int newSocket = accept(socketId, (struct sockaddr*)&serverStorage, &addr_size);

        char        buffer[SERVER_BUFFER_SIZE];
        int         get = read(newSocket, buffer, SERVER_BUFFER_SIZE - 1);

        buffer[get] = '\0';
        fprintf(stdout, "%s\n", buffer);

        write(newSocket, "OK", 2);

        fprintf(stdout, "Message Complete\n");

        close(newSocket);
    }
    close(socketId);
}
```

[C Client](https://github.com/Loki-Astari/Examples/blob/master/Version1/client.cpp)
```c
#include <arpa/inet.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define CLIENT_BUFFER_SIZE     1024

int main(int argc, char* argv[])
{
    if (argc != 3)
    {
        fprintf(stderr, "Usage: client <host> <Message>\n");
        exit(1);
    }

    int socketId = socket(PF_INET, SOCK_STREAM, 0);

    struct sockaddr_in serverAddr;
    socklen_t addrSize = sizeof(serverAddr);
    bzero((char*)&serverAddr, sizeof(serverAddr));
    serverAddr.sin_family       = AF_INET;
    serverAddr.sin_port         = htons(8080);
    serverAddr.sin_addr.s_addr  = inet_addr(argv[1]);
    connect(socketId, (struct sockaddr*)&serverAddr, addrSize);

    write(socketId, argv[2], strlen(argv[2]));

    shutdown(socketId, SHUT_WR);

    char    buffer[CLIENT_BUFFER_SIZE];
    size_t  get = read(socketId, buffer, CLIENT_BUFFER_SIZE - 1);

    buffer[get] = '\0';
    fprintf(stdout, "%s %s\n", "Response from server", buffer);

    close(socketId);
}
```

This version of the Client/Server actually works (a lot of the time) but obviously has a couple of major issues.

## Checking Error Codes
If the calls to `socket()`, `bind()`, `listen()` or `connect()` fail then we have a catastrophic error any further actions will also fail. A few of the error codes generated by these functions can potentially be recovered from but most are programming error or permission failure as a result a human readable message with application termination is an acceptable solution (at this point).

Note: When these functions don't succeed they set the global variable `errno` which can be translated into a human readable string with `strerror()`. So the simplest solution is to generate an appropriate error message for the user and terminate the application.

Socket Validation
```c
int socketId = socket(PF_INET, SOCK_STREAM, 0);
if (socketId == -1)
{
    fprintf(stderr, "Failed: socket()\n%s\n", strerror());
    exit(1);
}
```

Bind Validation
```c
if (bind(socketId, (struct sockaddr *) &serverAddr, sizeof(serverAddr)) == -1)
{
    fprintf(stderr, "Failed: bind()\n%s\n", strerror());
    close(socketId);    // Don't forget to close the socket.
    exit(1);
}
```

Listen Validation
```c
if (listen(socketId, 5) == -1)
{
    fprintf(stderr, "Failed: connect()\n%s\n", strerror());
    close(socketId);    // Don't forget to close the socket.
    exit(1);
}
```

Connect Validation
```c
if (connect(socketId, (struct sockaddr*)&serverAddr, addrSize) == -1)
{
    fprintf(stderr, "Failed: connect()\n%s\n", strerror());
    close(socketId);    // Don't forget to close the socket.
    exit(1);
}
```

# Summary

The basic socket programs are relatively trivial. But this version 1 has some obvious flaws the major one being checking error states (which a lot of beginners forget in their first version). The next article will look into some more details about read and write operations on the socket.

# Inspiration for Article

* 2012-Jul-09 [Two-way communication in TCP: server-client implementation](https://codereview.stackexchange.com/q/13461/507)
* 2012-Jul-23 [Stupidly simple TCP client/server](https://codereview.stackexchange.com/q/13933/507)
* 2013-May-28 [How is this for a “Hello World” of socket programming?](https://codereview.stackexchange.com/q/26683/507)
* 2013-Sep-06 [Extract location from HTTP socket](https://codereview.stackexchange.com/q/30852/507)
* 2014-Mar-10 [Client/server implementation in C (sending data/files)](https://codereview.stackexchange.com/q/43914/507)

