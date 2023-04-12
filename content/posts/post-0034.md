---
layout: post
title: "Smart-Pointer - Constructors"
date: 2015-01-23 16:33:14 -0800
comments: true
categories: [C++, Smart-Pointer, C++-By-Example, Coding]
series: Smart-Pointer
tags: Smart-Pointer
sharing: true
footer: true
subtitle: C++ By Example
author: Loki Astari, (C)2014
description: C++ By Example. Part 3 Smart Pointer Constructors. In this article we examine constructors that are often missed or overlooked. This article looks at the use cases for these constructors and explains why the added functionality provides a meaningful addition in relation to smart pointers.
---
In this article we examine constructors that are often missed or overlooked. This article looks at the use cases for these constructors and explains why the added functionality provides a meaningful addition in relation to smart pointers.

## Default Constructor
Most people remember the default constructor (a zero argument constructor), but every now and then it gets missed.

The default constructor is useful when the type is used in a context where objects of the type need to be instantiated dynamically by another library (an example is a container resized; when a container is made larger by a resize, new members will need to be constructed, it is the default constructor that will provide these extra instances).

The default constructor is usually very trivial and thus worth the investment.

Smart Pointer Default Constructor
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*      data;
        public:
            UP()
                : data(nullptr)
            {}
            .....
    };
}
```
## The nullptr
In C++11 the `nullptr` was introduced to replace the old broken `NULL` and/or the even more broken `0` for use in contexts where you want a pointer that points at nothing. The `nullptr` is automatically convert to any pointer type or a boolean; but fixed the previous bug (or bad feature) and will not convert to a numeric type.

nullptr Usage Example
```c
#include <string>
int main()
{
    char*           tmp = nullptr;   // converts the nullptr (type std::nullptr_t) to char*
    std::string*    str = nullptr;   // hopefully you never do that! but it works.

    bool            tst = nullptr;   // False. Yes I know it does not look that useful.
                                     //        But when you consider all the funny things
                                     //        that can happen with templates this can
                                     //        be very useful.

    int             val = nullptr;   // Fails to compile.
    int             val = NULL;      // Pointer assigned to integer value.
                                     // Works just fine. But very rarely was this a useful
                                     // feature (more usually an over-site that was not
                                     // reported by the compiler).
}
```
The `nullptr` provides some opportunities to make the code shorter/cleaner when initializing smart pointers to be empty. Because we are using explicit one argument constructors the compiler can not convert a `nullptr` into a smart pointer automatically, it must be done explicitly by the developer.

nullptr failing on Smart Pointer
```c
void workWithSP(ThorsAnvil::UP<int>&& sp)
{ /* STUFF*/ }

int main()
{
    // This fails to compile.
    workWithSP(nullptr);

    // Need to be explicit with smart pointers
    workWithSP(ThorsAnvil::UP<int>(nullptr));
}
```
This is overly verbose, there is no danger involved in forming a smart pointer around a `nullptr` automatically. Because `nullptr` has its own type `std::nullptr_t` we can add a constructor to explicitly simplify this case, which makes it easier to read.

Smart Pointer with std::nullptr_t constructor
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        public:
            UP(std::nullptr_t)
                : data(nullptr)
            {}
	....
    };
}
// Now we can simplify our use case
void workWithSP(ThorsAnvil::UP<int>&& sp)
{ /* STUFF*/ }

int main()
{
    workWithSP(nullptr);

    // Note this also allows:
    ThorsAnvil::UP<int>   data  = nullptr;
    // And
    data = nullptr;       // Note here we have we convert nullptr to
                          // smart pointer using the one argument
                          // constructor that binds `nullptr` then
                          // call the assignment operator.
                          //
                          // That seems like a lot extra work. So we
                          // may as well define the assignment operator
                          // to specifically user `nullptr`.
}
```
## Move Semantics
Move semantics were introduced with C++ 11. So though we can not copy the `ThorsAnvil::UP` object it can be moved. The compiler will generate a default move constructor for a class under certain situations; but because we have defined a destructor for `ThorsAnvil::UP` we must manually define the move constructor.

Move semantics say that the source object may be left in an undefined (but must be valid) state. So the easiest way to implement this is simply to swap the state of the current object with the source object (we know our state is valid so just swap it with the incoming object state (its destructor will then take care of destroying the pointer we are holding)).

Smart Pointer Move Semantics
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*      data;
        public:
            // Swap should always be `noexcept` operation
            void swap(UP& src) noexcept
            {
                std::swap(data, src.data);
            }
            // It is a good idea to make your move constructor `noexcept`
            // In this case it actually makes no difference (because there
            // no copy constructor) but to maintain good practice I still
            // think it is a good idea to mark it with `noexcept`.
            UP(UP&& moving) noexcept
            {
                moving.swap(*this);
            }
            UP& operator=(UP&& moving) noexcept
            {
                moving.swap(*this);
                return *this;
            }
            .....
    };
    template<typename T>
    void swap(UP<T>& lhs, UP<T>& rhs)
    {
        lhs.swap(rhs);
    }
}
```
## Derived Type Assignment.
Assigning derived class pointers to a base class pointer object is quite common feature in C++.

Derived Example
```c
class Base
{
    public:
        virtual ~Base() {}
        virtual void doAction() = 0;
};
class Derived1: public Base
{
    public:
        virtual void doAction() override;
};
class Derived2: public Base
{
    public:
        virtual void doAction() override;
};
int main(int argc, char* argv[])
{
    Derived1*   action1 = new Derived1;
    Derived2*   action2 = new Derived2;

    Base*       action   = (argc == 2) ? action1 : action2;
    action->doAction();
}
```
If we try the same code with the constructors we currently have we will get compile errors.

Derived Example with Smart Pointers
```c
int main(int argc, char* argv[])
{
    ThorsAnvil::UP<Derived1>    action1 = new Derived1;
    ThorsAnvil::UP<Derived2>    action2 = new Derived2;

    ThorsAnvil::UP<Base>        action   = std::move((argc == 2) ? action1 : action2);
    action->doAction();
}
```
This is because C++ considers `ThorsAnvil::UP<Derived1>`, `ThorsAnvil::UP<Derived2>` and `ThorsAnvil::UP<Base>` are three distinct classes that are unrelated. As this kind of pointer usage is rather inherent in how C++ is used the smart pointer needs to be designed for this use case.

To solve this we need to allow different types of smart pointer be constructed from other types of smart pointer, but only where the inclosed types are related.

Derived Smart Pointer transfer
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*      data;
        public:
            // Release ownership of the pointer.
            // Returning the pointer to the caller.
            T*  release()
            {
                T* tmp = nullptr;
                std::swap(tmp, data);
                return tmp;
            }
            // Note: If you try calling this with a U that is not derived from
            //       a T then the compiler will generate a compilation error as
            //       the pointer assignments will not match correctly.
            template<typename U>
            UP(UP<U>&& moving)
            {
                // We can not use swap directly.
                // Even though U is derived from T, the reverse is not true.
                // So we have put it in a temporary locally first.

                // Note: this is still exception safe.
                //       The normal constructor will call delete even if it does
                //       not finish constructing. So if release completes even
                //       starting the call to the constructor guarantees its safety.
                UP<T>   tmp(moving.release());
                tmp.swap(*this);
            }
            template<typename U>
            UP& operator=(UP<U>&& moving)
            {
                UP<T>    tmp(moving.release());
                tmp.swap(*this);
                return *this;
            }
            .....
    };
}
```
## Updated Unique Pointer
Combine the constructor/assignment operators discussed in this article with the `ThorsAnvil::UP` that we defined in the first article in the series: [Unique Pointer](https://lokiastari.com/blog/2014/12/30/c-plus-plus-by-example-smart-pointer/) we obtain the following:

ThorsAnvil::UP Version 3
```c
namespace ThorsAnvil
{
    template<typename T>
    class UP
    {
        T*   data;
        public:
            UP()
                : data(nullptr)
            {}
            // Explicit constructor
            explicit UP(T* data)
                : data(data)
            {}
            ~UP()
            {
                delete data;
            }

            // Constructor/Assignment that binds to nullptr
            // This makes usage with nullptr cleaner
            UP(std::nullptr_t)
                : data(nullptr)
            {}
            UP& operator=(std::nullptr_t)
            {
                reset();
                return *this;
            }

            // Constructor/Assignment that allows move semantics
            UP(UP&& moving) noexcept
            {
                moving.swap(*this);
            }
            UP& operator=(UP&& moving) noexcept
            {
                moving.swap(*this);
                return *this;
            }

            // Constructor/Assignment for use with types derived from T
            template<typename U>
            UP(UP<U>&& moving)
            {
                UP<T>   tmp(moving.release());
                tmp.swap(*this);
            }
            template<typename U>
            UP& operator=(UP<U>&& moving)
            {
                UP<T>    tmp(moving.release());
                tmp.swap(*this);
                return *this;
            }

            // Remove compiler generated copy semantics.
            UP(UP const&)            = delete;
            UP& operator=(UP const&) = delete;

            // Const correct access owned object
            T* operator->() const {return data;}
            T& operator*()  const {return *data;}

            // Access to smart pointer state
            T* get()                 const {return data;}
            explicit operator bool() const {return data;}

            // Modify object state
            T* release() noexcept
            {
                T* result = nullptr;
                std::swap(result, data);
                return result;
            }
            void swap(UP& src) noexcept
            {
                std::swap(data, src.data);
            }
            void reset()
            {
                T* tmp = releae();
                delete tmp;
            }
    };
    template<typename T>
    void swap(UP<T>& lhs, UP<T>& rhs)
    {
        lhs.swap(rhs);
    }
}
```
## Summary
In the last two articles ([Unique Pointer](https://lokiastari.com/blog/2014/12/30/c-plus-plus-by-example-smart-pointer/) and [Shared Pointer](https://lokiastari.com/blog/2015/01/15/c-plus-plus-by-example-smart-pointer-part-ii/)) we covered some basic mistakes that I have often seen developers make when attempting to creating their own smart pointer. I also introduce four important C++ concepts:

 - [Rule of Three](https://stackoverflow.com/q/4172722/14065)
 - [Copy and Swap Idiom](https://stackoverflow.com/q/3279543/14065)
 - [Explicit One Argument Constructor](https://stackoverflow.com/a/121163/14065)
 - [Try/Catch on Initialization List](https://stackoverflow.com/q/12697625/14065)

This article I focused on a couple of constructors/assignment operators that can be overlooked overlooked.
