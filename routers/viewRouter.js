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

// helper
async function deleteRecursively(folderInfo) {
    // deletes a folder and all its subdirs recursively
    for (let child of folderInfo.children) {
        let newFolderInfo = await prisma.Folder.findUnique({
            where: {
                name: child.name,
            },
            select: {
                children: true,
                name: true,
            }
        });
        deleteRecursively(newFolderInfo);
    }
    await prisma.Folder.delete({
        where: {
            name: folderInfo.name,
        }
    });
}

viewRouter.get("/", (req, res) => {
    res.redirect("/files");
});

viewRouter.get("/files", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

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

viewRouter.post("/files/delete/folder/:folder", async (req, res) => {
    const {folder} = req.params;

    // recursively delete all subfolders
    let folderInfo = await prisma.Folder.findUnique({
        where: {
            name: folder,
        },
        select: {
            children: true,
            parent: true,
            name: true,
        }
    });

    if (!folderInfo) {
        return res.status(404).send("Folder not found");
    }

    deleteRecursively(folderInfo);

    // redirect to parent
    if (folderInfo.parent != null) {
        const parentFolder = await prisma.Folder.findUnique({
            where: {
                id: folderInfo.parent.id,
            }
        });

        return res.redirect("/files/" + parentFolder.name);
    }

    res.redirect("/files");
});

// upload files
viewRouter.post("/upload", upload.single("file"), (req, res) => {
    console.log("File: ", req.file, "\n", "Other: ", req.body);
    res.redirect("/upload");
});


module.exports = {viewRouter};