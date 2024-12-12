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

// let phone_numbers = ["923084341993", "923200006080", "923224661550"]

let phone_numbers = ["923084341993", "923200006080", "923224661550", "923334341662", "923084219892"]

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
                
                if (userId == 3 || userId == 3){
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
cron.schedule("11 09 * * *", async () => {
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

// cron.schedule("00 * * * *", async () => {
//     // Define the optimal ranges for blackberries
//     const optimalRanges = {
//         pH: { min: 5.5, max: 7.0 },
//         nitrogen: { min: 20, max: 100 },  // mg/kg
//         phosphorus: { min: 20, max: 60 }, // mg/kg
//         potassium: { min: 100, max: 300 }, // mg/kg
//         temperature: { min: 18, max: 29 }, // °C
//         moisture: { min: 50, max: 80 },   // % (field capacity)
//         conductivity: { min: 200, max: 1000 } // µS/cm
//     };
    
//     // Function to check if the measurement is within range
//     const isInRange = (value, min, max) => {
//         return value >= min && value <= max;
//     };
    
//     // Function to compare actual values against the optimal ranges
//     function checkBlackberryConditions(values) {
//         let alerts = [];
    
//         if (!isInRange(values.pH, optimalRanges.pH.min, optimalRanges.pH.max)) {
//         alerts.push(`pH is out of range: ${values.pH} (Optimal: ${optimalRanges.pH.min}-${optimalRanges.pH.max})`);
//         }
    
//         if (!isInRange(values.nitrogen, optimalRanges.nitrogen.min, optimalRanges.nitrogen.max)) {
//         alerts.push(`Nitrogen is out of range: ${values.nitrogen} mg/kg (Optimal: ${optimalRanges.nitrogen.min}-${optimalRanges.nitrogen.max} mg/kg)`);
//         }
    
//         if (!isInRange(values.phosphorus, optimalRanges.phosphorus.min, optimalRanges.phosphorus.max)) {
//         alerts.push(`Phosphorus is out of range: ${values.phosphorus} mg/kg (Optimal: ${optimalRanges.phosphorus.min}-${optimalRanges.phosphorus.max} mg/kg)`);
//         }
    
//         if (!isInRange(values.potassium, optimalRanges.potassium.min, optimalRanges.potassium.max)) {
//         alerts.push(`Potassium is out of range: ${values.potassium} mg/kg (Optimal: ${optimalRanges.potassium.min}-${optimalRanges.potassium.max} mg/kg)`);
//         }
    
//         if (!isInRange(values.temperature, optimalRanges.temperature.min, optimalRanges.temperature.max)) {
//         alerts.push(`Temperature is out of range: ${values.temperature} °C (Optimal: ${optimalRanges.temperature.min}-${optimalRanges.temperature.max} °C)`);
//         }
    
//         if (!isInRange(values.moisture, optimalRanges.moisture.min, optimalRanges.moisture.max)) {
//         alerts.push(`Moisture is out of range: ${values.moisture}% (Optimal: ${optimalRanges.moisture.min}-${optimalRanges.moisture.max}%)`);
//         }
    
//         if (!isInRange(values.conductivity, optimalRanges.conductivity.min, optimalRanges.conductivity.max)) {
//         alerts.push(`Conductivity is out of range: ${values.conductivity} µS/cm (Optimal: ${optimalRanges.conductivity.min}-${optimalRanges.conductivity.max} µS/cm)`);
//         }
    
//         // If any alerts were generated, send a WhatsApp message
//         if (alerts.length > 0) {
//         sendWhatsappMessage(alerts.join('\n'));
//         }
//     }
    
    
// }, 
// {
//     scheduled: true,
//     timezone: "Asia/Karachi"
// })

// Port for Express server
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
