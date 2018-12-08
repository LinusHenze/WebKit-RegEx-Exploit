var ws_log = new WebSocket(`ws://${location.hostname}:5000/ws_log`);

var html_logging_ready = new Promise(function(resolve, reject) {
    var body = document.getElementsByTagName("body")[0];
    window.addEventListener("load", function() {
        resolve();
    }, false);
});

var logging_ready = new Promise(function(resolve, reject) {
    ws_log.onopen = function() {
        ws_log.send("Connection opened!");
        resolve();
    }
    ws_log.onerror = function(err) {
        reject(err);
    };
});

print = function(msg) {
    msg = "" + msg;
    try {
        ws_log.send(msg);
    } catch (e) {}
    msg = msg.replace("Wasm Memory", "Object");
    msg = msg.replace("Wasm Internal Memory", "Internal Object");
    document.body.innerHTML += msg + '<br>';
}

var putcharBuffer = "";
putchar = function (str) {
    if (str[0] == "\n") {
        print(putcharBuffer);
        putcharBuffer = "";
    } else {
        putcharBuffer += str;
    }
}

ready = Promise.all([ready, html_logging_ready, logging_ready]);
