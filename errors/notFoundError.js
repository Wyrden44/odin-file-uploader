class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.message = "Page does not exist";
        this.status = 404;
    }
}

module.exports = NotFoundError;