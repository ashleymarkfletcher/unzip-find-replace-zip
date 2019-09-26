const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
//joining path of directory
const directoryPath = path.join(__dirname, 'exports')
//passsing directoryPath and callback function
fs.readdir(directoryPath, function(err, files) {
  //handling error
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }

  //listing all files using forEach
  files.forEach(function(file) {
    // Do whatever you want to do with the file
    // console.log(file)
    const fileDir = path.join(directoryPath, file)

    fs.readdir(fileDir, function(err, files) {
      //handling error
      if (err) {
        return console.log('Unable to scan directory: ' + err)
      }
      //listing all files using forEach
      files.forEach(function(file) {
        // Do whatever you want to do with the file
        // console.log(file)

        if (isZip(file)) {
          const zipPath = path.join(fileDir, file)
          const zipName = file.split('.zip')[0]
          // console.log('iszip: ', file)
          const htmlFile = zipName + '.html'
          const newDirName = zipName

          exec('mkdir ' + newDirName, function() {
            // console.log('made dir: ', newDirName)
            exec('unzip ' + zipPath + ' -d ' + newDirName, function() {
              // console.log('unzipped: ', zipPath)

              const htmlPath = newDirName + '/' + htmlFile
              // console.log(htmlPath)

              fs.readFile(htmlPath, 'utf8', function(err, data) {
                if (err) {
                  return console.log('err reading', err)
                }
                var result = data.replace(/<\/head>/g, '</head><a href="javascript:window.open(window.clickTag)">')
                result = result.replace(/<\/body>/g, '</body></a>')

                fs.writeFile(htmlPath, result, 'utf8', function(err) {
                  if (err) return console.log('err writing', err)
                  // console.log('replaced')

                  exec('cd ' + newDirName + ' && zip -r ../' + zipName + '.zip * -0 -q', function() {})
                  // exec('zip -r ' + zipName + '.zip ' + newDirName, function() {
                  //   console.log('zipped', zipName)
                  // })
                })
              })
            })
          })
        }
      })
    })
  })
})

function isZip(name) {
  return name.slice(-4) == '.zip'
}
