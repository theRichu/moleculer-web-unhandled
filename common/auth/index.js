module.exports = {
  hasRole: function (role) {
    return function (req, res, next) {
      req.needRole = role
      next()
    }
  },
  mineOrHasRole: function (role) {
    return function (req, res, next) {
      req.mineOrHasRole = role || ['admin']
      next()
    }
  },
  required: function () {
    return function (req, res, next) {
      req.needAuth = 'required'
      next()
    }
  }
}
