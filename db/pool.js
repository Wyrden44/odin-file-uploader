const {Pool} = require("pg");

const pool = new Pool({
    host: process.env.HOST,
    user: process.env.ROLE_NAME,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: process.env.DB_PORT,
    //connectionString: process.env.CONNECTION_STRING,
});

module.exports = pool;