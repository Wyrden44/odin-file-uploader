const {body, param} = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter})

const loginFields = [
    "username",
    "password",
];

const signupFields = [
    "username",
    "password",
];

exports.signupValidator = [
    body("username").trim()
        .notEmpty().withMessage("Please enter a username")
        .matches(/^[0-9a-zA-Z._\-,!]+$/).withMessage("Username contains invalid characters")
        .custom(async (username) => {
            const other = await prisma.User.findUnique({
                where: {
                    username: username,
                }
            });

            console.log(other);

            if (other != null) {
                throw new Error("Username already taken");
            }
        }),
    body("password").trim()
        .notEmpty().withMessage("Please enter a password")
        .isLength({ min: 8 }).withMessage("Password should be at least 8 chars long"),
    body(signupFields)
        .isLength({max: 255}).withMessage("The maximum length for a text field is 255 chars")
];

exports.loginValidator = [
    body("username").trim()
        .notEmpty().withMessage("Please enter a username"),
    body("password").trim()
        .notEmpty().withMessage("Please enter a password")
];

exports.folderValidator = [
    body("name").trim()
        .notEmpty().withMessage("Please enter a name")
        .isLength({max: 255}).withMessage("The maximum length for the folder name is 255 chars")
        .matches(/^[0-9a-zA-Z_\-]+$/).withMessage("Name contains invalid characters")
];

exports.durationValidator = [
    body("duration").trim()
        .isInt({ min: 1, max: 365 }).withMessage("Invalid duration")
]
