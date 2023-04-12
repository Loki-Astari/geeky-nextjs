---
layout: post
title: "Memory Resizing"
date: 2016-03-25 05:53:07 -0700
comments: true
categories: [C++, ResourceManagement, C++-By-Example, Coding]
sharing: true
footer: true
subtitle: So you want to learn C++
author: Loki Astari (C)2016
description: So why is the constant resize factor of the array 1.5 or 2?
---
<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML,https://lokiastari.com/resource/maths/MathJaxLocal.js"></script>

So I never really considered why the resize of vector used a constant expansion of 1.5 or 2 (in some popular implementations). That was until I did my previous article Xseries ["Vector"](<%- config.site %>/blog/2016/02/27/vector/) where I concentrated a lot on resource management and did a section on [resizing the vector](<%- config.site %>/blog/2016/03/12/vector-resize/). Originally in the code I tried to be clever, a mistake. I used a resize value of 1.62 (an approximation of `Phi`), because I vaguely remembered reading an article that this was the optimum resize factor. When I put this out for code review it was pointed out to me that this value was too large, the optimum value must be less than or equal to `Phi` (1.6180339887) and that exceeding this limit actually made things a lot worse.

So I had to know why....

So the theory goes: You have a memory resource of size `B`. If you resize this resource by a constant factor `r` by re-allocating a new block then releasing the old block. Then if the value of `r` is smaller than or equal to `Phi` you will eventually be able to reuse memory that has previously been released; otherwise the new block of memory being allocated will always be larger than the previously released memory.

So I thought lets try that:
Test one `r > Phi`:

    B=10
    r=2.0

                Sum Memory      Memory      Memory Needed       Difference
                 Released     Allocated     Next Iteration
    Start            0            10              20                 20
    Resize 1        10            20              40                 30
    Resize 2        30            40              80                 50
    Resize 3        70            80             160                 90
    Resize 4       150           160             320                170

OK. That seems to be holding (at least in the short term). Lo lets try a smaller value.
Test two `r < Phi`:

    B=10
    r=1.5

                Sum Memory      Memory      Memory Needed       Difference
                 Released     Allocated     Next Iteration
    Start            0            10              15                 15
    Resize 1        10            15              22                 12
    Resize 2        25            22              33                  8
    Resize 3        47            33              48                  1
    Resize 4        80            48              72                 -8 // Reuse released memory next iteration

OK. That also seems to be holding. But can we show that holds for all values of B? Also this is a bit anecdotal can we actually show this relationship actually hold? Time to break out some maths (not math as my American cousins seem to insist on for the shortening of mathematics).


So the size `S` of any block after `n` resize operations will be:

$$ S   = Br^n $$

Thus the size of `Released Memory` can be expressed as:

$$ \sum_{k=0}^{n-1}\ Br^k $$

Also the size of the next block will be:

$$ Br^{n+1} $$

So if the amount of `Released Memory` >= the amount required for the next block, then we can reuse the `Released Memory`.

$$ \sum_{k=0}^{n-1}\ Br^k &gt;= Br^{n+1} $$

$$ B \sum_{k=0}^{n-1}\ r^k &gt;= Br^{n+1} $$

$$ \sum_{k=0}^{n-1}\ r^k &gt;= r^{n+1} $$

$$ {1-r^{(n-1)+1}\over1-r} &gt;= r^{n+1} $$

$$ {1-r^n\over1-r} &gt;= r^{n+1} $$

$$ 1-r^n &gt;= r^{n+1} (1-r) $$

$$ 1-r^n &gt;= r^{n+1} - r^{n+2} $$

$$ 1 + r^{n+2} - r^{n+1} - r^n &gt;= 0 $$

$$ 1 + r^n (r^2 - r - 1) &gt;= 0 $$

This is were my maths broke down and I had to plot some graphs (my old "maths" teacher would have been so proud).<br>


{% img /images/Root4.png 400 200 "n=4"%}
{% img /images/Root8.png 400 200 "n=8"%}
<br><br>

So after looking at the graphs (to understand the formula) then talking to some smart people.
They noticed that:

$$ \sqrt{(r^2 - r - 1)} . when . r = \Phi $$


We find that the first root of the equation is 1. The second root of the equation depends on `n`, as `n` tends to `infinity` the other root tends towards `Phi`. From this we can infer the following:

$$ 1 < r <= \Phi $$

Thus if `r` remains in the above range then the above theory holds.




