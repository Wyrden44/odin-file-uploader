require("dotenv").config();
const path = require("node:path");
const express = require("express");
const app = express();
const mainRouter = require("./routers/mainRouter");

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(mainRouter);

app.listen(process.env.PORT || 3000, err => {
    if (err) {
        throw err;
    }
    console.log("App is running!");
});
