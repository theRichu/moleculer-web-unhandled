const {
  MoleculerError
  // MoleculerClientError
} = require('moleculer').Errors
const {
  UnAuthorizedError,
  ForbiddenError,
  InvalidRequestBodyError,
  BadRequestError
} = require('moleculer-web').Errors
const ERR_SERVER = 'ERR_SERVER'
const ERR_REQUIRED = 'ERR_REQUIRED'
const ERR_NOT_FOUND = 'ERR_NOT_FOUND'
const ERR_VALIDATE = 'ERR_VALIDATE'
const ERR_AMBIGIOUS = 'ERR_AMBIGIOUS'
const ERR_DUPLICATE = 'ERR_DUPLICATE'

class ServerError extends MoleculerError {
  /**
   * Creates an instance of InvalidResponseTypeError.
   *
   * @param {String} dataType
   *
   * @memberOf InvalidResponseTypeError
   */
  constructor (type, data) {
    super(data.message || `Server Error`, 500, type || ERR_SERVER, data)
  }
}

module.exports = {
  ServerError,
  UnAuthorizedError,
  ForbiddenError,
  InvalidRequestBodyError,
  BadRequestError,
  ERR_SERVER,
  ERR_REQUIRED,
  ERR_VALIDATE,
  ERR_NOT_FOUND,
  ERR_DUPLICATE,
  ERR_AMBIGIOUS
}
