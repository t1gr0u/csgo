require('dotenv').config()
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_DB,
  DB_PORT
} = process.env

const mysql = require('mysql2/promise')
const fetch = require('node-fetch')
const xmlParser = require('xml2json')

exports.handler = async (event ,context) => {
  let results
  try {
    try {
      results = await getDBResults()
    } catch (error) {
      console.log(' -- error -- ', error)
      // try again
      results = await getDBResults()
    }

    if (!results || results.length === 0) {
      return {
        statusCode: 200,
        body: '[]'
      }
    }

    const profiles = await getProfiles(results)
    console.log(' -- profiles -- ', profiles)

    return {
      statusCode: 200,
      body: JSON.parse(profiles)
    }
  } catch (error) {
    console.log(' -- Main error -- ', error)
    return {
      statusCode: 500,
      body:
        JSON.parse({ error })
    }
  }
}

const getDBResults = async () => {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_DB,
      port: DB_PORT
    })

    const [rows] = await connection.execute('SELECT `steamid`, `name`, `lastconn`, `alive` FROM players ORDER BY alive DESC, `name` ASC;')
    // console.log(' -- rows -- ', rows)

    await connection.end()

    return rows
  } catch (error) {
    console.log('-- getDBResults - error --', error)
    throw new Error('DB issues')
  }
}

const getProfiles = async (players) => {
  const promises = players.map(async (player) => {
    player = JSON.parse(JSON.stringify(player))
    player.avatar = await getProfile(player.steamid)

    return player
  })

  return Promise.allSettled(promises)
    .then(allPromises => {
      return allPromises.map(promise => {
        if (promise.status === 'fulfilled') {
          return promise.value
        }
      })
    })
}

const getProfile = async (steamId) => {
  const profile = await fetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`)
    .then(response => response.text())
    .then(xml => xmlParser.toJson(xml))
    .then(jsonAsString => JSON.parse(jsonAsString))

  if (!profile || !profile.profile || !profile.profile.avatarMedium) {
    return ''
  }

  return Promise.resolve(profile.profile.avatarMedium)
}
