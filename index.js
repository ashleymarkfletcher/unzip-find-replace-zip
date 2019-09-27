const path = require('path')
const fs = require('fs').promises
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const initDirectory = process.argv[2] || 'exports'
const directoryPath = path.join(__dirname, initDirectory)

// TODO: make this an optional arg
const toFind = [
  { find: /<\/head>/g, replace: '</head><a href="javascript:window.open(window.clickTag)">' },
  { find: /<\/body>/g, replace: '</body></a>' }
]

async function run() {
  try {
    console.log('starting :)')
    const flatFiles = await walkFind(directoryPath)

    const zips = flatFiles.filter(({ file }) => isZip(file))

    const newZips = await Promise.all(zips.map(unzipEditZip))
    console.log('done ;)')
  } catch (error) {
    console.log('error: ', error)
  }
}
run()

async function walkFind(dir) {
  let results = []
  const contents = await fs.readdir(dir)

  for (const content of contents) {
    const contentPath = path.join(dir, content)
    const stats = await fs.stat(contentPath)

    if (stats.isFile()) {
      results.push({ file: content, path: contentPath, parent: dir })
    } else if (stats.isDirectory()) {
      const nextLayerFiles = await walkFind(contentPath)
      results = [...results, ...nextLayerFiles]
    }
  }

  return results
}

async function unzipEditZip({ path, file }) {
  const newDirName = file.split('.zip')[0]

  await fs.mkdir(newDirName)
  await exec(`unzip ${path} -d ${newDirName}`)

  // TODO: add some sort of search for the type of file to update
  const htmlFile = newDirName + '.html'
  const htmlPath = newDirName + '/' + htmlFile

  const html = await fs.readFile(htmlPath, 'utf8')

  let result

  // make all the replacements one at a time
  toFind.forEach(({ find, replace }) => {
    result = result ? result.replace(find, replace) : html.replace(find, replace)
  })

  await fs.writeFile(htmlPath, result, 'utf8')

  await exec(`cd ${newDirName} && zip -r ../${newDirName}.zip * -0 -q`)

  // TODO: remove folders after? Maybe optional as a flag
}

function isZip(name) {
  return name.slice(-4) == '.zip'
}
