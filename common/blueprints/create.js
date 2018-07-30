/*
// 이런것이 가능
create('post', {
  title: '새로운 글 + 태그 1, 2, 새태그999',
  tags: [1, 2, {
    name: '새태그999'
  }],
  description: '야옹'
})

*/
const {
  cleanObject
} = require('../util')
const pluralize = require('pluralize')

const {
  mapValues,
  pickBy,
  map,
  uniq,
  union,
  keys,
  isEmpty,
  intersection,
  get
} = require('lodash')

module.exports = function (Model, input, t) {
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
  const HasMany = pickBy(hm, (value) => {
    return !isEmpty(value)
  })
  const alteredAssociatedKeys = intersection(keys(belongTo), keys(form))

  const includeBelongToKeys = uniq(map(alteredAssociatedKeys, (k) => {
    return belongTo[k]
  }))
  const includeHasManyKeys = keys(HasMany)
  const includeKeys = union(includeBelongToKeys, includeHasManyKeys)

  // console.log(includeKeys, includeKeys)

  // console.log(associatedKeys)
  // let createData = clone(input)
  // let needPostAction = false

  // each(associatedKeys, (association) => {
  //   if (isArray(input[association])) {
  //     createData[association] = filter(input[association], isObject)
  //     needPostAction = true
  //   }
  // })

  // console.log(createData, filterByAssociatedKeys)
  return Model.create(form, {
    include: map(includeKeys, (k) => {
      return Model.associations[k]
    })
  }, {
    transaction: t
  })
  // .then(record => {
  //   if (!needPostAction) {
  //     return record
  //   }
  //   const postJobs = map(associatedKeys, (association) => {
  //     const pk = get(Model, ['associations', association, 'primaryKeyField'])
  //     // console.log(association, createData[association], !createData[association])
  //     if (!isArray(createData[association]) || !createData[association]) {
  //       return null
  //     }
  //     const newlyCreatedPks = map(record[association], pk)
  //     const existed = filter(input[association], (value) => {
  //       return !isObject(value)
  //     })
  //     const existedPks = map(existed, (value) => {
  //       return get(value, pk, value)
  //     })
  //     return record['set' + capitalizeFirstLetter(association)](union(newlyCreatedPks, existedPks))
  //   })
  //   return Promise.all(postJobs).then(() => {
  //     return record.reload()
  //   })
  // })
}
