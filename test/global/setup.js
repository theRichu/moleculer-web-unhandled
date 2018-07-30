const {
  ServiceBroker
} = require('moleculer')
const CONFIG = require('../../common/config')
const ApiService = require('../../services/api.service')
const UsersService = require('../../services/users.service')

let broker = new ServiceBroker({
  nodeID: 'globalNode',
  // logger: true,
  // logLevel: 'debug',
  transporter: CONFIG.transporter,
  cacher: 'memory',
  metrics: true
})

module.exports = function () {
  process.BROKER = broker
  broker.createService(UsersService)
  broker.createService(ApiService)
  return broker.start()
}
