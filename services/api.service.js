'use strict'

const {
  get,
  isArray,
  pick,
  intersection,
  includes
} = require('lodash')
const ApiGateway = require('moleculer-web')

const {
  UnAuthorizedError,
  ERR_NO_TOKEN,
  ERR_INVALID_TOKEN
} = ApiGateway.Errors

const Promise = require('bluebird')
const auth = require('../common/auth')
module.exports = {
  name: 'api',
  mixins: [ApiGateway],
  settings: {
    port: process.env.PORT || 3000,
    routes: [
      {
        path: '/',
        authorization: true,
        aliases: {
          // Login
          'POST /auth/login': 'users.login',
          'GET /user/me': [auth.required(), 'users.me']
        },
        // Disable to call not-mapped actions
        mappingPolicy: 'restrict',
        // Set CORS headers
        cors: true,
        // Parse body content
        bodyParsers: {
          json: {
            strict: false
          },
          urlencoded: {
            extended: true
          }
        }
      }
    ],

    assets: {
      folder: './public'
    },

    // logRequestParams: "info",
    // logResponseData: "info",

    onError (req, res, err) {
      // Return with the error as JSON object
      res.setHeader('Content-type', 'application/json; charset=utf-8')
      res.writeHead(err.code || 500)

      if (err.code === 422) {
        let o = {}
        err.data.forEach(e => {
          let field = e.field.split('.').pop()
          o[field] = e.message
        })

        res.end(JSON.stringify({
          errors: o
        }, null, 2))
      } else {
        const errObj = pick(err, ['name', 'message', 'code', 'type', 'data'])
        res.end(JSON.stringify(errObj, null, 2))
      }
      this.logResponse(req, res, err ? err.ctx : null)
    }
  },

  methods: {
    /**
     * Authorize the request
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    authorize (ctx, route, req, res) {
      if (req.needAuth !== 'required') {
        return ctx
      }
      let token
      if (req.headers.authorization) {
        let type = req.headers.authorization.split(' ')[0]
        if (type === 'Token') {
          token = req.headers.authorization.split(' ')[1]
        }
      }
      if (req.needAuth === 'required' && !token) {
        return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN))
      }
      // Verify JWT token
      return ctx.call('users.resolveToken', {
        token
      })
        .then(user => {
          if (req.needAuth === 'required' && !user) {
            return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN))
          }
          // this.logger.info('Authenticated via JWT: ', user)
          // Reduce user fields (it will be transferred to other nodes)
          ctx.meta.user = pick(user, ['id', 'username', 'email', 'roles'])
          ctx.meta.token = token
          if (req.mineOrHasRole) {
            ctx.meta.mineOrHasRole = req.mineOrHasRole
          }
          if (req.needRole) {
            if (isArray(req.needRole)) {
              if (!intersection(get(ctx, 'meta.user.roles', []), req.needRole)) {
                return Promise.reject(new UnAuthorizedError())
              }
            } else {
              if (!includes(get(ctx, 'meta.user.roles', []), req.needRole)) {
                return Promise.reject(new UnAuthorizedError())
              }
            }
          }
          return ctx
        })
    }
  }
}
