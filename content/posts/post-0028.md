---
layout: post
title: "Functions"
date: 2013-11-24 09:22:04 -0800
comments: true
categories: [C++, So-You-Want-To-Learn-C++, Coding]
series: So-You-Want-To-Learn-C++
tags: So-You-Want-To-Learn-C++
sharing: true
footer: true
subtitle: So you want to learn C++
author: Loki Astari, (C)2013
description: C++ for beginners. Part 4 Functions. All C++ applications must have at least one function; this is called `main()`. Additionally, you can have user defined functions that encapsulate individual tasks, thus allowing the code to be cleaner and easier to read. Therefore, this is a useful feature if you repeat the same task many time with only slight variations.
---

### Usage
All C++ applications must have at least one function; this is called `main()`. Additionally, you can have user defined functions that encapsulate individual tasks, thus allowing the code to be cleaner and easier to read. Therefore, this is a useful feature if you repeat the same task many time with only slight variations:

function1.cpp
```c
#include <string>
#include <iostream>

int main(int argc, char* argv[])
{
     std::cout << "What is your first name?\n";
     std::string firstName;
     std::cin >> firstName;

     std::cout << "What is your second name?\n";
     std::string secondName;
     std::cin >> secondName;

     std::cout << "What is your Mother's name?\n";
     std::string motherName;
     std::cin >> motherName;

     std::cout << "What is your Father's name?\n";
     std::string fatherName;
     std::cin >> fatherName;
}
```

It is easy to spot the obvious repetition here. We can simplify this code by using a function that does all the common work. Anything that is unique we can pass as parameters to the function.

function2.cpp
```c
#include <string>
#include <iostream>

std::string getNameFor(std::string who)
{
    std::cout << "What is your " << who << " name?\n";
    std::string result;
    std::cin >> result;
    return result;
}

int main(int argc, char* argv[])
{
     std::string firstName  = getNameFor("first");
     std::string secondName = getNameFor("second");
     std::string motherName = getNameFor("Mother's");
     std::string fatherName = getNameFor("Father's");
}
```

### Definition
OK. We have seen an example but what is the exact format of a function

function3.cpp
```c
// A function definition is very simple
<ReturnType>  <FunctionName>(<OptionalArgumentList>)
{
    <OptionalCode>
}

//  ReturnType:            This is the name of any type (built in or user defined)
//                         At the end of function you must have a statement
//                         that returns an object of this type.
//
//  FunctionName:          A unique name that identifies the function.
//
//  OptionalArgumentList:  This is either empty.
//                         Or a comma separated list of parameters.
//                         Because C++ is strongly typed each parameter is defined
//                         with both a type and a name.
//
//  OptionalCode:          We will be discussing this in more detail throught
//                         these articles. But the new statement to learn is
//                         `return <Value>`. This is the value returned by the
//                         function to the original caller.
//
//  Value:                 Notice that above I use the term `Value` and not object.
//                         A `Value` here can be an explicit object or the result
//                         of evaluating an expression (temporary object). Note
//                         one type of expression is a function call.
//
//                         return "An explicit String Object";
//
//                         return theResultOfAFunctionCall("Get A Result");
```

If a function has `void` return type then you don't need to **Return Statement**. With any other return type your function must exit by using a **Return Statement**. The **Return Statement** determines the value returned to the caller from the function. The one exception to this rule (and their has to be an exception to make it a rule) is `int main()`. If you don't explicitly have a **Return Statement** int `int main()` the compiler will plant `return 0;` for you.


### Forward Declaration

One thing to note about a function is that you can not use it before a declaration. We rewrite the original example above as:

function4.cpp
```c
#include <string>
#include <iostream>

int main(int argc, char* argv[])
{
     std::string firstName  = getNameFor("first");
     std::string secondName = getNameFor("second");
     std::string motherName = getNameFor("Mother's");
     std::string fatherName = getNameFor("Father's");
}

std::string getNameFor(std::string who)
{
    std::cout << "What is your " << who << " name?\n";
    std::string result;
    std::cin >> result;
    return result;
}
```

The only difference from above here is that I have moved the `main()` function before the `getNameFor()` function. This will generate a compilation error as you are using the function `getNameFor()` before a declaration. This may seem a potential problem but it is a deliberate technique that makes sure you spell things correctly before use. In the above situation the only change you need to make is a forward declaration. This allows you to declare a function before you define it. The utility of this will become clear when we start defining modules.

function5.cpp
```c
#include <string>
#include <iostream>

// Add a forward declaration
extern std::string getNameFor(std::string who);

// A forward declaration is basically a function declaration without a body.
// Add an extern prefix and a semicolon on the end (the rest you should copy
// and paste from the function definition).
//
//
// Note: For the languages lawyers who want to complain about the extern.
//       Just hold your horses we will get to the intricacies in due course;
//       this is only lesson 4.

int main(int argc, char* argv[])
{
     std::string firstName  = getNameFor("first");
     std::string secondName = getNameFor("second");
     std::string motherName = getNameFor("Mother's");
     std::string fatherName = getNameFor("Father's");
}

std::string getNameFor(std::string who)
{
    std::cout << "What is your " << who << " name?\n";
    std::string result;
    std::cin >> result;
    return result;
}
```

