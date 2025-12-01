const {Router} = require("express");
const mainRouter = Router();
const {authenticationRouter} = require("./authenticationRouter");
const {viewRouter} = require("./viewRouter");

mainRouter.use(authenticationRouter);

mainRouter.use(viewRouter);

module.exports = mainRouter;