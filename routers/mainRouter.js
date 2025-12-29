const {Router} = require("express");
const mainRouter = Router();
const {authenticationRouter} = require("./authenticationRouter");
const {viewRouter} = require("./viewRouter");
const {errorHandler} = require("./errorController");

mainRouter.use(authenticationRouter);

mainRouter.use(viewRouter);

mainRouter.use(errorHandler);

module.exports = mainRouter;