const {Router} = require("express");
const mainRouter = Router();
const {authenticationRouter} = require("./authenticationRouter");
const {viewRouter} = require("./viewRouter");
const {errorHandler} = require("./errorController");
const NotFoundError = require("../errors/notFoundError");

mainRouter.use(authenticationRouter);

mainRouter.use(viewRouter);

mainRouter.use((req, res) => {
    throw new NotFoundError();
})

mainRouter.use(errorHandler);

module.exports = mainRouter;