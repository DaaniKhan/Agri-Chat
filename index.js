// Import express and node-cron using ES module syntax
import express from 'express';
import cron from 'node-cron';
import { sendDailyUpdate } from './helpers.js';


// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());

let daily_update_time = "00"
let dailyJob = null;

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Railway Cron Job Server with Multiple Jobs');
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
    }, 
    {
        scheduled: true,
        timezone: "Asia/Karachi"
    });
}

// Initial scheduling of the daily update job
scheduleDailyJob();

// Cron job to update daily_update_time and reschedule the job
cron.schedule("00 15 * * *", () => {
    // Update the daily_update_time dynamically

    // Read Time from database for that user and check with their current daily update time
    // If a change needs to be done

    // Reschedule the daily update job with the new time
    if (daily_update_time != update_time){
        daily_update_time = update_time
        console.log("Updated Time to: " + daily_update_time);
        scheduleDailyJob();
    }
    else{
        console.log("No new time to schedule")
    }
}, 
{
    scheduled: true,
    timezone: "Asia/Karachi"
});

// Port for Express server
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
