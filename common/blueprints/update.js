const {
  cleanObject,
  plainObject,
  differenceObject
} = require('../util')

const Promise = require('bluebird')
const pluralize = require('pluralize')

const {
  filter,
  isObject,
  compact,
  difference,
  union,
  map,
  keys,
  assign,
  find,
  intersection,
  mapValues,
  pickBy,
  uniq,
  isEmpty,
  omit,
  includes,
  // flatten,
  // includes,
  get
} = require('lodash')
const DB = require('../../db/operation/models')

module.exports = function (Model, pk, input, t) {
  const ModelPK = Model.primaryKeyField

  // _.mapValues(_.pickBy(DB.operation.attributes, (value) => { return value.references } ), (value, key) => {return _.get(value,'references.model.table')})
  //  => 여기에 있는건 BelongsTo
  const form = cleanObject(input)
  const belongTo = mapValues(pickBy(Model.attributes, (value) => {
    return value.references
  }), (value, key) => {
    return pluralize.singular(get(value, 'references.model.table'))
  })
  const hm = mapValues(pickBy(Model.associations, (association) => {
    return association.associationType === 'HasMany'
  }), (value, key) => {
    return form[key]
  })

  const alteredAssociatedKeys = intersection(keys(belongTo), keys(form))
  const includeBelongToKeys = uniq(map(alteredAssociatedKeys, (k) => {
    return belongTo[k]
  }))
  const HasMany = pickBy(hm, (value) => {
    return !isEmpty(value)
  })
  const includeHasManyKeys = keys(HasMany)

  // console.log('BelongTo', belongTo)
  // console.log(Model.associations)

  const includeKeys = union(includeBelongToKeys, includeHasManyKeys)
  // console.log('includeKeys', includeKeys)
  // console.log('includeBelongToKeys', includeBelongToKeys)
  // console.log('includeHasManyKeys', includeHasManyKeys)

  // 여기서 순수하게 업데이트만 날릴수 있는거 찾아보자
  const updateDataWithoutAssociations = omit(form, includeKeys)
  // 여기서, belongTo중 id로 된것만 찾아보자
  const updateDataBelongToPks = pickBy(form, (value, key) => {
    if (includes(keys(belongTo), key) && !isObject(value)) {
      return true
    }
  })
  const updateDataBelongToObjects = pickBy(form, (value, key) => {
    if (includes(keys(belongTo), key) && isObject(value)) {
      return true
    }
  })

  const query = {
    where: {
      [ModelPK]: pk
    },
    include: map(includeKeys, (k) => {
      return Model.associations[k]
    })
  }

  return Model.find(query, {
    transaction: t,
    lock: (t) ? t.LOCK.UPDATE : undefined
  })
    .then(record => {
      assign(record, updateDataWithoutAssociations)
      // Null같은것도 처리가 되겠지
      assign(record, updateDataBelongToPks)
      return record.save({
        transaction: t
      })
    })
    .then(record => {
      // BelongTo 처리 (Object 인 것들만..)
      if (isEmpty(updateDataBelongToObjects)) {
        return record
      }
      return Promise.map(updateDataBelongToObjects, (value, AKey) => {
        const AModel = Model.associations[AKey]
        const AModelPKField = AModel.primaryKeyField
        const AModelPK = value[AModelPKField]
        if (AModelPK) {
          return AModel.update(value, {
            where: {
              [AModelPKField]: AModelPK
            },
            transaction: t
          }).then((updatedARecord) => {
            record[AKey] = AModelPK
          })
        } else {
          return AModel.create(value, {
            transaction: t
          }).then((createdARecord) => {
            record[AKey] = createdARecord[AModelPKField]
          })
        }
      }).then(() => {
        return record.save({
          transaction: t
        })
      })
    })
    .then(record => {
      // HasMany 처리
      // 추가된것 : pk가 없는것

      // 수정된것 : pk가 있으면서, 기존 데이터와 다른것

      // 삭제된것 : 기존에는 존재하지만, 새로 들어온 데이터에 존재하지 않는 PK ()

      let hasManyJobs = []
      if (isEmpty(HasMany)) {
        return record
      }
      map(HasMany, (values, AKey) => {
        const AModel = Model.associations[AKey]
        const ModelA = DB[pluralize.singular(AKey)]
        const AModelPKField = AModel.sourceKeyField
        const AModelFKField = AModel.foreignKeyField
        // console.log('AModelPKField', AModelPKField, 'AModelFKField', AModelFKField)

        // 기존에 있는 PK
        const prevPKs = map(record[AKey], AModelPKField)
        // 입력된 PK
        const newPKs = compact(map(values, AModelPKField))
        // console.log('prevPKs', prevPKs)
        // console.log('newPKs', newPKs)
        // 삭제된것
        const removedPKs = difference(prevPKs, newPKs)
        if (removedPKs.length) {
          // console.log(AKey, '삭제된것', removedPKs, ModelA)
          hasManyJobs.push(ModelA.destroy({
            where: {
              [AModelPKField]: removedPKs
            },
            transaction: t
          }))
        }

        // 추가된것
        const newObjectArray = map(filter(values, (value) => {
          return !value[AModelPKField]
        }), (r) => {
          r[AModelFKField] = record.id
          return r
        })
        if (newObjectArray.length) {
          // console.log(AKey, '추가된것', newObjectArray)
          hasManyJobs.push(ModelA.bulkCreate(newObjectArray, {
            transaction: t
          }))
        }

        const intersectionPKs = intersection(prevPKs, newPKs)

        map(compact(filter(values, (value) => {
          return includes(intersectionPKs, value[AModelPKField])
        })), (newRecord) => {
          var oldRecord = plainObject(find(record[AKey], {
            [AModelPKField]: newRecord[AModelPKField]
          }))
          var diffRecord = differenceObject(newRecord, oldRecord)
          // oldRecord와, newRecord의 차이가 있는것만 뽑아낸다.
          if (!isEmpty(diffRecord)) {
            // console.log(AKey, '변경된것', newRecord[AModelPKField], diffRecord)
            hasManyJobs.push(ModelA.update(diffRecord, {
              where: {
                [AModelPKField]: newRecord[AModelPKField]
              },
              transaction: t
            }))
          }
        })
      })
      return Promise.all(hasManyJobs).then(() => {
        return record
      })
    })
    .then(() => {
      return Model.find(query, {
        transaction: t,
        lock: (t) ? t.LOCK.UPDATE : undefined
      })
    })
}
