const {Router} = require("express");
const mainRouter = Router();
const {authenticationRouter} = require("./authenticationRouter");


mainRouter.use(authenticationRouter);

mainRouter.use(viewRouter);

module.exports = mainRouter;