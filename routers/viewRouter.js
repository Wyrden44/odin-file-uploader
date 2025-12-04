const {Router} = require("express");
const viewRouter = Router();

viewRouter.get("/", (req, res) => {
    res.redirect("/upload");
});

viewRouter.get("/upload", (req, res) => {
    res.render("index", {subpage: "upload", title: "Upload", user: req.user, subargs: {}});
});

module.exports = {viewRouter};