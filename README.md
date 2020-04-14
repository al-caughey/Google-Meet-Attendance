# Introduction and acknowledgements

This extension allows you to input a list of invitees to a Google Meet and then updates the list to indicate who actually attended.  It is intended the help teachers, like myself, who are rapidy transitioning to the new reality of online classes.  It was initially inspired by Chris Gamble's Userscript (https://greasyfork.org/en/scripts/397862-google-meet-grid-view) and the related extension (which lacks the ability to record attendance).  Originally, my attendance functionality was integrated right into Chris' userscript but subsequently, I have re-written it as an entirely separate extension.

This extension does not require extra permissions other than access to meet.google.com. The list of invitees is retained in a LocalStorage variable but none of that information is transmitted or shared elsewhere by the extension.  All of the source code can be viewed at [public repository](https://github.com/al-caughey/Google-Meet-Attendance).

Send kudos and constructive feedback to allan.caughey@ocdsb.ca.  I will do my best to reply to feature requests or support issues but please understand that my students (and home-life) come first.  

# Cloning / building

NB - I am not a github expert (in fact nowhere near close to that!)... so you might need to go elsewhere if you need help with cloning and building your own variant of this script.
This repo uses submodules to keep pulling the latest userscript... so you'll want to do `git clone --recursive` if you're installing the script locally.

[stolen verbatim from Ryan Meyers repo] To build the script yourself, just clone the repo, go to the directory and use `zip -r packed.zip src` that will generate the zip file you need to upload to the Chrome Web Store (I think it costs like $5 one time to become a developer on there). Oh, and be sure to adjust the variables in `manifest.json` to reflect your own information.

