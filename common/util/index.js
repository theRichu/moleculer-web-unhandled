/**
 * Resource Logic
 */
function logAllProperties (obj) {
  if (obj == null) return // recursive approach
  console.log(Object.getOwnPropertyNames(obj))
  logAllProperties(Object.getPrototypeOf(obj))
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function cleanObject (obj) {
  const {
    pickBy
  } = require('lodash')
  return pickBy(obj, v => v !== undefined)
}

function createOrAddArray (obj, key, data) {
  if (!obj[key]) {
    obj[key] = [data]
  } else {
    obj[key].push(data)
  }
}

function plainObject (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function dateToPostgresTimestampWithTimezone (jsdate) {
// Multiply by 1000 because JS works in milliseconds instead of the UNIX seconds
  if (!jsdate) {
    return null
  }
  var date = new Date(jsdate)

  var year = date.getFullYear()
  var month = date.getMonth() + 1 // getMonth() is zero-indexed, so we'll increment to get the correct month number
  var day = date.getDate()
  var hours = date.getHours()
  var minutes = date.getMinutes()
  var seconds = date.getSeconds()
  var timezone = -date.getTimezoneOffset() / 60
  month = (month < 10) ? '0' + month : month
  day = (day < 10) ? '0' + day : day
  hours = (hours < 10) ? '0' + hours : hours
  minutes = (minutes < 10) ? '0' + minutes : minutes
  seconds = (seconds < 10) ? '0' + seconds : seconds
  var tz = (timezone > 0)
  if (timezone > 0) {
    tz = '+'
  } else {
    tz = '-'
  }
  if (Math.abs(timezone) < 10) {
    tz += '0'
  }
  tz += Math.abs(timezone)

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tz}`
}
/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference (object, base) {
  const {
    transform,
    isEqual,
    isObject
  } = require('lodash')
  return transform(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] = isObject(value) && isObject(base[key]) ? difference(value, base[key]) : value
    }
  })
}
module.exports = {
  regex: require('./regex'),
  logAllProperties: logAllProperties,
  capitalizeFirstLetter: capitalizeFirstLetter,
  cleanObject: cleanObject,
  createOrAddArray: createOrAddArray,
  plainObject: plainObject,
  differenceObject: difference,
  dateToPostgresTimestampWithTimezone: dateToPostgresTimestampWithTimezone
  // blacklist: require('./blueprint/blacklist')
}
