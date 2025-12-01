const {Router} = require("express");
const authenticationRouter = Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local');
const { PrismaClient } = require('../generated/prisma/client');

const prisma = new PrismaClient();

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: {username}
        });

        if (!user) return done(null, false, { message: "Incorrect username." });

        const match = await bcrypt.compare(password, user.password);

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
        const user = await prisma.user.findUnique({ where: { id } });
        return done(null, user);
    } catch (err) {
        return done(err);
    }
});

authenticationRouter.get("/login", (req, res) => {

});

authenticationRouter.get("/sign-up", (req, res) => {
    
});

authenticationRouter.post("/login", (req, res) => {

});

authenticationRouter.post("/sign-up", (req, res) => {
    
});

module.exports = {authenticationRouter};