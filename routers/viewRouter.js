const {Router} = require("express");
const multer = require("multer");
const viewRouter = Router();

const upload = multer({dest: "./public/data/uploads/"})

viewRouter.get("/", (req, res) => {
    res.redirect("/upload");
});

viewRouter.get("/upload", (req, res) => {
    res.render("index", {subpage: "upload", title: "Upload", user: req.user, subargs: {}});
});

// upload files
viewRouter.post("/upload", upload.single("file"), (req, res) => {
    console.log("File: ", req.file, "\n", "Other: ", req.body);
    res.redirect("/upload");
});

module.exports = {viewRouter};