require("dotenv").config();
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const app = express();
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const mainRouter = require("./routers/mainRouter");

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});

app.use(
  session({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    secret: 'bats',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,  // 2 mins
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(mainRouter);

app.listen(process.env.PORT || 3000, err => {
    if (err) {
        throw err;
    }
    console.log("App is running!");
});
