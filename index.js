// Import express and node-cron using ES module syntax
import express from 'express';
import cron from 'node-cron';
import axios from "axios";
import dotenv from 'dotenv';
import { addReadingRecord, addUser, get10ReadingRecords, getLanguage, addConversation, getThreadID, get10ReadingRecordsByUserID } from './db_controller.js'; 
import { format } from 'date-fns';

// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());

let daily_update_time = "00"

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Railway Cron Job Server with Multiple Jobs');
});



cron.schedule(daily_update_time + " 14 * * *", () => {
    // Example function call
    // sendDailyUpdate("923224661550");
    // sendDailyUpdate("923200006080");

    console.log("PLEASE WORK")
}, 
{
    scheduled: true,
    timezone: "Asia/Karachi"
})

// Cron Job
cron.schedule("* * * * *", () => {
    daily_update_time = "40"
    console.log("Updated Time")
    console.log(daily_update_time + " 14 * * *")
}, 
{
    scheduled: true,
    timezone: "Asia/Karachi"
})

// Port for Express server
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
