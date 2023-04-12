---
layout: post
title: "Smart-Pointer - Unique Pointer"
date: 2014-12-30 18:41:42 -0800
comments: true
categories: [C++, Smart-Pointer, C++-By-Example, Coding ]
series: Smart-Pointer
tags: Smart-Pointer
footer: true
sharing: true
subtitle: C++ By Example
author: Loki Astari, (C)2013
description: C++ By Example. Part 1 Unique Pointer. It seems that it is a write of passage to implement your own version of a smart pointer. This article examines some of the common mistakes made by developers developing their own smart pointers.
---
On [codereview.stackexchange.com](https://codereview.stackexchange.com) in the C++ tag it seems that it is a write of passage to implement your own version of a smart pointer. A quick search brings up the following:

* 02/Sep/2011 - [shared_ptr implementation](https://codereview.stackexchange.com/q/4550/507)
* 26/Nov/2011 - [Shared Pointer implementation](https://codereview.stackexchange.com/q/6320/507)
* 18/Apr/2013 - [Request for review: reference counting smart pointer](https://codereview.stackexchange.com/q/25214/507)
* 20/May/2013 - [Efficient smart pointer implementation in C++](https://codereview.stackexchange.com/q/26353/507)
* 11/Aug/2013 - [C++98 Unique Pointer Implementation](https://codereview.stackexchange.com/q/29629/507)
* 14/Aug/2013 - [I wrote a class to implement auto_ptr](https://codereview.stackexchange.com/q/29734/507)
* 28/Aug/2013 - [yet another shared pointer](https://codereview.stackexchange.com/q/30398/507)
* 04/Mar/2014 - [Smart pointer implementation](https://codereview.stackexchange.com/q/43472/507)
* 13/May/2014 - [One more shared pointer](https://codereview.stackexchange.com/q/49672/507)
* 14/Jun/2014 - [Is this a meaningful Intrusive Pointer Class?](https://codereview.stackexchange.com/q/54220/507)
* 04/Aug/2014 - [Simple shared pointer](https://codereview.stackexchange.com/q/59004/507)
* 08/Oct/2014 - [Smart but simple pointers](https://codereview.stackexchange.com/q/65127/507)
* 15/Nov/2014 - [Simple auto_ptr](https://codereview.stackexchange.com/q/69943/507)
* 19/Dec/2014 - [Yet another smart pointer implementation for learning](https://codereview.stackexchange.com/q/74166/507)

Writing you own implementation of a smart pointer is a bad idea (IMO). The standardization and testing of smart pointers was a nine year process through [boost](https://www.boost.org/), with [boost::shared_ptr](https://www.boost.org/doc/libs/1_57_0/libs/smart_ptr/shared_ptr.htm) and [boost::scoped_ptr](https://www.boost.org/doc/libs/1_57_0/libs/smart_ptr/scoped_ptr.htm), finally resulting in the standardized versions being released in C++11: [std::shared_ptr](https://en.cppreference.com/w/cpp/memory/shared_ptr) and [std::unique_ptr](https://en.cppreference.com/w/cpp/memory/unique_ptr).

I would even say that I dislike the smart pointer as a learning device; it seems like a very simple project for a newbie, but in reality (as indicated by the nine year standardization processes) getting it working correctly in all contexts is rather a complex endeavor.

But because it is such a frequent request for review; I want to take a look at smart pointers as a teaching exercise. In the next couple of articles I will step through the processes of building a smart pointer and look at some of the common mistakes that I see (and probably make a few as I go).

### Warning:
This article is not for absolute beginners. I assume you already know the basics of C++.

## First Bash
So lets get started. The two most common smart pointers are `unique` and `shared`. So lets start with the one that seems the simplest (`unique`)and see where we go.

It would seem that we could bash out a quick unique pointer like this:

ThorsAnvil::UP Version 1
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*   data;
        public:
            UP(T* data)
                : data(data)
            {}
            ~UP()
            {
                delete data;
            }
            T* operator->() {return data;}
            T& operator*()  {return *data;}
            T* release()
            {
                T* result = nullptr;
                std::swap(result, data);
                return result;
            }
            // So it can be used in conditional expression
            operator bool() {return data;}
    };
}
```
### Problem 1: Rule of Three Violation
The first problem here is that we are not obeying the "[rule of three](https://stackoverflow.com/q/4172722/14065)". Since we have a destructor that does memory management we should also handle the copy constructor and assignment operator. Otherwise the following is allowed and will cause undefined behavior:

Rule of Three Copy Constructor
```c

int test1()
{
    ThorsAnvil::UP   sp1<int>(new int(5));
    ThorsAnvil::UP   sp2<int>(sp1);  // copy construction

             // Here the compiler generated copy constructor
             // kicks in and does a member wise copy of sp1
             // into sp2. That in itself is not a problem.
}
// But when sp2 goes out of scope its destructor kicks in
// and deletes the pointer. When sp1 subsequently follows
// sp2 out of scope it will also call delete on the same
// pointer (as they share a copy of the pointer).
//
// This is known as a double delete and causes
// undefined behavior (UB).
```

 The assignment operator is slightly worse:

Rule of Three Assignment Operator
```c
int test2()
{
    ThorsAnvil::UP   sp1<int>(new int(5));
    ThorsAnvil::UP   sp2<int>(new int(6));

    sp2 = sp1; // Assignment operation.

             // Here the compiler generated assignment
             // operator kicks in and does a member wise
             // assignment of sp1 into sp2.
             //
             // The main problem with the assignment here
             // is that we have lost the original pointer
             // that sp2 was holding.
}
// Same issues with double delete as the copy constructor.
```
This is caused by the compiler atomically generating default implementations of certain methods (see discussion on the [rule of three](https://stackoverflow.com/q/4172722/14065)) if the user does not explicitly specify otherwise. In this case the problem comes because of the compiler generated versions of the copy constructor and assignment operator (see below)

Compiler Generated Methods.
```c
namespace ThorsAnvil
{
    .....
        // Compiler Generated Copy Constructor
        UP(UP const& copy)
            : data(copy.data)
        {}

        // Compiler Generated Assignment Operator
        UP& UP::operator=(UP const& rhs)
        {
            data    = rhs.data;
            return *this;
        }
}
```
I have heard this described as a language bug; but I have to disagree with that sentiment, as these compiler generated methods do exactly as you would expect in nearly all situations. The one exceptions is when the class contains "owned raw pointers".
### Problem 2: Implicit construction.
The next issue is caused by C++ tendency to eagerly convert one type to another if given half a chance. If your class contains a constructor that takes a single argument then the compiler will use this as a way of converting one type to another.

Example
```c
void takeOwner1(ThorsAnvil::UP<int> x)
{}
void takeOwner2(ThorsAnvil::UP<int> const& x)
{}
void takeOwner3(ThorsAnvil::UP<int>&& x)
{}
int main()
{
    int*   data = new int(7);

    takeOwner1(data);
    takeOwner2(data);
    takeOwner3(data);
}
```
Though none of the functions in the example take an `int pointer` as a parameter; the compiler sees that it can convert an `int*` into an object of type `ThorsAnvil::UP<int>` via the single argument constructor and builds temporary objects to facilitate the calling of the function.

In the case of smart pointers, that take ownership of the object passed in the constructor, this can be a problem because the lifetime of a temporary object is the containing statement (with a few exceptions that we will cover in another article). As a simple rule of thumb you can think of the lifespan of a temporary ending at the `';'`.

Temporary Object
```c
takeOwner1(data);

// You can think of this as functionally equivalent to:

{
    ThorsAnvil::UP<int> tmp(data);
    takeOwner1(tmp);
}
```
The problem here is that when `tmp` goes out of scope its destructor will call delete on the pointer. Thus `data` is now pointing at memory that has been destroyed (and thus no longer belongs to the application). Any further use of `data` is going to potentially cause problems (and I am being generous using the word potentially).

This feature can be quite useful (when you want this conversion to happen easily, see std::string). But you should definitely be aware of it and think carefully about creating single argument constructors.
### Problem 3: Null de-referencing
I think it is obvious that `operator*` has an issue with de-referencing a Null pointer here:

operator&ast;()
```c
T& operator*()  {return *data;}
```
But it is not quite as obvious that `operator->` is also going to cause dereferencing of the pointer here:

operator->()
```c
T* operator->() {return data;}
```
There are a couple of solutions to this problem. You can check `data` and throw an exception if it is a Null pointer, or alternatively you can make it a pre-condition on the usage of the smart pointer (ie it is the responsibility of the user to either know or check the state of the smart pointer before using these methods).

The standard has chosen to go with a pre-condition (a very common C++ practice: do not impose an overhead on all your users (to spare problems for the beginner), but rather provide a mechanism to check the state for those that need to do so; so they can choose to pay the overhead when they need to and not every time). We can do the same here but we have not provided any mechanism for the user to check the state of the smart pointer.
### Problem 4: Const Correctness
When accessing the owned object via a smart pointer we are not affecting the state of our smart pointer so any member that basically returns the object (without changing the state of the smart pointer) should be marked const.

Not const
```c
T* operator->() {return data;}
T& operator*()  {return *data;}
```
So these two methods should really be declared as:

Const Correct
```c
T* operator->() const {return data;}
T& operator*()  const {return *data;}
```
### Problem 5: Bool conversion to easy
The current `operator bool()` works as required in bool expressions.

Check for value
```c
ThorsAnvil::UP<int>    value(new int(4));

if (value) {
    std::cout << "Not empty\n";
}
```
But the compiler will also use the conversion operators when it is trying to coerce objects that nearly match. For example you can now test two `UP` with `operator==` even though there does not exists an actual `operator==` for the `UP<>` class. This is because the compiler can convert both `UP<>` objects to bool and these can be compared.

Auto conversion is bad (mostly)
```c
ThorsAnvil::UP<int>    value1(new int(8));
ThorsAnvil::UP<int>    value2(new int(9));

if (value1 == value2) {
    // unfortunately this will print "They match".
    // Because both values are converted to bool (in this case true).
    // Then the test is done.
    std::cout << "They match\n";
}
```
In C++03 there was a nasty work around using pointers to members. But in C++11 there was added new functionality to make the conversion operator only fire in a boolean context otherwise it must be explicitly called.

explicit converter
```c
explicit operator bool() {return data;}
...
ThorsAnvil::UP<int>    value1(new int(8));
ThorsAnvil::UP<int>    value2(new int(9));

if (value1) { // This is expecting a boolean expression.
    std::cout << "Not nullptr\n";
}

if (static_cast<bool>(value1) == static_cast<bool>(value2)) { // Need to be explicit
    std::cout << "Both are either nullptr or not\n";
}
```
## Fixed First Try
So given the problems described above we can update our implementation to compensate for these issues:

horsAnvil::UP Version 2
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*   data;
        public:
            // Explicit constructor
            explicit UP(T* data)
                : data(data)
            {}
            ~UP()
            {
                delete data;
            }
            // Remove compiler generated methods.
            UP(UP const&)            = delete;
            UP& operator=(UP const&) = delete;

            // Const correct access owned object
            T* operator->() const {return data;}
            T& operator*()  const {return *data;}

            // Access to smart pointer state
            T* get()                 const {return data;}
            explicit operator bool() const {return data;}

            // Modify object state
            T* release()
            {
                T* result = nullptr;
                std::swap(result, data);
                return result;
            }
    };
}
```
If you are thinking this is not enough you are correct. We still have some more work to do. But lets leave it at that for version one.
## Summary
So in this initial post we have looked at a typical first attempt at a smart pointer and summarized the common problems I often see in these home grown smart pointer implementations.
