import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';

import { IP } from './constants.js'
const app = express();

app.use(cors({
    origin: `http://${IP}:3000`,
    credentials: true
}));


app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


app.use("/api/users",userRouter)
app.use("/api/admin",adminRouter)

export default app;