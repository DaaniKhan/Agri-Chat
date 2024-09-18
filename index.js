// Import express and node-cron using ES module syntax
import express from 'express';
import cron from 'node-cron';
import { sendDailyUpdate } from './helpers.js';
import { getUserUpdateTime, getAllUserUpdateTimes } from './db_controller.js';


// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());


let daily_update_times = {}

let dailyJobs = [];

let phone_numbers = ["923200006080", "923004329358", "923344926470", "923224661550"]

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Railway Cron Job Server with Multiple Jobs');
});

// Function to create and schedule the daily update cron job
function scheduleDailyJob() {
    // If there's an existing job, stop it before creating a new one
    if (dailyJobs) {
        console.log("Stopping Jobs")
        dailyJobs.forEach(job => job.stop());
        dailyJobs = []; // Reset the array
    }

    if(daily_update_times){
        console.log("Initialising Jobs")
        Object.keys(daily_update_times).forEach(userId => {
            const { hr, min } = daily_update_times[userId];
            
            // Schedule a job for each user using their specific update time
            const userJob = cron.schedule(`${min} ${hr} * * *`, () => {
                
                if (userId == 1 || userId == 4){
                    console.log(`Sending daily update for user ${userId} at ${hr}:${min}`);
                    sendDailyUpdate(phone_numbers[userId - 1]);
                }
            }, 
            {
                scheduled: true,
                timezone: "Asia/Karachi"
            });
    
            // Add the job to the dailyJobs array
            console.log("Pushing Job")
            dailyJobs.push(userJob);
        });
    }
}

// Initial scheduling of the daily update job
console.log("First Schedule Call")
scheduleDailyJob();

// Cron job to update daily_update_time and reschedule the job
cron.schedule("60 * * * *", async () => {
    // Update the daily_update_time dynamically
    async function getUpdateTimes(){
        
        const update_times = await getAllUserUpdateTimes()

        let daily_update_time = {};

        update_times.forEach((time, index) => {
            // Split the time into hour and minute components
            const [hr, min] = time.split(':');

            // Create the entry for each user
            daily_update_time[index + 1] = {
                hr: hr,
                min: min
            };
        });

        return daily_update_time
    }
    
    console.log("Getting Times:")
    const update_times = await getUpdateTimes()
    console.log(update_times)

    // Reschedule the daily update job with the new time
    if (JSON.stringify(daily_update_times) === JSON.stringify(update_times)){
        console.log("No new times to schedule")
    }
    else{
        daily_update_times = update_times
        console.log("updated times:")
        console.log(daily_update_times);
        scheduleDailyJob();
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
