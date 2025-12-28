const {Router} = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const {validationResult} = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const validator = require("../controllers/formValidator");

const viewRouter = Router();
const upload = multer({dest: "./public/data/uploads/"})

// prisma
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});

// helper
function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/login");
}

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
                files: true,
            }
        });
        deleteRecursively(newFolderInfo);
    }
    for (let file of folderInfo.files) {
        console.log("FILE", file);
        await prisma.File.delete({
            where: {
                storageKey: file.storageKey,
            }
        });
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

viewRouter.get("/files", ensureAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    console.log("User:", req.user);

    const folders = await prisma.Folder.findMany({
        where: {
            AND: {
                parentId: null,
                userId: req.user.id,
            }
        },
        select: {
            name: true,
        }
    });

    const files = await prisma.File.findMany({
        where: {
            AND: {
                folderId: {
                    equals: null,
                },
                userId: {
                    equals: req.user.id,
                }
            }
        }
    });

    console.log("Root folders: ", folders);
    res.render("index", {subpage: "files", title: "Files", user: req.user, subargs: {currentFolder: null, folders, files}});
})

// subdirectories
viewRouter.get("/files/:folder", ensureAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const {folder} = req.params;

    const parentFolder = await prisma.Folder.findFirst({
        where: {
            AND: {
                name: folder,
                userId: req.user.id,
            }
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

    const files = await prisma.File.findMany({
        where: {
            folderId: {
                equals: parentFolder.id,
            }
        }
    });

    console.log("folders: ", folders);
    console.log("files:", files);
    res.render("index", {subpage: "files", title: "Files", user: req.user, subargs: {currentFolder: folder, folders, files}});
});

viewRouter.get("/upload", ensureAuth, (req, res) => {
    res.render("index", {subpage: "upload", title: "Upload", user: req.user, subargs: {}});
});


// upload file
viewRouter.post("/files/upload/file", ensureAuth, upload.single("file"), async (req, res) => {
    const {originalname, mimetype, filename, path, size} = req.file;

    const data = await prisma.File.create({
        data: {
            name: originalname,
            size,
            mimeType: mimetype,
            storageKey: filename,
            path,
            userId: req.user.id,
        }
    });

    console.log("Data: ", data);

    res.redirect("/files");
});

viewRouter.post("/files/:folder/upload/file", ensureAuth, upload.single("file"), async (req, res) => {
    const {folder} = req.params;
    const {originalname, mimetype, filename, path, size} = req.file;

    const parentFolder = await prisma.Folder.findFirst({
        where: {
            AND: {
                name: folder,
                userId: req.user.id,
            }
        },
        select: {
            id: true
        }
    });

    await prisma.File.create({
        data: {
            name: originalname,
            size,
            mimeType: mimetype,
            storageKey: filename,
            path,
            
            folderId: parentFolder.id,
            userId: req.user.id,
        }
    });

    res.redirect("/files/" + folder);
});

viewRouter.post("/files/new/folder", ensureAuth, validator.folderValidator, async (req, res) => {
    const errors = validationResult(req).array();
    console.log("errors", errors);

    if (errors.length !== 0) {
        return res.redirect("/files");
    }

    const {name} = req.body;
    await prisma.Folder.create({
        data: {
            name,
            userId: req.user.id,
        }
    });

    res.redirect("/files");
});

// subdir
viewRouter.post("/files/:folder/new/folder/", ensureAuth, validator.folderValidator, async (req, res) => {
    const {folder} = req.params;
    const {name} = req.body;
    // parent
    const parentFolder = await prisma.Folder.findFirst({
        where: {
            AND: {
                name: folder,
                userId: req.user.id,
            }
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
            userId: req.user.id,
        }
    });

    res.redirect("/files/" + folder);
});

viewRouter.post("/files/delete/folder/:folder", ensureAuth, async (req, res) => {
    const {folder} = req.params;

    // recursively delete all subfolders
    let folderInfo = await prisma.Folder.findFirst({
        where: {
            AND: {
                name: folder,
                userId: req.user.id,
            }
        },
        select: {
            children: true,
            parent: true,
            name: true,
            files: true,
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

viewRouter.post("/files/delete/file/:file", ensureAuth, async (req, res) => {
    const {file} = req.params;

    const fileData = await prisma.File.findUnique({
        where: {
            storageKey: file,
        },
        select: {
            folderId: true,
            path: true,
            userId: true,
        }
    });

    if (!fileData || fileData.userId != req.user.id) {
        return res.status(404).send("File not Found");
    }

    await prisma.File.delete({
        where: {
            storageKey: file,
        }
    });

    // delete from disk
    try {
        await fs.unlink(fileData.path);
    } catch(err) {
        console.error("Failed to delete file:", err);
    }

    if (fileData.folderId) {
        const parentFolder = await prisma.Folder.findUnique({
            where: {
                id: fileData.folderId,
            },
            select: {
                name: true,
            }
        });
        return res.redirect("/files/" + parentFolder.name);
    }

    res.redirect("/files");
});

// download
viewRouter.post("/files/download/:file", ensureAuth, async (req, res) => {
    const {file} = req.params;

    const fileData = await prisma.File.findUnique({
        where: {
            storageKey: file,
        },
        select: {
            path: true,
            name: true,
            userId: true,
        }
    });

    if (!fileData || fileInfo.userId != req.user.id) {
        return res.status(404).send("File not found");
    }

    res.download(fileData.path, fileData.name);
});

// fetching file details
viewRouter.get("/files/details/file/:file", async (req, res) => {
    const {file} = req.params;

    const fileInfo = await prisma.File.findUnique({
        where: {
            storageKey: file,
        }
    });

    if (!fileInfo || fileInfo.userId != req.user.id) {
        return res.status(404).send("File not Found");
    }

    res.render("details", {name: fileInfo.name,
        size: fileInfo.size,
        createdAt: fileInfo.uploadedAt,
        updatedAt: fileInfo.updatedAt,
        // helper to format the date
        formatDate: (date) => new Date(date).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
    })});
});

module.exports = {viewRouter};