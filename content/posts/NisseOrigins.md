---
layout: post
title: "Nisse - Origins of a serverice"
date: 2024-11-04T12:50:31-0800
author: Loki Astari, (C)2024
comments: true
categories: ["C++", "Nisse", "Server", "C++-By-Example", "Coding"]
series: Nisse
tags: Nisse
sharing: true
footer: true
subtitle: C++ By Example
description: Nisse. The step by step creation of a C++ Server architecture.
image: /images/post/post-2.png
imageInfo:
    original:           https://unsplash.com/photos/W-oqNwbmin0
    License:            Unsplash License
    LicenseLink:        https://unsplash.com/license
    Attribution:        Oscar Nilsson
    AttributionLink:    https://unsplash.com/@oscrse
featured: true
draft: false
disqusId: "http://lokiastari.com/blog/2024/11/04/Nisse/"
---

# [Nisse](https://github.com/Loki-Astari/Nisse)

[Nisse](https://github.com/Loki-Astari/Nisse) is a C++ library that makes it simple to create C++ web based [applications](https://github.com/Loki-Astari/Nisse/tree/master/src/Examples). The library provides the framework for handling incoming connections and executing user defined code based on the request. The library will suspend execution of user code and **re-use** a thread if the user code would block performing a read/write operation on a connection.

The concept is to allow beginner engineers write normal synchronous looking C++ code that is easy to reason about, but provide the asynchronous processing the is inherently needed for web based application to be efficient.

## Why

I admire the Javascript/NodeJS model that makes it (relatively) easy for beginners to quickly and intuitively build simple working web based applications. The ability to build these simple web apps is a great teaching platform that has allowed easy experimentation by beginners and thus provide them with a platform to learn new skills that are easy to demonstrate to friends (The "Look what I have built" word of month).

In comparison building even simple web based apps in C++ is exceedingly non trivial and not very conducive for teaching. I don't think it will ever be as simple to create web apps in C++; but I hope that Nisse can be used by beginners to quickly throw together a web based application and shout out to heir friends, "Look what I have built, come check it out".

## How

Nisse is built on some standard libraries ([libEvent](https://libevent.org/), [Boost CoRoutine2](https://www.boost.org/doc/libs/1_86_0/libs/coroutine2/doc/html/index.html)) that do the heavy lifting. Nisse just wires them together in a simple to use framework.

I will create a set of posts that explain how Nisse works but also provide a mini tutorial on C++ coding and how web applications work as I go. Once I have completed the set of articles about Nisse I will use it as a platform to built little demonstrations applications that demonstrate C++ coding and hopefully provide some lessons in modern C++ techniques.
