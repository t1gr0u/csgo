require('dotenv').config()
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_DB,
  DB_PORT
} = process.env

const mysql = require('mysql2/promise')

const db = module.exports = {}

db.execute = () => {
  return mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_DB,
    port: DB_PORT
  })
}
