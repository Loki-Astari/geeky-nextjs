---
layout: post
title: "Hello World"
date: 2013-11-12 07:59:11 -0800
comments: true
categories: [C++, So-You-Want-To-Learn-C++, Coding]
series: So-You-Want-To-Learn-C++
tags: So-You-Want-To-Learn-C++
sharing: true
footer: true
subtitle: So you want to learn C++
author: Loki Astari, (C)2013
description: C++ for beginners. Part 1 Hello World. I keep trying to think about something big and interesting to write about. But that is just not working. All my time is spent trying to think of the blockbuster idea; which just gets in the way of actually writing. So lets start with the small things. If I can get into the habit of writing something a couple of times a week. Then maybe we can work up to interesting stuff.
---
This is the first article in the series
OK. Lets do this.

I keep trying to think about something big and interesting to write about. But that is just not working. All my time is spent trying to think of the blockbuster idea; which just gets in the way of actually writing. So lets start with the small things. If I can get into the habit of writing something a couple of times a week. Then maybe we can work up to interesting stuff.

Step one; write about something I know. C++; we now start the "So you want to learn C++" series of posts.

I am going to assume two things.

* You know how to use the compiler
* That you have some basic programming experience C/Java/C#/Perl/PHP (nearly anything)
So you understand the basics of program but are unfamiliar with C++

First thing everybody needs is to get something working; here is the classic "Hello World" in C++

helloworld.cpp
```c
#include <iostream>

int main()
{
    std::cout << "Hello World\n";
}
```

The next step is to accepts user input and generates a response based on that input. Lets move on to the not quite as classic "Hi There Bob" :-)

hitherebob.cpp
```c
#include <iostream>
#include <string>

int main()
{
    std::cout << "Hi there what's your name?\n";

    std::string  line;
    std::getline(std::cin, line);

    std::cout << "It was good to meet you " << line << "\n";
}
```

The above code is relatively simple and only a few things to note:

* `#include <iostream>`
Imports the standard input and output facilities so you can print messages to the user and read user input.
    + `std::cin`
Is the standard input stream. From this you can read user input.
    + `std::cout`
Is the standard output stream. You can print text to the user console.
* `#include <string>`
Imports the standard string handling function. Most importantly it imports the type `std::string`.
    + `std::string`
This is one of the standard types and holds strings (a list of characters). We will go over types (and variables) in a lot more details in subsequent articles. But for just accept that `line` is a variable (of type std::string) used to hold a line of user input.
    + `std::getline()`
This is a function that reads a line of text from a `std::istream` into a `std::string`. In this case we use `std::cin` as the input stream (it is a specialization of a std::istream and can thus be used as the input). Thus we read `a line` of input from the user.



There are a lot of other concepts encapsulated above that I don't want to get into quite yet. But don't worry I will cover them all.
