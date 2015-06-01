var args = process.argv.slice(2)
var argv = require('minimist')(args, {
  boolean: ['devtool'],
  default: { devtool: true }
})

var app = require('app')
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('v', 0)
app.commandLine.appendSwitch('vmodule', 'console=0')

var BrowserWindow = require('browser-window')
var createHihat = require('./lib/hihat')

// Report crashes to atom server.
require('crash-reporter').start()

var mainWindow = null
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin')
    app.quit()
})

app.on('ready', function () {
  var basePort = argv.port || 9966
  require('getport')(basePort, function (err, port) {
    if (err) {
      console.error('Could not get available port')
      process.exit(1)
    }

    start({
      port: port,
      dir: argv.dir || process.cwd()
    })
  })  
})

function start(opt) {
  var hihat = createHihat(args, opt)
    .on('connect', function(ev) {
      var frame = argv.frame 
        ? { width: 640, height: 320 }
        : { width: 0, height: 0, x: 0, y: 0 }
      // a hidden browser window
      mainWindow = new BrowserWindow(frame)

      mainWindow.webContents.once('did-start-loading', function() {
        if (String(argv.devtool) !== 'false') {
          mainWindow.openDevTools({ detach: true })
        }
      })

      mainWindow.show()
      mainWindow.loadUrl(ev.uri)

      mainWindow.once('closed', function () {
        mainWindow = null
        hihat.close()
      })
    }).on('update', function() {
      if (mainWindow)
        mainWindow.reload()
    })
}
