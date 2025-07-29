require("./config");
const { init } = require("./core");

const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const express = require("express");

const app = express();


// HTTPS Redirect
app.use((req, res, next) => {
    if (process.env.NODE_ENV == "production")
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
    next();
});

app.set("trust proxy", true);

// Middlewares
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use((req, res, next) => {
    express.static(path.join(__dirname, "client", "dist"))(req, res, next);
});

app.all("/{*any}", (req, res) => {
    res.send(req.headers.host);
});

const PORT = process.env.PORT || 3005;

(async () => {
    await init();

    app.listen(PORT, () => {
        console.log(`Server Started @ ${PORT}`);
    });
})();