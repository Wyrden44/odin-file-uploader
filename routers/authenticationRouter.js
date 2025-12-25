const {Router} = require("express");
const authenticationRouter = Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({connectionString});

const prisma = new PrismaClient({adapter});

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await prisma.User.findUnique({
            where: {username}
        });

        if (!user) return done(null, false, { message: "Incorrect username." });

        const match = bcrypt.compare(password, user.password);

        if (!match) {
            return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.User.findUnique({ where: { id } });
        return done(null, user);
    } catch (err) {
        return done(err);
    }
});

authenticationRouter.get("/login", (req, res) => {
    res.render("index", {subpage: "login", user: req.user, subargs: {errors: null}});
});

authenticationRouter.get("/sign-up", (req, res) => {
    res.render("index", {subpage: "signup", user: req.user, subargs: {errors: null}}); 
});

authenticationRouter.post("/login",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureMessage: true,
    })
);

authenticationRouter.post("/sign-up", async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.User.create({
            data: {
                username: username,
                password: hashedPassword,
            }
        });
        res.redirect("/");
    }
    catch (err) {
        return next(err);
    }

});

authenticationRouter.post("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect("/");
    })
});

module.exports = {authenticationRouter};