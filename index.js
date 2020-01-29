//data/unifi/recordings/1d9e00cb-d453-30af-955f-aac324f348e8/2020/01/26/meta/5e2e0cb83788752a551b6e48.json

/*
{
  "eventType":"motionRecording",
  "startTime":1580077640477,
  "endTime":1580077652446,
  "cameras":["5e274a7b0882496db065436f"],
  "locked":false,
  "inProgress":false,
  "markedForDeletion":false,
  "meta":
  {
    "cameraName":"UVC G3 Micro",
    "key":"CFkThmxR",
    "recordingPathId":"5e275013ebef56d84a91363a"
  },
  "_id":"5e2e12493788752a551b6e7b"
}
*/

const Path = require('path');
const { createLogger, format, transports } = require('winston');
const chokidar = require('chokidar');
const fs = require("fs");
const mqtt = require("mqtt");
const config = require('./config.js').parse();

// Initate the logger
const logger = createLogger({
    level: config.loglevel,
    format: format.combine(
        format.colorize(),
        format.splat(),
        format.simple(),
    ),
    transports: [new transports.Console()]
});


// Establish the MQTT client
const mqttClient = mqtt.connect(config.mqtt.url, config.mqtt.options);
mqttClient.on('connect', function () {
    logger.info('MQTT connected');
});

// Start watching the recordings folder
const watcher = chokidar.watch(config.unifivideo.recordings, {
    // ignore all but json files
    ignored: /^.*\.(?!json$)[^.]+$/,
    persistent: true
});

// First watch only error or ready events
watcher
    .on('error', error => logger.error("Watcher error: %s", error))
    .on('ready', () => {
        logger.info("Initial scan complete. Ready for changes");
        proceed();
    });
//.on('addDir', path => log(`Directory ${path} has been added`))
//.on('unlinkDir', path => log(`Directory ${path} has been removed`))
//.on('raw', (event, path, details) => { // internal
//  log('Raw event info:', event, path, details);
//});



// Add event listeners.
//watcher
//.on('add', path => handleNewFile(path))
//.on('change', path => log(`File ${path} has been changed`))
//.on('unlink', path => log(`File ${path} has been removed`));


// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: https://nodejs.org/api/fs.html#fs_class_fs_stats
//watcher.on('change', (path, stats) => {
//  if (stats) console.log(`File ${path} changed size to ${stats.size}`);
//});


// Called when the initial scan is done.
// Add a watcher for the file 'add' event
const proceed = function () {
    watcher.on('add', path => handleNewFile(path));
}

// Called by the watcher when a new file is created
const handleNewFile = function (path) {
    logger.info("File %s has been added", path);
    if (path.endsWith(".json")) {
        let content = fs.readFileSync(path);
        let jsonContent = JSON.parse(content);
        console.log(JSON.stringify(jsonContent));
        copySnapshot(path, (snapshot) => {
            jsonContent.snapshot = snapshot;
            mqttClient.publish(config.mqtt.topicPrefix + "/detection", JSON.stringify(jsonContent), { 'retain': false });
        });
    }
}

// path contains the full json file path
const copySnapshot = function (path, callback) {
    // the jpg file base name
    let snapshot = Path.basename(path, ".json") + "_full.jpg";
    // source path
    let sourcepath = Path.join(Path.dirname(path), snapshot);
    // target path
    let targetpath = Path.join("/data/unifi/telegram", snapshot);
    // copy the file
    fs.copyFile(sourcepath, targetpath, () => {
        fs.chown(targetpath, 1000, 1000, () => {
            callback(targetpath);
        });
    });
}
