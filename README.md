# [Google Meet Attendance](https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd) is now a Chrome extension!  
https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd
# And also a firefox extension:
https://addons.mozilla.org/en-US/firefox/addon/google-meet-attendance/

# Introduction and acknowledgements

This extension is intended to help teachers, like myself, who are rapidly transitioning to the new reality of online classes and need a simple(r) way to record who joined a Google Meet session.

It was initially inspired by [Chris Gamble's Userscript](https://greasyfork.org/en/scripts/397862-google-meet-grid-view) and the related extension.  Originally, I incorporated my attendance functionality right into Chris' userscript but subsequently, decided to re-write it as an entirely separate extension.

The extension does not require extra permissions other than access to meet.google.com. The list of invitees is retained in a LocalStorage variable but none of that information is transmitted or shared elsewhere by the extension.  All of the source code can be viewed at this [public repository](https://github.com/al-caughey/Google-Meet-Attendance).

As per the [license](https://github.com/al-caughey/Google-Meet-Attendance/blob/master/LICENSE.md), it is free to use but you can sponsor future development by clicking the [Sponsor button above] (https://paypal.me/AlCaughey).

# To see the extension in action
First, install it by going to [Google Meet Attendance](https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd) at the Chrome web store and clicking `Add to Chrome` or by going to [Google Meet Attendance](https://addons.mozilla.org/en-US/firefox/addon/google-meet-attendance/) the Firefox Add-ons site and clicking `Add to Firefox` 

Then launch a [Google Meet](https://meet.google.com)

On meeting join page, you will see `Class List` field - by default, it appears on the left side, but you can drag it whereever you want on the screen.  

You can paste, or type, the list of expected *invitees* for your Meet into the field - each name entered onto a separate line. How you enter the names is likely system dependent... in my case, my students appear as "FIRST LAST" (yes, all uppercase... they're shouting as they enter!)

So it does not obstruct the screen during your Meet, the `Class List` will hide when it loses focus (i.e., it will be come faintly visible when you tab or click outside the field).  If you hover over the field or click within it, it will pop-up to full size again.
   
As participants join the meeting, the extension will automatically update the list - prepending a checkmark to names already in the list and appending names of '*uninvited*' participants at the bottom.

The contents of the `Class List` field is saved to a LocalStorage variable so it is remembered if you reload the page and (in theory) should be saved if you close Chrome and then later return.  I say in theory because my school board automatically flushes my LocalStorage variables when I shutdown the browser (so I cannot actually test this feature).

There are a few buttons above the `Class List` field:
* Click [-] to clear all checks from the list of names (i.e., revert to just the list of names)
* Click [x] to erase all of the names in the field
* Click [x] to manually check the attendance (but in reality, this should not be necesary because the extention should be doing  this automatically)
   
# Feedback
Please enter issues and constructive feedback on the [issues page](https://github.com/al-caughey/Google-Meet-Attendance/issues). I will do my best to reply to feature requests or support issues as quickly as possible but please understand that my students (and home-life) come first.  Kudos would be nice too!

I hope that you find this to be useful
