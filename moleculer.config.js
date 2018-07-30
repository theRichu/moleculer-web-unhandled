'use strict'

const os = require('os')
const CONFIG = require('./common/config')

module.exports = {
  // It will be unique when scale up instances in Docker or on local computer
  nodeID: os.hostname().toLowerCase() + '-' + process.pid,

  logger: true,
  logLevel: 'info',

  transporter: CONFIG.transporter,

  cacher: 'memory',

  metrics: true
}
