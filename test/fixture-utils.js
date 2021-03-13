const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const glob = require('glob');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const snowpack = require('snowpack');
const assert = require('assert');

exports.testFixture = async function testFixture(
  userConfig,
  testFiles,
  {absolute} = {} /* options */,
) {
  const inDir = await fs.mkdtemp(path.join(__dirname, '__temp__', 'snowpack-fixture-'));

  if (typeof testFiles === 'string') {
    testFiles = {'index.js': testFiles};
  }
  for (const [fileLoc, fileContents] of Object.entries(testFiles)) {
    await fs.writeFile(path.join(inDir, fileLoc), fileContents);
  }

  const config = await snowpack.createConfiguration({
    root: inDir,
    ...userConfig,
  });
  const outDir = config.buildOptions.out;
  await snowpack.build({
    config,
    lockfile: null,
  });

  const result = {};
  assert(path.isAbsolute(outDir));
  const allFiles = glob.sync('**/*', {
    cwd: outDir,
    nodir: true,
    absolute: true,
  });

  for (const fileLoc of allFiles) {
    result[absolute ? fileLoc : path.relative(outDir, fileLoc)] = await fs.readFile(
      fileLoc,
      'utf8',
    );
  }
  // TODO: Make it easier to turn this off when debugging.
  await rimraf.sync(inDir);
  // Return the result.
  return result;
};
