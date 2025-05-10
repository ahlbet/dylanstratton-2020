---
title: A Very Nasty Bug
date: '2020-02-08'
description: That relatable feeling when everything works and still manages to find a way to break.
---

I was tasked with fixing a very nasty bug at work a few days ago. It was a true stumper at first glance. A real _throw-your-hands-in-the-air-with-frustration_ bug. A real _go-down-an-endless-spiral-of-stack-overflow-and-github-issue-threads_ bug. A real buggy bug.

The bug, in a broad explanation, had to do with the video chat feature of the app crashing on _Android_ phones when the other user hung up first. So, in my approach to fixing the bug, I knew a few things:

1. The video chat was working as expected on iOS devices. No crashes, no errors. This was specifically an Android issue (or was it?).
2. The crash _only_ occurred when the other user ended the call. As far as we could tell, if I, on an Android phone, hung up first, the app wouldn't crash and I'd be taken to the next appropriate screen.
3. I didn't have much help from any errors being logged in Android Studio. There wasn't anything clear being logged at the time of the crash so I couldn't use that as a jumping off point.

The biggest error I made in trying to fix this bug happened right here, this exact moment, right at the point of liftoff. And it's this moment that I'm focusing on for this post.

At that time, I was completely occupied with this being an Android specific bug. Based on what we had seen, iOS was working well. The conclusion I mistakenly made was that I could forget about our React Native code being the source of the bug. I thought "if it's working fine on iOS and React Native handles both iOS and Android, then the issue must be something deep within the third-party library we're using".

And I couldn't get myself away from this line of thinking. The real problem is that I had literally seen our code work _flawlessly_. No crashes, no errors. It gets incredibly difficult to question "working" code when you've seen it perform perfectly. But, questioning that code is the exact thing I should've done.

Instead, I went down a Stack Overflow rabbit hole. _Android SDK_ this. _Version number_ that. _Downgrade your_ this and _upgrade your_ that. Scrolling scrolling scrolling down open source library issue threads scrolling scrolling scrolling.

I was lost.

My version numbers were good. I was upgraded completely, using the latest releases. I tripled checked the Android installation instructions for the third-party library. Still, the app would crash.

Then, my boss came over to me. He asked me:

> Do you know the _exact_ line of code where the app crashes?

Holy smokes. No. No I didn't. I hadn't checked that because I had already decided that our code was fine. But, the app was still crashing during some line of code that _we_ had written. And finding that line didn't mean that I would necessarily find the _source_ of the crash. But it would at least give me some place to start that didn't mean wandering through old issue threads.

So, I found the exact line where it crashed. I logged before and after every line in the block of code that I suspected was the problem area. And I found the line where nothing was logged after it. I felt this door in my mind open up. _Of course this is breaking when the other user hangs up first_. I had been running some logic to end the call in the VideoCaller component when User 1 hangs up. I was not running the same logic if User 2 hangs up. And that logic _needed_ to happen before we unmounted our component and navigated to the next screen.

But why was it still working on iOS devices? I am still not 100% sure. My guess is the end call logic was running just in time on faster devices and Android wasn't handling it before the component unmounted.

I simply added the end call logic to the case where User 2 hangs up first and it fixed it. No crashes, no errors. I was amazed.

I had spent such a long time looking in the wrong places. I had started looking for solutions before I _really_ knew what the problem was.

Find the _exact_ line where your app breaks. And begin.
