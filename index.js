const { serverProt } = require("./secret");
const connectDB = require("./src/config/db");
const app = require('./app')



app.listen(serverProt, async()=>{
    console.log('server is running on port '+ serverProt);
    await connectDB()
})