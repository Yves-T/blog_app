import { connect, ConnectOptions } from "mongoose";

const dbName = "blog";
const options: ConnectOptions = {
  dbName,
  // autoIndex: false, // Don't build indexes ( for DEV true , false for production see mongoose docs)
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

const dbConnect = async () => {
  console.log("process env", process.env.MONGO_URI);
  try {
    await connect(process.env.MONGO_URI!, options);
    console.log("Connected successfully");
  } catch (error) {
    console.log(error);
  }
};

export default dbConnect;
