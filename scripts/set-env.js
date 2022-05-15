#!/bin/node
const fs = require("fs")
const path = require("path")

// Get the environment string passed to the node script
const environment = process.argv[2]
const envFile = path.join(__dirname, `./configs/env.${environment}.js`)
if (!fs.existsSync(envFile)) {
  console.warn(`Cannot find the env file for ${environment}`)
  exit
}

const appDevEnvFile = path.join(__dirname, `../src/config/env.js`)

try {
  fs.copyFileSync(envFile, appDevEnvFile)
} catch (e) {
  console.warn(`Cannot create the evn.dev.js.`, e)
}
