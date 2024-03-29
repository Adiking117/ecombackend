import dotenv from 'dotenv'
import app from "./app.js"
import connectDB from "./db/index.js"

dotenv.config({
    path: './env'
})

app.get("/",(req,res)=>{
    res.send("hi adi")
})


const port = process.env.PORT || 5000
connectDB().then(()=>{
    app.listen(port,()=>{
        console.log(`Data base is connected and Server is running on ${port}`)
    })
}).catch((error)=>{
    console.log("Connection error : ",error)
})