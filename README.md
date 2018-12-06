# PLEASE READ THIS FIRST
This is currently only patched in the WebKit sources and works with the latest version of Safari (macOS and iOS, although this needs to be updated in order to work with iOS).  
Please don't do evil stuff with this.  
And if you're a normal user, this will be useless for you.

# WebKit-RegEx-Exploit
This is an exploit for the latest version of Safari (as of Dec. 6 2018). Fixed in the current WebKit release, therefore I decided to make this public.  
Huge thanks to Samuel Groß (@5aelo) for his awesome Int64 library.  
You need to have a WebSocket Server running at Port 5000 or you get "Initialization failed".

# Building
If you want to rebuild stage2, cd into stage2 then run python make.py.  
For building you need to have gobjcopy installed. (brew install binutils)  

# The Bug
This is an optimization error in the way RegEx matching is handled. By setting lastIndex on a RegEx object to a JavaScript object which has the function toString defined, you can run code although the JIT thinks that RegEx matching is side effect free.  
Exploitation is pretty similar to @5aelo's exploit for CVE-2018-4233, which can be found [here](https://github.com/saelo/cve-2018-4233).  

# TODO
Clean up the code a bit, add some comments and do a proper writeup. Maybe even add iOS support? Feel free to create a PR if you want to help me.
