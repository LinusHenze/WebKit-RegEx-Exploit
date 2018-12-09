# PLEASE READ THIS FIRST
This is currently only patched in the WebKit master branch (not in any version shipped in macOS/iOS) and works with the latest version of Safari (macOS and iOS, although shellcode loading is not supported on iOS).  
YES, iOS 12.1.1 IS SUPPORTED!  
Please don't do evil stuff with this.  
And if you're a normal user, this will be useless for you.

# WebKit-RegEx-Exploit
This is an exploit for the latest version of Safari (as of Dec. 6 2018). Fixed in the current WebKit release, therefore I decided to make this public.  
Huge thanks to Samuel Groß (@5aelo) for his awesome Int64 library.  
You need to have a WebSocket Server running at Port 5000 or you get "Initialization failed".

# Supported iOS/macOS Versions
This exploit supports iOS 12.0 up to (and including!) iOS 12.1.1 as well as macOS 10.14.0 up to (and including!) macOS 10.14.2.  
The latest version of Safari Technology Preview (for macOS) is not vulnerable as it contains a recent version of WebKit.  
Please note that shellcode loading is currently not supported on iOS. (The exploit will run but later show "iOS is not supported yet!". This just means that shellcode loading is not supported on iOS, not that the exploit doesn't work on iOS)  
In case you get "Addrof didn't work", just try the exploit again. If it still won't work after a couple of tries, it might be that Apple finally patched the vulnerability.

# Building
If you want to rebuild stage2, cd into stage2 then run python make.py.  
For building you need to have gobjcopy installed. (brew install binutils)  

# The Bug
This is an optimization error in the way RegEx matching is handled. By setting lastIndex on a RegEx object to a JavaScript object which has the function toString defined, you can run code although the JIT thinks that RegEx matching is side effect free.  
Exploitation is pretty similar to @5aelo's exploit for CVE-2018-4233, which can be found [here](https://github.com/saelo/cve-2018-4233).  

# TODO
Clean up the code a bit, add some comments and do a proper writeup. Maybe even add iOS support? Feel free to create a PR if you want to help me.
