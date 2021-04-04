#!/usr/bin/env node

const {spawn} = require('child_process');
// const devServerConfig = require('../script/start')

process.exitCode = 0;

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const executedCommand = spawn(command, args, {
      stdio: "inherit",
      shell: true
    });

    executedCommand.on("error", error => {
      reject(error);
    });

    executedCommand.on("exit", code => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const args = process.argv.slice(2);
const script = args[0];

switch (script) {
  case 'start':
    runCommand('webpack-dev-server', ['--config', require.resolve(`../scripts/${script}`)])
      .then(() => {
        console.log('执行成功');
      }).catch(err => {
      console.log(err);
      process.exitCode = 1;
    })
    break;
  case 'build':
    const scriptPath = require.resolve(`../scripts/${script}`);
    runCommand('node', [scriptPath])
      .then(() => {
        console.log('执行成功');
      }).catch(err => {
      console.log(err);
      process.exitCode = 1;
    })
    break;
  default: {
    console.log(`参数错误:${script}`);
  }
}