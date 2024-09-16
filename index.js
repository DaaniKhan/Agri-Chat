// Import express and node-cron using ES module syntax
import express from 'express';
import cron from 'node-cron';
import axios from "axios";
import dotenv from 'dotenv';
import { addReadingRecord, addUser, get10ReadingRecords, getLanguage, addConversation, getThreadID, get10ReadingRecordsByUserID } from './db_controller.js';  // Your database operations
import { format } from 'date-fns';

// Initialize Express
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Railway Cron Job Server with Multiple Jobs');
});

// Cron Job
async function sendWhatsappMessage(phone_number, message) {
    const url = 'https://graph.facebook.com/v20.0/304854782718986/messages';  // Add the WhatsApp API URL
    const headers = {
        'Authorization': 'Bearer EAAGI94sqL8oBOZBp1yIJav1h1OCz5ZBXeDuLOyAzREBKq5ZCudKZC7z5BOjKzvLlPK4ALBVbmnoCcZCkan6T6dlLPfOI9wvswWTXCf9jWyais3oWRhLRt4Sa26KavTdYw4nurzcQ8wmxak4MxwtFZAY8fONzP3gehh1NZCsYzCRPcVZC3lZCL5qVSuWEu',  // Add your authorization token here
        'Content-Type': 'application/json'
    };

    const data = {
        messaging_product: 'whatsapp',
        to: phone_number,
        recipient_type: 'individual',
        type: 'text',
        text: {
            preview_url: false,
            body: message
        }
    };

    try {
        const response = await axios.post(url, data, { headers });

        if (response.status === 200) {
            const responseData = response.data;
            if (responseData.error) {
                console.log(`Request failed: ${responseData.error}`);
            } else {
                console.log('Request successful!');
                console.log(responseData);
            }
        } else {
            console.log(`Request failed with status code ${response.status}`);
            console.log(response.data);
        }
    } catch (error) {
        console.error(`Error occurred: ${error.message}`);
    }
}

let daily_update_time = ""

cron.schedule(`* * * * *`, () => {
    daily_update_time = "40"
    console.log("Updated Time")
}, 
{
    scheduled: true,
    timezone: "Asia/Karachi"
})

cron.schedule(`${daily_update_time} 11 * * *`, () => {
    dotenv.config();

    const API_KEY = process.env.OPENAI_API_KEY;

    // OpenAI Client setup (using axios for API requests)
    const OPENAI_CLIENT = axios.create({
        baseURL: 'https://api.openai.com/v1/',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    // Main function to send daily update
    async function sendDailyUpdate(phone) {
        try {
            const { thread_id, id } = await getThreadID(phone);
            const user_id = id
            const language = await getLanguage(user_id);

            // Fetch reading records based on user_id
            let records = [];
            if (user_id === 1 || user_id === 4) {
                records = await get10ReadingRecords();
            } else {
                records = await get10ReadingRecordsByUserID(user_id);
            }

            let formattedRecords = [];
            if (records){
                formattedRecords = records.map(record => (
                    `ID: ${record.id}, User ID: ${record.user_id}, pH: ${record.pH} pH, Nitrogen: ${record.nitrogen} mg/kg, Phosphorus: ${record.phosphorus} mg/kg, Potassium: ${record.potassium} mg/kg, Temperature: ${record.temperature} ℃, Moisture: ${record.moisture}%, Conductivity: ${record.conductivity} us/cm, Battery: ${record.battery}%, Created At: ${record.created_at}, Updated At: ${record.updated_at}`
                )).join('\n');
            }

            const currentDate = format(new Date(), 'yyyy-MM-dd');

            // Define profiles based on user_id
            let profile = '';
            if (user_id === 1 || user_id === 3 || user_id === 4) {
                profile = "A meticulous and detail-oriented individual, she holds a PhD in Computer Science with a specialization in Human-Computer Interaction. She is an instructor at a prestigious university and applies her rigorous academic mindset to her home farming activities. Growing blackberries in DHA, Lahore, Punjab, Pakistan, she dedicates daily attention to her crop, striving for the highest quality. Her interest in innovative techniques aligns with her commitment to successful and sustainable farming practices. Given her preference for efficiency, she values concise, 2-3 line responses from a chatbot to quickly address her queries and needs. She specifically seeks brief but actionable advice that she can put into practice, ensuring her time is used effectively";
            } else if (user_id === 2) {
                profile = "Prepare a message for a 45-year-old female from a low socio-economic background...";
            }

            const system_prompt = `
                You are an intelligent agricultural assistant designed to help users monitor and manage their crops effectively. Users will provide you with sensor data like moisture, temperature, electrical conductivity, pH, nitrogen (N), phosphorus (P), and potassium (K) levels for their field. They'll also let you know what crop they are growing, such as wheat, corn, or tomatoes.

                When a user asks about the status of their crop, follow these steps:

                1. First, recognize the specific crop the user mentions, such as wheat or corn.
                2. Then, use the optimal ranges for that crop for each of the provided data points (moisture, temperature, electrical conductivity, pH, N, P, K).
                3. Compare the user's sensor data with these optimal ranges. Point out where the data is within the ideal range and where it isn't.
                4. If everything is within the optimal range, let the user know their crop is in good condition. If some readings are outside the ideal range, explain what this might mean for their crop’s health and suggest how they can fix it.

                When responding, structure your answer like this:
                - Start with a summary of the overall condition of the crop.
                - Follow up with a detailed comparison for each sensor reading. Let the user know if each value is too high, too low, or just right.
                - Finally, give them advice on what they can do to improve any problematic readings.

                For example:
                - "Your wheat crop is currently in good condition."
                - "The soil moisture is optimal compared to the ideal range for wheat (20-30%). This is great for growth."
                - "However, the temperature is a little low at 12°C, which is below the ideal range for wheat (15-25°C). This could slow down development."
                - "The pH is within range, nitrogen levels are low, and potassium is slightly higher than recommended."

                If the values are off, provide practical advice, like adjusting irrigation, adding fertilizers, or balancing soil nutrients.

                Your goal is to give clear, helpful, and actionable advice so that users can make informed decisions about their crops.
                `


            // Send request to OpenAI to get the status
            const messageResponse = await OPENAI_CLIENT.post('/chat/completions', {
                model: 'gpt-4',
                messages: [
                    { role: "system", content: system_prompt + `\nThe date today is ${currentDate}.\nUser profile: ${profile}.\nThe user's farmland has the following record: ${formattedRecords}`},
                    { role: "user", content: "What is the status of my plant?" }
                ]
            });
            console.log("here")

            const response = messageResponse.data.choices[0].message.content;


            console.log(`Users Language: ${language}`);
            if (language === "English") {
                console.log(`\nResponse:\n${response}`);

                // Log the conversation in the database
                await addConversation(user_id, "daily update", response);

                await sendWhatsappMessage(phone, response);
                return { user_prompt: 'daily update', original_response: response, IOT_Rows: records };
            } else {
                // Translate response to the user's preferred language
                const translationResponse = await OPENAI_CLIENT.post('/chat/completions', {
                    model: 'gpt-4',
                    messages: [
                        { role: "system", content: `Please translate the following message to ${language}.` },
                        { role: "user", content: response }
                    ]
                });

                const translatedResponse = translationResponse.data.choices[0].message.content;
                console.log(`\nTranslated Response:\n${translatedResponse}`);
                // Log the conversation in the database
                await addConversation(user_id, "daily update", translatedResponse);
                await sendWhatsappMessage(phone, translatedResponse);

                return { user_prompt: 'daily update', original_response: translatedResponse, IOT_Rows: records };
            }
        } catch (error) {
            console.log('Error sending daily update:', error.message);
            return { message: 'failure getting latest message' };
        }
    }

    // Example function call
    sendDailyUpdate("923224661550");
    sendDailyUpdate("923200006080");
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
