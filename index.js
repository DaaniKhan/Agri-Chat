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

let dailyJob;

// Cron job to update daily_update_time and reschedule the job
cron.schedule("* * * * *", () => {
    // Update the daily_update_time dynamically
    update_time = "12"; // New time value

    
    // Reschedule the daily update job with the new time
    if (daily_update_time != update_time){
        daily_update_time = update_time
        console.log("Updated Time to: " + daily_update_time);
        scheduleDailyJob();
    }
    else{
        console.log("No new time")
    }
}, 
{
    scheduled: true,
    timezone: "Asia/Karachi"
});

// Function to create and schedule the daily update cron job
function scheduleDailyJob() {
    // If there's an existing job, stop it before creating a new one
    if (dailyJob) {
        dailyJob.stop();
    }

    // Create a new job using the updated daily_update_time
    dailyJob = cron.schedule(daily_update_time + " 15 * * *", () => {
        // Example function call
        // sendDailyUpdate("923224661550");
        // sendDailyUpdate("923200006080");

        console.log("PLEASE WORK");
        console.log("Scheduled job with time: " + daily_update_time + " 15 * * *");
    }, 
    {
        scheduled: true,
        timezone: "Asia/Karachi"
    });
}

// Initial scheduling of the daily update job
scheduleDailyJob();

// Port for Express server
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
