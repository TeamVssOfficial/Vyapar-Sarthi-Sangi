import express from 'express'
import userrouter from './routers/userrouter.js'
import connectiontoDb from './config/db.js'
import cookieParser from 'cookie-parser'

const app = express()
connectiontoDb()

// Enable CORS for VSS AI Frontend & PyBackend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Business-Id");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use('/api/user', userrouter)

export default app 