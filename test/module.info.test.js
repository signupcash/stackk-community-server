const config = require('../config')
const testUtils = require('./utils')
const assert = require('chai').assert
const axios = require('axios').default

// safety first
if (config.env !== 'test') {
  console.log(
    `Current environment: ${config.env} . Tests run only with test environment - KOA_ENV=test`
  )
  process.exit(0)
}

const Info = require('../src/models/info')

const context = {}

const LOCALHOST = `http://localhost:${config.port}`

describe('routes : info', () => {
  before(async () => {
    // clean the DB
    const infos = await Info.find({})
    // Delete each info
    for (let i = 0; i < infos.length; i++) {
      const thisInfo = infos[i]
      await thisInfo.remove()
    }

    const infoObj = {
      moderatorAddress: config.moderator,
      moderatorName: 'moderator',
      moderatorEmail: 'test@test.com',
      description: 'description',
      title: 'title'
    }
    const testInfo = new Info(infoObj)
    await testInfo.save()
    context.info = testInfo
  })

  describe('GET /api/v1/info', () => {
    let initialEnvVar

    beforeEach(() => {
      initialEnvVar = config.moderator
    })

    afterEach(() => {
      config.moderator = initialEnvVar
    })
    it('should throw error if info is not found', async () => {
      config.moderator = undefined
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/api/v1/info`,
          headers: {
            Accept: 'application/json'
          }
        }
        await axios(options)
        assert(false, 'Unexpected result should never come here')
      } catch (err) {
        assert(err.response.status === 404, 'Error code 404 expected.')
      }
    })
    it('should return API info', async () => {
      const options = {
        method: 'GET',
        url: `${LOCALHOST}/api/v1/info`,
        headers: {
          Accept: 'application/json'
        }
      }
      const result = await axios(options)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(
        result.data.moderator === config.moderator,
        'Moderator address expected'
      )
      assert(
        result.data.version === config.version,
        'Version expected'
      )
      assert(
        result.data.moderatorName === context.info.moderatorName,
        'Moderator name expected'
      )
      assert(
        result.data.description === context.info.description,
        'Moderator description expected'
      )
      assert(
        result.data.title === context.info.title,
        'Moderator title expected'
      )
    })
  })

  describe('PUT /api/v1/info/:moderator', () => {
    it('should reject creation when data is incomplete', async () => {
      try {
        const payload = {
          description: 'incomplete data'
        }
        const signature = 'IP+2N3miVDBJSLDtjewzLBzzz1KDxon6T9ovDfyP9tgacTsDul4bvi2CjJkv5Lg0jLrtaJcfeBflgywGajhMPHk='
        const result = await testUtils.updateInfo(config.moderator, payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should reject creation when signature is invalid', async () => {
      try {
        const payload = {
          moderatorName: 'new moderator',
          moderatorEmail: 'new@test.com',
          description: 'new description',
          title: 'new title'
        }
        const signature = 'IO06TFZNTpxANWv8zxlcjuiziX57jDHxfgCEu2FhBGUhTdxCcGdlM1PGrK3TCC2czMZfXeb9uGE4DaVKqZVs+HA='
        const result = await testUtils.updateInfo('new-moderator', payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should create info for non existing moderator', async () => {
      const payload = {
        moderatorName: 'new moderator',
        moderatorEmail: 'new@test.com',
        description: 'new description',
        title: 'new title'
      }
      const signature = 'IPC1az5VTPkuRc7k9MM40eeQ+zbuYuivStvR+aAujoVNRIK3itU1EP4Vcrh1RS7SLTFBwy4Tgdg7hRvYdVr38og='
      const result = await testUtils.updateInfo('new-moderator', payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      const checkCreated = () => (Info.findOne({ moderatorAddress: 'new-moderator' }).exec())
      const created = await checkCreated()
      assert(
        created.moderatorAddress === 'new-moderator',
        'moderatorAddress expected'
      )
      assert(
        created.moderatorName === 'new moderator',
        'moderatorName expected'
      )
      assert(
        created.moderatorEmail === 'new@test.com',
        'moderatorEmail expected'
      )
      assert(
        created.description === 'new description',
        'description expected'
      )
      assert(
        created.title === 'new title',
        'title expected'
      )
    })
    it('should update info for existing moderator', async () => {
      const payload = {
        moderatorName: 'moderator',
        moderatorEmail: 'mod@test.com',
        description: 'mod description',
        title: 'mod title'
      }
      const signature = 'H9LfDc1E0JHvTKQ9pNiNrnWrfOjTZjM6pGkaaDhSpatUHH0fZcgow73yvWs6/3+tsXA3WDKSCD7oU901Syc+v84='
      const result = await testUtils.updateInfo(config.moderator, payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      const checkUpdated = () => (Info.findOne({ moderatorAddress: config.moderator }).exec())
      const updated = await checkUpdated()
      assert(
        updated.moderatorAddress === config.moderator,
        'moderatorAddress expected'
      )
      assert(
        updated.moderatorName === 'moderator',
        'moderatorName expected'
      )
      assert(
        updated.moderatorEmail === 'mod@test.com',
        'moderatorEmail expected'
      )
      assert(
        updated.description === 'mod description',
        'description expected'
      )
      assert(
        updated.title === 'mod title',
        'title expected'
      )
    })
  })
})
