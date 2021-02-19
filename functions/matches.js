const db = require('./../libs/mysql')

exports.handler = async (event, context) => {
  let matchId
  let func = getLastMatches
  if (event.queryStringParameters && event.queryStringParameters.matchId) {
    matchId = event.queryStringParameters.matchId
    func = getMatch
  }

  let results
  try {
    try {
      results = await func(matchId)
    } catch (error) {
      console.log(' -- error -- ', error)
      // try again
      results = await func(matchId)
    }

    if (!results || results.length === 0) {
      return {
        statusCode: 200,
        body: '[]'
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    }
  } catch (error) {
    console.log(' -- Main error -- ', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    }
  }
}

const getLastMatches = async () => {
  try {
    const connection = await db.execute()

    const [rows] = await connection.execute('SELECT	`id`, `map`, `rounds`, `startedAt`, `finishedAt` FROM `games_copy` ORDER BY `startedAt` DESC LIMIT 10;')
    // console.log(' -- rows -- ', rows)

    await connection.end()

    return rows
  } catch (error) {
    console.log('-- getLastMatches - error --', error)
    throw new Error('DB issues')
  }
}

const getMatch = async (matchId) => {
  try {
    const connection = await db.execute()

    const [rows] = await connection.execute('SELECT `ps`.`id`, `ps`.`steamid`, `ps`.`gameid`, `ps`.`kills`, `ps`.`deaths`, `ps`.`shots`, `ps`.`hits`, `ps`.`headshots`, `ps`.`assists`, `ps`.`damage`, `ps`.`blind`, `p`.`name`, `g`.`map`, `g`.`rounds`, `g`.`startedAt`, `g`.`finishedAt` FROM `player_stats_copy` ps LEFT JOIN players p ON `ps`.`steamid` = `p`.`steamid` LEFT JOIN `games_copy` g ON `g`.`id` = `ps`.`gameid` WHERE `ps`.`gameId` = ? ORDER BY `ps`.`kills` DESC LIMIT 10;', [matchId])
    // console.log(' -- rows -- ', rows)

    await connection.end()

    return rows
  } catch (error) {
    console.log('-- getMatch - error --', error)
    throw new Error('DB issues')
  }
}
