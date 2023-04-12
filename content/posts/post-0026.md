---
layout: post
title: "Common Mistakes"
date: 2013-11-18 08:58:28 -0800
comments: true
categories: [C++, So-You-Want-To-Learn-C++, Coding]
series: So-You-Want-To-Learn-C++
tags: So-You-Want-To-Learn-C++
sharing: true
footer: true
subtitle: So you want to learn C++
author: Loki Astari, (C)2013
description: C++ for beginners. Part 2 Common Mistakes
---

### 1: using namespace

Every new developer that comes to C++ always starts writing code like this:

myfirstprog.cpp
```c
#include <iostream>

using namespace std;
```

It seems reasonable and every book on learning C++ out there perpetrates the same mistake. The problem is the " **using namespace std;** ". On programs that are only 10 lines long (like in most books) it does not cause any problems. But as soon as your code strays to any meaningful size then it starts to become an issue. The problem with teaching new developers this technique is that they are not aware of the problems it causes and so it becomes a habit for all code they write. Break this habit **now** before you start doing it without thinking at the top of every source file you write.

So what are the actual issues? Please read this article: [Why is “using namespace std;” considered bad practice?](https://stackoverflow.com/q/1452721/14065) and the [best Answer](https://stackoverflow.com/a/1453605/14065) that explains what the problem is in detail.

We call this problem namespace pollution. What the `using` clause is doing is pulling everything from the named namespace into the current namespace; this will cause issues if there is already code in the current namespace. Doing this in your source file is bad enough but even worse is doing this in your header file. The problem with doing it in a header file is that you pollute the namespace for every source file that includes your header file. If the user of the header file is not aware of this pollution then trying to track down a suddenly new issue becomes really very hard.

But not doing this is causing my much more typing!

toomuch.cpp
```c
#include <iostream>
int main()
{
    cout << "Hello World\n";

    // Now looks much longer
    std::cout << "Hello World\n";
}
```

If you think adding `std::` as a prefix to anything in the standard namespace is a bother (then you need another language); there is a solution. Only pull into the current namespace what you actually need. And then try and restrict the scope so it is tight as possible;

short.cpp
```c
#include <iostream>
int main()
{
    using std::cout;
    // The using clause is scoped and thus cout is only in the global namespace for
    // the scope of the main() function.
    cout << "Hello Workld\n";
}
```

An additional technique to shorten namespace prefixes are namespace alias. These are very useful when things are nested inside multiple namespaces' (or have very long unhelpful names)

alias.cpp
```c
#include <boost/numeric/ublas/vector.hpp>

// Here we define bnu as an alias too: boost::numeric::ublas
// We can use either as the prefix to things in the that namespace;
namespace bnu = boost::numeric::ublas;

bnu::vector<double>                      data1;
boost::numeric::ublas::vector<double>    data2;
```

### 2: Prefixing identifiers with &#39;&#95;&#39;
A lot of developers new to C++ try to learn by browsing the standard libraries and getting there habits from things done there or bring conventions from their current favorite languages into there C++ code. One of the things they ultimately pick up on is using '&#95;' as a prefix for identifiers.

Though technically not wrong in all situations the actual rules on using the '&#95;' as an identifier prefix are non trivial. Thus making it a habit will eventually get you burnt. The issue is that most identifiers that have prefix '&#95;' are reserved for use by the implementation, thus the compiler/linker may potentially do special things with them. You can read up on the issue here: [What are the rules about using an underscore in a C++ identifier?](https://stackoverflow.com/q/228783/14065).

### 3: void main()
There are only two valid declarations from main in C++

main.cpp
```c
// Version 1: You don't care about command line parameters.
int main()
{
}

// Version 2: You do care about command line parameters.
int main(int argc, char* argv[])
{
        // Note: The parameters argc and argv are not actually required as a name.
        //       But they are so commonly defined that way that using any other
        //       names would cause experienced developers to do a double take.
        //       It is best to just stick with the convention.
}

// Version 2a: You do care about command line parameters.
#include <vector>
int main(int argc, char* argv[])
{
        // If you want to convert all the command line parameters to strings.
        // This simple trick can be useful:
        std::vector<std::string>  args(argv, argv+argc);
}
```
