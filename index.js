//data/unifi/recordings/1d9e00cb-d453-30af-955f-aac324f348e8/2020/01/26/meta/5e2e0cb83788752a551b6e48.json

// {"eventType":"motionRecording","startTime":1580077640477,"endTime":1580077652446,"cameras":["5e274a7b0882496db065436f"],"locked":false,"inProgress":false,"markedForDeletion":false,"meta":{"cameraName":"UVC G3 Micro","key":"CFkThmxR","recordingPathId":"5e275013ebef56d84a91363a"},"_id":"5e2e12493788752a551b6e7b"}

const chokidar = require('chokidar');
const fs = require("fs");
 
const path = "/data/unifi/recordings";

const watcher = chokidar.watch(path, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

// Something to use when events are received.
const log = console.log.bind(console);
// Add event listeners.
watcher
  //.on('add', path => handleNewFile(path))
  .on('change', path => log(`File ${path} has been changed`))
  .on('unlink', path => log(`File ${path} has been removed`));
 
// More possible events.
watcher
  .on('addDir', path => log(`Directory ${path} has been added`))
  .on('unlinkDir', path => log(`Directory ${path} has been removed`))
  .on('error', error => log(`Watcher error: ${error}`))
  .on('ready', () => {log('Initial scan complete. Ready for changes'); proceed(); })
  //.on('raw', (event, path, details) => { // internal
  //  log('Raw event info:', event, path, details);
  //});
 
// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: https://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', (path, stats) => {
  if (stats) console.log(`File ${path} changed size to ${stats.size}`);
});


const proceed = function() {

	watcher.on('add', path => handleNewFile(path));
}

const handleNewFile = function(path) {
    log(`File ${path} has been added`);
    if (path.endsWith(".json")) {
	var content = fs.readFileSync(path);
	var jsonContent = JSON.parse(content);
	console.log(JSON.stringify(jsonContent));	
    }
}
