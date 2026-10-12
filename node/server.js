require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require('path')
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/connectDB")
const PORT = process.env.PORT || 7100
const app = express()
connectDB()

//middlewares
app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use("/api/auth", require("./routes/authRoute"))
app.use("/api/users", require("./routes/userRoute"))
app.use("/api/items", require("./routes/itemRoute"))
app.use("/api/inspirations", require("./routes/inspirationRoute"))
app.use("/api/rentals", require("./routes/rentalRoute"))
app.use("/api/cart", require("./routes/cartRoute"))
app.use("/api/closed-dates", require("./routes/closedDateRoute"))
app.use("/api/chat", require("./routes/chatRoute"))

//routes
app.get("/", (req, res) => {
    res.send("this is the home page")
})

app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' })
})

app.use((err, req, res, next) => {
    console.error(err)
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message })
    }
    if (err.code === 11000) {
        return res.status(409).json({ message: 'Duplicate field value entered' })
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID format' })
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' })
})

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port
${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
})






