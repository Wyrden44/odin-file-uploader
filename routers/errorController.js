exports.errorHandler = (err, req, res, next) => {
    console.error(err);

    res.render("index", {subpage: "error", subargs: {error: err}});
}