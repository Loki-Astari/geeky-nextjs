---
layout: post
title: "C++ Sockets"
date: 2024-11-08T12:23:22-0800
author: Loki Astari, (C)2024
comments: true
categories: ["C++", "Nisse", "Server", "C++-By-Example", "Coding"]
series: Nisse
tags: Nisse
sharing: true
footer: true
subtitle: Nisse
description: Nisse. The step by step creation of a C++ Server architecture.
image: /images/post/post-4.png
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

In the previous [article "A Web Server"](https://lokiastari.com/posts/NisseV1) I created the simplest Web Server possible. This article covers the next stage in the processes by moving from a C socket library to use a C++ socket library.

## NisseV2

All the code for this article is in a single [file](https://github.com/Loki-Astari/NisseBlogCode/tree/master/V2). It uses standard libraries, and [thors-mongo](https://github.com/Loki-Astari/ThorsMongo). If you have a Unix like environment this should be easy to build, if you use Windows you may need to do some extra work. A “Makefile” is provided just as an example.

### Build & Run

```bash
  > brew install thors-mongo
  > git clone https://github.com/Loki-Astari/NisseBlogCode.git
  > cd NisseBlogCode/V2
  > make
  > ./NisseV2 8080 /Directory/You/Want/To/Server/On/Port/8080
```

## ThorsSocket

I am going to add [ThorsSocket](https://github.com/Loki-Astari/ThorsSocket), a C++ wrapper around 'File Descriptors' (FD), to simplify the web server. ThorsSocket provides a [`std::iostream`](https://en.cppreference.com/w/cpp/io/basic_iostream) interface for FD and is designed to work with the [Boost Co-Routine](https://www.boost.org/doc/libs/1_86_0/libs/coroutine2/doc/html/index.html) library to enable cooperative multitasking.

Because FDs are a very low-level OS resource, ThorsSocket provides a `std::iostream` interface to several important OS resources; such as pipes, files, sockets, and SSL sockets (ssockets). Note that the standard library already provides access to files through `std::fstream`, but only allows blocking read/write access; in contrast, ThorsSocket provides non-blocking read/write access, allowing the executing thread to cooperatively switch to another task when an I/O operation would block and transparently resumeing the I/O operation when the FD becomes available.

This small change halves the number of lines of code that need to be written.

## SSL Socket

ThorsSocket’s great advantage is that it wraps both the C socket and Open SSL libraries. Apart from the initial creation of the socket, its usage is entirely transparent and no different from using a normal socket (or even a file). The only change in the API from V1 is that it allows the user to provide a certificate and key file.

```C++
int main(int argc, char* argv[])
{

    if (argc != 4 && argc != 3)
    {
        std::cerr << "Usage: NisseV1 <port> <documentPath> [<SSL Certificate Path>]" << "\n";
        return 1;
    }
    ...
        std::optional<std::filesystem::path>    certDir;
        if (argc == 4) {
            certDir = std::filesystem::canonical(argv[3]);
        }
    ...

        WebServer   server(getServerInit(port, certDir), contentDir);
    ...
}
```

The first change is we add `certDir`; this is a `std::optional<>` type that, if provided, takes the directory where the SSL certificate and key files reside. We then use the `port` and `certDir` to create a `ServerInit` object that is passed to the Web Server to initialize its internal listening socket (previously, it just used a port).

```C++
ThorsAnvil::ThorsSocket::ServerInit getServerInit(int port, std::optional<std::filesystem::path> certPath)
{
    // If there is only a port.
    // i.e. The user did not provide a certificate path return a `ServerInfo` object.
    // This will create a normal listening socket.
    if (!certPath.has_value()) {
        return ThorsAnvil::ThorsSocket::ServerInfo{port};
    }

    // If we have a certificate path.
    // Use this to create a certificate objext.
    // This assumes the standard names for these files as provided by "Let's encrypt".
    ThorsAnvil::ThorsSocket::CertificateInfo     certificate{std::filesystem::canonical(std::filesystem::path(*certPath) /= "fullchain.pem"),
                                                             std::filesystem::canonical(std::filesystem::path(*certPath) /= "privkey.pem")
                                                            };
    ThorsAnvil::ThorsSocket::SSLctx              ctx{ThorsAnvil::ThorsSocket::SSLMethodType::Server, certificate};

    // Now that we have created the approporiate SSL objects needed.
    // We return an SServierInfo object.
    // Please Note: This is a different type to the ServerInfo returned above (one less S in the name).
    return ThorsAnvil::ThorsSocket::SServerInfo{port, std::move(ctx)};

    // We can return these two two different types becuase
    // ServerInit is actually a std::variant<ServerInfo, SServerInfo>
}
```

It is worth noting that `ServerInfo` and `SServerInfo` are distinct types and the `ServerInit` type is a `std::variant<>` that can accept either type. The `std::variant` is C++ type safe version of a `union` and allows you to safely store one of multiple types in an object.

### What is the next step

Now that we can trivially initialize the Web Server to use a socket or an SSL socket, we need an SSL certificate.






