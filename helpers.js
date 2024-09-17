import axios from "axios";
import OpenAI from 'openai';
import { addReadingRecord, addUser, get10ReadingRecords, getLanguage, addConversation, getThreadID, get10ReadingRecordsByUserID } from './db_controller.js';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Main function to send daily update
export async function sendDailyUpdate(phone) {
    try {
        dotenv.config();

        console.log(process.env.OPENAI_API_KEY)
        const client = new OpenAI();
        
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
            You are an agricultural assistant designed to help users monitor and manage their crops effectively. Users will provide sensor data like moisture, temperature, electrical conductivity, pH, nitrogen (N), phosphorus (P), and potassium (K) levels, along with the crop they're growing, such as wheat, corn, or tomatoes.

            When a user asks about the status of their crop, follow these steps:

            1. Identify the crop mentioned.
            2. Compare the sensor data provided by the user with the optimal ranges for that crop.
            3. Keep the response conversational and natural. Avoid using technical formatting like bullet points or lists. Focus on explaining the data in an easy-to-read, human tone.

            Give an overall summary first, then briefly explain any key points that need attention. Keep it friendly and concise. Use natural language, just like you’re having a conversation.

            For example:
            - "Your blackberry crop is showing some minor issues. The temperature is slightly higher than ideal, which may stress the plants. Try using shade nets. The soil moisture is also on the higher side, so you might want to cut back on irrigation. Nutrient levels are all fine though, so great job there!"
            - "The temperature and moisture levels are a bit too high for your wheat crop. This might cause some stress, so consider adjusting watering and providing more shade. On the bright side, the nitrogen and pH levels look good, so keep up the good work there."

            Make sure to focus on key points without over-explaining. Keep the response to around 4-5 sentences.
            ` 



        // Send request to OpenAI to get the status
        
        const messageResponse = await client.chat.completions.create({
            model: 'gpt-4o', 
            messages: [
                {
                    role: "system",
                    content: `${system_prompt}\nThe date today is ${currentDate}.\nUser profile: ${profile}.\nThe user's farmland has the following record: ${formattedRecords}`
                },
                {
                    role: "user",
                    content: "What is the status of my plant?"
                }
            ]
        });

        // Access the completion response
        const response = messageResponse.choices[0].message.content

        console.log(`Users Language: ${language}`);
        if (language === "English") {
            console.log(`\nResponse:\n${response}`);

            // Log the conversation in the database
            await addConversation(user_id, "daily update", response, "False");

            await sendWhatsappMessage(phone, response);
            return { user_prompt: 'daily update', original_response: response, IOT_Rows: records };
        } else {
            // Translate response to the user's preferred language
            // const translationResponse = await OPENAI_CLIENT.post('/chat/completions', {
            //     model: 'gpt-4o',
            //     messages: [
            //         { role: "system", content: `Please translate the following message to ${language}.` },
            //         { role: "user", content: response }
            //     ]
            // });

            const translationResponse = await client.chat.completions.create({
                model: 'gpt-4o', 
                messages: [
                    {
                        role: "system",
                        content: `Please translate the following message to ${language}.`
                    },
                    {
                        role: "user",
                        content: `${response}`
                    }
                ]
            });
    
            // Access the completion response
            const translatedResponse = translationResponse.choices[0].message.content;

            console.log(`\nTranslated Response:\n${translatedResponse}`);
            // Log the conversation in the database
            await addConversation(user_id, "daily update", translatedResponse, "False");
            await sendWhatsappMessage(phone, translatedResponse);

            return { user_prompt: 'daily update', original_response: translatedResponse, IOT_Rows: records };
        }
    } catch (error) {
        console.log('Error sending daily update:', error.message);
        return { message: 'failure getting latest message' };
    }
}

export async function sendWhatsappMessage(phone_number, message) {
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