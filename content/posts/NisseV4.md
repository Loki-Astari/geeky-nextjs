---
layout: post
title: "Multi Threading"
date: 2024-11-12T12:48:30-0800
author: Loki Astari, (C)2024
comments: true
categories: ["C++", "Nisse", "Server", "C++-By-Example", "Coding"]
series: Nisse
tags: Nisse
sharing: true
footer: true
subtitle: Nisse
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
disqusId: "http://lokiastari.com/blog/2024/11/12/Nisse/"
---

# [Nisse](https://github.com/Loki-Astari/Nisse)

In the first two articles, we created a very basic Web Server. A major issue with this simplistic server is that it can only handle connections serially. In this article, we introduce a thread pool that will handle the actual requests. The main thread will accept new requests and create the work items to be handled by the thread pool.

## NisseV4

All the code for this article is in two source files in the [V4](https://github.com/Loki-Astari/NisseBlogCode/tree/master/V4) directory. It uses standard libraries and [thors-mongo](https://github.com/Loki-Astari/ThorsMongo). If you have a Unix-like environment, this should be easy to build; if you use Windows, you may need to do some extra work. A “Makefile” is provided just as an example.

### Build & Run

```bash
  > brew install thors-mongo              # A header-only version of thors-mongo can be alternatively installed.
  > git clone https://github.com/Loki-Astari/NisseBlogCode.git
  > cd NisseBlogCode/V4
  > make
  > ./NisseV4 8080 /Directory/You/Want/To/Server/On/Port/8080 /etc/letsencrypt/live/<MySite.com>/
```

## Threading Potential concerns

In some previous code reviews I have done, I have seen beginners create a new thread for each new connection that is created. The thread will handle the request and complete (thread exiting and being killed). This is acceptable for a Web Server that handles a very low volume of calls and will keep the code simple, but it is a problematic design for high-volume or general servers.

Creating a thread is a resource-intensive process, so it's generally discouraged to create and destroy a large number of threads. Additionally, the CPU can typically handle only one thread per core at any time; therefore, making a vast number of threads may lead to [thrashing](https://en.wikipedia.org/wiki/Thrashing_(computer_science)#) as the scheduler attempts to allocate time slices for each thread to perform active work.

The best practice is generally to create a thread pool in which threads are assigned “Work Items” from a queue. Upon completion, they are reused to handle subsequent “Work Items” but suspended when no “Work Items” are available.

The C++ standard tried to indirectly address thread pools via the standard library `async()` function. This function abstracts the concept of threads and allows the implementation to provide its own internal thread pool. However, we are not going to use this feature in this project; in a subsequent article, I want to explore the concepts of cooperative multitasking using CoRoutines.

##  What has Changed

We have added a class [JobQueue](https://github.com/Loki-Astari/NisseBlogCode/tree/master/V4/JobQueue.h) that maintains a pool of worker threads and a queue of jobs (active connections) that need to be handled. Before delving into the details of JobQueue, I will describe the changes to the code presented in the previous article [C++ Sockets](https://lokiastari.com/posts/NisseV2).

### WebServer

```C++
class WebServer
{

    ThorsAnvil::ThorsSocket::Server     connection;
    bool                                finished;
    std::filesystem::path const&        contentDir;

    // Store JobState in a way where it will not move and can be accessed easily.
    // A std::map does not move its members (once inserted), only invalidating
    // an object when it is removed from the map.
    std::mutex openSocketMutex;
    std::map<int, ThorsAnvil::ThorsSocket::SocketStream>         openSockets;
    // Simply added a JobQueue object to the WebServer class.
    ThorsAnvil::Nisse::Server::JobQueue jobQueue;
    public:
        // The constructor now takes an extra parameter to initialize the number of worker threads
        // that will be created in the pool, this parameter is simply passed to the JobQueue constructor.
        WebServer(std::size_t workerCount, ThorsAnvil::ThorsSocket::ServerInit&& serverInit, std::filesystem::path const& contentDir);

        void run();
    private:
        void handleConnection(ThorsAnvil::ThorsSocket::SocketStream& socket);
};
```

The main code change is within the `run()` method. Previously, this method simply accepted a connection and called `handleConnection()` to process the incoming request. Thus, it blocked the main thread from accepting another connection until the current connection had been fully handled.

```C++
void WebServer::run()
{
    while (!finished)
    {
        ThorsAnvil::ThorsSocket::SocketStream socket = connection.accept();

        handleConnection(socket);
    }
}
```

The new version is similar. The main thread still accepts connections, but instead of handling them, it adds a “Work Item” to the job queue for the thread pool to process asynchronously. It is important to note that because the work is done in another thread, we must store the state (the `newSocket` object) in a way that prevents it from being destroyed until the connection has been handled. We have introduced the `openSockets` object to store these connections.

```C++
void WebServer::run()
{
    while (!finished)
    {
        // Main thread waits for a new connection.
        ThorsAnvil::ThorsSocket::SocketStream newSocket = connection.accept();

        // Add the “newSocket” into the std::map object “openSockets”
        int fd = newSocket.getSocket().socketId();
        std::unique_lock<std::mutex>    lock(openSocketMutex);
        auto [iter, ok] = openSockets.insert_or_assign(fd, std::move(newSocket));

        // Add a lambda to the JobQueue to handle the newly created socket.
        // Note: A copy of the “iter” is placed in the object “iterator” so we can use
        //       this to extract a reference to the socket object. This is thread safe
        //       as iterators to std::map are not invalidated by operations on the map
        //       (as long as the object is not deleted).
        jobQueue.addJob([&, iterator = iter](){
            // Get a reference to the socket.
            auto& socket = iterator->second;
            // Handle the reference as before.
            handleConnection(socket);
            // Once processing is complete remove the storage for Socket
            // and clean up any associated storage.
            std::unique_lock<std::mutex>    lock(openSocketMutex);
            openSockets.erase(iterator);
        });
    }
}
```

### JobQueue

In C++20 the standard library added a new thread type, `std::jthread`. Quote: [indi](https://codereview.stackexchange.com/users/170106/indi) `std::jthread is what std::thread should have been. It is superior in every way, with no drawbacks`.

Unfortunately, my platform does not currently support `std::jthread` in its implementation of the C++20 standard library. Therefore, the following code must navigate some extra hoops to ensure that `std::thread` behaves correctly in all corner cases. One major difference is that with `std::thread`, you must explicitly `join()` the thread of execution before the `std::thread` object is destroyed. In contrast, the `std::jthread` destructor will automatically `join()` the thread of execution if not already done.

#### Construction

```C++
JobQueue::JobQueue(std::size_t workerCount)
    : finished{false}
{
    try
    {
        for (std::size_t loop = 0; loop < workerCount; ++loop) {
            workers.emplace_back(&JobQueue::processWork, this);
        }
    }
    catch (...)
    {
        // because `std::thread` may potentially throw during construction.
        // We must ensure we correctly clean up any constructed `std::thread` objects
        // otherwise the thread of execution will not be correctly joined, and the application
        // terminated. 
        stop();

        // Once we know the threads have been correctly cleaned up, we can re-throw the exception.
        throw;
    }
}

JobQueue::~JobQueue()
{
    // Wait for all threads of execution to be correctly joined.
    stop();
}
```

The `stop()` method is actually relatively simple to implement.

```C++
void JobQueue::markFinished()
{
    std::unique_lock    lock(workMutex);
    finished = true;
}

void JobQueue::stop()
{
    // Setting the finished variable prevents threads from picking up new work in the
    // `getNextJob() method and cause them to exit a loop in the `processWork()` method
    // thus completing.
    markFinished();

    // Some threads may be waiting on a condition variable; this will release them to go check for the next job.
    workCV.notify_all();

    // Wait for all threads of execution to complete by execution `join()` on them.
    for (auto& w: workers) {
        w.join();
    }

    // Once all threads of execution have completed:
    // Destroy the thread objects.
    workers.clear();
}
```

#### Adding Work

Finally, we can look at the methods run by the threads.

If you are new to threading, the only challenging concept is the `std::condition_variable`. This type allows you to suspend a thread's execution until a specific condition is met. While a thread is suspended, it consumes no resources, which makes it an effective way to ensure that the CPU isn’t used when there is no work for the thread to perform. You suspend a thread by calling `wait()` on the condition variable. Another thread can wake up suspended threads by calling `notify_one()` (which wakes up one suspended thread) or `notify_all()` (which wakes up all suspended threads).

Code typically follows this pattern:
```C++
    std::mutex               mutex;
    std::condition_variable  cv;

    ….


    // Code run by thread
    std::unique_lock    lock(mutex);
    while (!resourceIWantIsAvailable())  // Notice the ! at the beginning of the test.
    {
        cv.wait(lock);
        // The wait function will release the lock and then suspend the thread.
        // When a thread is woken up, it must first reacquire the lock before it returns from wait()
        // So when the wait() function exists, it still has the lock it established above.
    }

    // If the thread reaches here, we know the resource is available for the thread.
```

The first question most beginners ask is: `Why is the wait() function called inside a loop?`. This is because between the time a thread calls `notify_one()` to wake up a waiting thread and the point a waiting thread exists the wait() function, another thread may have already consumed the resource. Therefore, you need to validate that the resource is still available, and if not, go back into the wait().

This loop is essential, so the C++ `std::conditional_variable` actually builds it into the wait interface. You can pass a lambda to the test as a second parameter.

```C++
        cv.wait(lock, [&](){return resourceIWantIsAvailable();});
```

Now that we have covered the basics of a condition variable, the code used by the thread pool looks like this.


```C++
// Retrieve a job from the work queue.
// Suspend on condition variable if needed.
// Note 1: In a shutdown scenario, the `finished` variable is true. In this case return but with no work.
// Note 2: Because you can return without work, the return type is `std::optional`.
std::optional<Work> JobQueue::getNextJob()
{
    std::unique_lock    lock(workMutex);
    workCV.wait(lock, [&](){return !workQueue.empty() || finished;});

    // We are returning with no work.
    // So simply exit.
    if (workQueue.empty() || finished) {
        return {};
    }

    // If we reach here, we have a lock on `workMutex` so we can modify the
    // the state of the object. Extract the oldest “Work Item” from the queue
    // and return it.
    Work work = std::move(workQueue.front());
    workQueue.pop();
    return work;
}

void JobQueue::processWork()
{
    // While the server is running loop.
    while (!finished)
    {
        // Get a piece of work from the queue.
        std::optional<Work> work   = getNextJob();
        try
        {
            // We run work items inside a try block as “User Code” can not be trusted.
            if (work.has_value()) {
                (*work)();
            }
        }
        // If there is an exception, we log it, but DO NOT exit.
        // An exception in “User Code” should not affect the stability of the server itself.
        catch (std::exception const& e)
        {
            ThorsLogWarning("ThorsAnvil::Nissa::JobQueue", "processWork", "Work Exception: ",  e.what());
        }
        catch (...)
        {
            ThorsLogWarning("ThorsAnvil::Nissa::JobQueue", "processWork", "Work Exception: Unknown");
        }
    }
}
```

## Next Step

This article explains how we can use threads to potentially parallelize responses to multiple requests. Each thread sequentially runs only one request at a time and may be blocked while processing a request. In a subsequent article, I will detail how we can utilize cooperative multitasking to switch I/O-blocked threads to another request, improving parallelism without using additional resources.



