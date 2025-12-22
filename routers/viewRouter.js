const {Router} = require("express");
const multer = require("multer");
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");

const viewRouter = Router();
const upload = multer({dest: "./public/data/uploads/"})

// prisma
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});

viewRouter.get("/", (req, res) => {
    res.redirect("/files");
});

viewRouter.get("/files", async (req, res) => {
    const folders = await prisma.Folder.findMany({
        where: {
            parentId: {
                equals: null,
            }
        },
        select: {
            name: true,
        }
    });

    console.log("Root folders: ", folders);
    res.render("index", {subpage: "files", title: "Files", user: req.user, subargs: {currentFolder: null, folders}});
})

// subdirectories
viewRouter.get("/files/:folder", async (req, res) => {
    const {folder} = req.params;

    const parentFolder = await prisma.Folder.findUnique({
        where: {
            name: folder,
        },
        select: {
            id: true,
        }
    });

    if (!parentFolder) {
        return res.status(404).send("Folder not Found");
    }

    const folders = await prisma.Folder.findMany({
        where: {
            parentId: {
                equals: parentFolder.id,
            }
        }
    });

    console.log("folders: ", folders);
    res.render("index", {subpage: "files", title: "Files", user: req.user, subargs: {currentFolder: folder, folders}});
});

viewRouter.get("/upload", (req, res) => {
    res.render("index", {subpage: "upload", title: "Upload", user: req.user, subargs: {}});
});

viewRouter.post("/files/new/folder", async (req, res) => {
    const {name} = req.body;
    await prisma.Folder.create({
        data: {
            name,
        }
    });

    res.redirect("/files");
});

// subdir
viewRouter.post("/files/:folder/new/folder/", async (req, res) => {
    const {folder} = req.params;
    const {name} = req.body;
    // parent
    const parentFolder = await prisma.Folder.findUnique({
        where: {
            name: folder,
        },
        select: {
            id: true,
        }
    });

    console.log("parent", parentFolder, folder, name);

    if (!parentFolder) {
        return res.status(404).send("Folder not found");
    }

    await prisma.Folder.create({
        data: {
            name,
            parentId: parentFolder.id,
        }
    });

    res.redirect("/files/" + folder);
});

// upload files
viewRouter.post("/upload", upload.single("file"), (req, res) => {
    console.log("File: ", req.file, "\n", "Other: ", req.body);
    res.redirect("/upload");
});


module.exports = {viewRouter};