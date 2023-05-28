import mysql from "mysql";
import { config } from "dotenv";
import { Db, MongoClient } from "mongodb";
import { Log } from "../logging.js";

config();
let uri: string = "";
export let mongoClient: MongoClient;
if (process.env.DB_URI) uri = process.env.DB_URI;

export let dbMongo: Db = await connectToMongo(uri);

let mysql_uri = "";
if (process.env.DATABASE_URL) mysql_uri = process.env.DATABASE_URL
export const db = mysql.createConnection(mysql_uri);
Log('Connected to PlanetScale!')


export async function connectToMongo(uri: string): Promise<Db> {
  try {
    mongoClient = new MongoClient(uri);
    Log("Connection à MongoDB...");
    await mongoClient.connect();
    Log("Connecté à MongoDB!", "SUCCESS");
    const dbMongo = mongoClient.db("727-tracker");
    return dbMongo;
  } catch (error) {
    Log(`Erreur de connexion à MongoDB! \n${error}`, "ERROR");
    process.exit();
  }
}

export async function disconnectToMongo() {
  await mongoClient.close();
}
