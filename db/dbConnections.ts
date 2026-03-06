import mongoose, { connect } from "mongoose";
export const  dbConnections = ()=>{
if (mongoose.connection.readyState >= 1) return;
console.log("DBconnected successfully")
return connect(process.env.MONGO_URL as string)
.then(() => console.log("DBconnected successfully"))
.catch((err) => console.log(err)); 

}

  