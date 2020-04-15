# Introduction and acknowledgements

This extension allows you to input a list of invitees to a Google Meet and then updates the list to indicate who actually attended.  It is intended the help teachers, like myself, who are rapidy transitioning to the new reality of online classes.  It was initially inspired by Chris Gamble's Userscript (https://greasyfork.org/en/scripts/397862-google-meet-grid-view) and the related extension (which lacks the ability to record attendance).  Originally, my attendance functionality was integrated right into Chris' userscript but subsequently, I have re-written it as an entirely separate extension.

This extension does not require extra permissions other than access to meet.google.com. The list of invitees is retained in a LocalStorage variable but none of that information is transmitted or shared elsewhere by the extension.  All of the source code can be viewed at this [public repository](https://github.com/al-caughey/Google-Meet-Attendance).

Send kudos and constructive feedback to <a href='mailto:allan.caughey@ocdsb.ca?subject=Google Meet Attendance Feedback'>allan.caughey@ocdsb.ca</a>.  I will do my best to reply to feature requests or support issues but please understand that my students (and home-life) come first.  

# Google Meet Attendance is now an full-fledged Chrome extension!

Go to https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd/publish-accepted?authuser=0&hl=en
And then click `Add to Chrome`

You are now setup!  To see the extension in action, 
Launch a Google Meet (https://meet.google.com)

On meeting join page, you will see `Class List` field - by default, it will appear on the left side on the screen, but you can drag it to whereever you want.  

You can paste, or type, the list of expected `invitees` for your Meet into the field. Enter each name on a separate line. How you enter the names is likely system dependent... in my case, my students appear as "<FIRST> <LAST>". 

So it does not obstruct the screen during your Meet, the `Class List` will `hide` when it loses focus (i.e., it will be come faintly visible when you tab or click outside the field).  If you hover over the field or click within it, it will pop-up to full size again.
   
As participants join the meeting, the extension will automatically update the list - prepending a checkmark to names already in the list and appending names of `uninvited` participants at the bottom.

The contents of the `Class List` field is saved to a LocalStorage variable so it is remembered if you reload the page and (in theory) should be saved if you close Chrome.  I say in theory because my school board automatically flushes LocalStorage variables when you leave Chrome.

There are a few `buttons` above the list of names:
   Click [-] to clear all checks from the list of names (i.e., revert to just the list of names)
   Click [x] to erase all of the names in the field
   Click [x] to manually check the attendance (but in reality, it should not be ne

# Cloning / building

NB - I am not a github expert (in fact nowhere near close to that!)... so you might need to go elsewhere if you need help with cloning and building your own variant of this script.
This repo uses submodules to keep pulling the latest userscript... so you'll want to do `git clone --recursive` if you're installing the script locally.

[stolen verbatim from Ryan Meyers repo] To build the script yourself, just clone the repo, go to the directory and use `zip -r packed.zip src` that will generate the zip file you need to upload to the Chrome Web Store (I think it costs like $5 one time to become a developer on there). Oh, and be sure to adjust the variables in `manifest.json` to reflect your own information.

