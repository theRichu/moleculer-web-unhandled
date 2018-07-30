'use strict'

const {
  ServiceBroker
} = require('moleculer')
const CONFIG = require('../../common/config')

const UsersService = require('../../services/users.service')
const request = require('supertest')('http://localhost:3000')

describe("Test 'Users' service", () => {
  let broker = new ServiceBroker({
    nodeID: 'userTest',
    transporter: CONFIG.transporter
  })
  broker.createService(UsersService)
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())

  describe("Test 'user.signup' action", () => {
    it('rejection on resolveToken', () => {
      return broker.call('users.resolveToken', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MzE3MzI1MjAsInNjb3BlIjpbIioiXSwidXNlciI6MSwiaWF0IjoxNTMxNzI4OTIwfQ.SF9b4qXD7jYy0t8vC-zMfOSeB4xo3o4YEzSIn6ezYiI'
      }).catch((e) => {
        expect(e.toString()).toMatch('jwt expired')
      })

      // .then(result => {
      //   return expect(result).toEqual(expect.objectContaining({
      //     id: 1,
      //     username: 'user',
      //     email: 'user@email.com'
      //   }))
      // })
    })

    it('unhandled rejection on request', () => {
      return request.get('/user/me').set('authorization', 'Token ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MzE3MzI1MjAsInNjb3BlIjpbIioiXSwidXNlciI6MSwiaWF0IjoxNTMxNzI4OTIwfQ.SF9b4qXD7jYy0t8vC-zMfOSeB4xo3o4YEzSIn6ezYiI')
        // .expect(412)
        .then((response) => {
          console.log(arguments)
          // expect(response.body.username).toBe('tester2')
        })
    })

    // it('같은 이메일로 재가입 불가', () => {
    //   return broker.call('users.signup', {
    //     username: 'tester22',
    //     email: 'tester3@gmail.com',
    //     password: 'votmdnjem'
    //   }).catch((e) => {
    //     expect(e.toString()).toMatch('Email is exist')
    //   })
    // })

    // it('아이디로 로그인 가능해야함', () => {
    //   return broker.call('users.login', {
    //     identifier: 'tester',
    //     password: 'votmdnjem'
    //   }).then((result) => {
    //     expect(result.accessToken).not.toBeNull()
    //   })
    // })

    // let accessToken1
    // it('이메일로 로그인 가능해야함', () => {
    //   return broker.call('users.login', {
    //     identifier: 'tester3@gmail.com',
    //     password: 'votmdnjem'
    //   }).then((result) => {
    //     accessToken1 = result.accessToken
    //     expect(result.accessToken).not.toBeNull()
    //   })
    // })
    // let accessToken2
    // it('이메일로 로그인 가능해야함', () => {
    //   return broker.call('users.login', {
    //     identifier: 'tester2',
    //     password: 'votmdnjem'
    //   }).then((result) => {
    //     accessToken2 = result.accessToken
    //     expect(result.accessToken).not.toBeNull()
    //   })
    // })

    // it('가입되지 않은 아이디로 로그인 불가', () => {
    //   return broker.call('users.login', {
    //     identifier: 'tester1@gmail.com',
    //     password: 'votmdnjem'
    //   }).catch((e) => {
    //     expect(e.toString()).toMatch('Identifier or password is invalid')
    //   })
    // })

    // it('패스워드 틀리면 로그인 불가', () => {
    //   return broker.call('users.login', {
    //     identifier: 'tester3@gmail.com',
    //     password: 'votmdnje1m'
    //   }).catch((e) => {
    //     expect(e.toString()).toMatch('Wrong password')
    //   })
    // })

    // it('ResolveToken', () => {
    //   return broker.call('users.resolveToken', {
    //     token: accessToken1
    //   }).then((result) => {
    //     expect(result.username).toMatch('tester')
    //   })
    // })

    // it('ResolveToken invalid', () => {
    //   return broker.call('users.resolveToken', {
    //     token: accessToken1 + '1212'
    //   }).catch((e) => {
    //     expect(e.toString()).toMatch('invalid signature')
    //   })
    // })

    // describe('API me test', () => {
    //   let user1Id
    //   it('MeUser1', () => {
    //     return request.get('/user/me').set('authorization', 'Token ' + accessToken1)
    //       .expect(200)
    //       .then((response) => {
    //         user1Id = response.body.id
    //         expect(response.body.username).toBe('tester')
    //       })
    //   })
    //   let user2Id

    //   it('MeUser2', () => {
    //     return request.get('/user/me').set('authorization', 'Token ' + accessToken2)
    //       .expect(200)
    //       .then((response) => {
    //         user2Id = response.body.id
    //         expect(response.body.username).toBe('tester2')
    //       })
    //   })
    //   it('다른 사용자 삭제 불가능해야함', () => {
    //     return request.delete('/user/' + user2Id).set('authorization', 'Token ' + accessToken1)
    //       .expect(401)
    //   })

    //   it('사용자 삭제', () => {
    //     return request.delete('/user/' + user1Id).set('authorization', 'Token ' + accessToken1)
    //       .expect(200)
    //   })

    //   it('사용자 삭제', () => {
    //     return request.delete('/user/' + user2Id).set('authorization', 'Token ' + accessToken2)
    //       .expect(200)
    //   })
    // })
  })
})
