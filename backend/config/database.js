const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://assigment:Kaival1234@cluster0.rop78pu.mongodb.net/EventHub?retryWrites=true&w=majority&appName=Cluster0", 
      {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message)
    process.exit(1)
  }
}

module.exports = connectDB
