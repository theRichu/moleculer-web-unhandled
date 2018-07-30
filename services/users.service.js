'use strict'

const {
  MoleculerClientError
} = require('moleculer').Errors

const jwt = require('jsonwebtoken')
const {
  find
} = require('lodash')
const Util = require('../common/util')
const CONFIG = require('../common/config')

const bcrypt = require('bcrypt')

// const DbService = require('../mixins/db.mixin')
function hashPassword (password) {
  return bcrypt.hash(password, 10)
}

let pw
hashPassword('password').then(hashedPw => {
  pw = hashedPw
  return pw
})

let Users = [{
  id: 1,
  username: 'user',
  email: 'user@email.com',
  password: pw
}]
module.exports = {
  name: 'users',
  /**
   * Default settings
   */
  settings: {
    /** Secret for JWT */
    JWT_SECRET: process.env.JWT_SECRET || CONFIG.JWT_SECRET,
    authorField: 'id',
    auth: 'required'
  },
  /**
   * Actions
   */
  actions: {
    /**
     * Login with username & password
     *
     * @actions
     * @param {Object} user - User credentials
     *
     * @returns {Object} Logged in user with token
     */
    login: {
      params: {
        identifier: {
          type: 'string'
        },
        password: {
          type: 'string'
          // min: 1
        }
      },
      handler (ctx) {
        const {
          identifier,
          password
        } = ctx.params

        const EMAIL_REGEX = Util.regex.EMAIL
        const isEmail = EMAIL_REGEX.test(identifier)

        let query = {
          where: {}
        }
        if (isEmail) {
          query.where.email = identifier
        } else {
          query.where.username = identifier
        }
        return new this.Promise((resolve, reject) => {
          const user = find(Users, {
            username: identifier
          })

          if (!user) {
            return reject(new MoleculerClientError('Identifier or password is invalid!', 422, '', [{
              field: 'identifier',
              message: 'is not found'
            }]))
          }

          bcrypt.compare(password, user.password).then((success) => {
            if (!success) {
              return reject(new MoleculerClientError('Wrong password!', 422, '', [{
                field: 'email',
                message: 'is not found'
              }]))
            } else {
              var ret = user.dataValues
              ret.accessToken = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
                scope: ['*'],
                user: user.id
              }, this.settings.JWT_SECRET)
              resolve(ret)
            }
          })
        })
      }
    },

    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @actions
     * @param {String} token - JWT token
     *
     * @returns {Object} Resolved user
     */
    resolveToken: {
      cache: {
        keys: ['token'],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: 'string'
      },
      handler (ctx) {
        return new this.Promise((resolve, reject) => {
          jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
            if (err) {
              return reject(err)
            }
            resolve(decoded)
          })
        }).then(decoded => {
          if (decoded) {
            const user = find(Users, {id: decoded.user})
            return user
          } else {
            return null
          }
        })
      }
    },

    /**
     * Get current user entity.
     * Auth is required!
     *
     * @actions
     *
     * @returns {Object} User entity
     */
    me: {
      auth: 'required',
      cache: {
        keys: ['#token']
      },
      handler (ctx) {
        return ctx.meta.user
      }
    }
  },

  /**
   * Methods
   */
  methods: {

  },

  events: {
    'cache.clean.users' () {
      if (this.broker.cacher) {
        this.broker.cacher.clean(`${this.name}.*`)
      }
    }
  }
}
