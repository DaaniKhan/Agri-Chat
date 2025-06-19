import axios from "axios";
import OpenAI from 'openai';
import { addReadingRecord, addUser, get10ReadingRecords, getLanguage, addConversation, getThreadID, get10ReadingRecordsByUserID, get10EquallySpacedReadings, getUserDetails } from './db_controller.js';
import { format } from 'date-fns';
import dotenv from 'dotenv';

// Main function to send daily update
export async function sendDailyUpdate(phone) {
    try {
        dotenv.config();

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        console.log(`Users phone: ${phone}`);
        
        const { thread_id, assistant_id, id } = await getThreadID(phone);
        const user_id = id
        const language = await getLanguage(user_id);

        // Fetch reading records based on user_id
        let records = [];

        records = await get10ReadingRecords()

        let formattedRecords = [];
        if (records){
            formattedRecords = records.map(record => (
                `ID: ${record.id}, User ID: ${record.user_id}, pH: ${record.pH} pH, Nitrogen: ${record.nitrogen} mg/kg, Phosphorus: ${record.phosphorus} mg/kg, Potassium: ${record.potassium} mg/kg, Temperature: ${record.temperature} ℃, Moisture: ${record.moisture}%, Conductivity: ${record.conductivity} us/cm, Battery: ${record.battery}%, Created At: ${record.created_at}, Updated At: ${record.updated_at}`
            )).join('\n');
        }

        const currentDate = format(new Date(), 'yyyy-MM-dd');

        const system_prompt = ` 
            You are an agricultural assistant designed to help users monitor and manage their crops effectively. Users will provide sensor data like moisture, temperature, electrical conductivity, pH, nitrogen (N), phosphorus (P), and potassium (K) levels, along with the crop they're growing, such as wheat, corn, or tomatoes.

            When a user asks about the status of their crop, follow these steps:

            1. Identify the crop mentioned.
            2. Compare the sensor data provided by the user with the optimal ranges for that crop.
            3. Keep the response conversational and natural. Avoid using technical formatting like bullet points or lists. Focus on explaining the data in an easy-to-read, human tone.

            Give an overall summary first, then briefly explain any key points that need attention. Keep it friendly and concise. Use natural language, just like you’re having a conversation.

            For example:
            - "Your crop is showing some minor issues. The temperature is slightly higher than ideal, which may stress the plants. Try using shade nets. The soil moisture is also on the higher side, so you might want to cut back on irrigation. Nutrient levels are all fine though, so great job there!"
            - "The temperature and moisture levels are a bit too high for your wheat crop. This might cause some stress, so consider adjusting watering and providing more shade. On the bright side, the nitrogen and pH levels look good, so keep up the good work there."

            Make sure to focus on key points without over-explaining. Keep the response to around 3-4 sentences.
            ` 



        // Send request to OpenAI to get the status
        
        const details = await getUserDetails(user_id)

        const messageResponse = await client.chat.completions.create({
            model: 'gpt-4o', 
            messages: [
                {
                    role: "system",
                    content: `${system_prompt}\nThe date today is ${currentDate}.\nThe User is growing ${details['crop']}.\nThe user's farmland has the following record: ${formattedRecords}.`
                },
                {
                    role: "user",
                    content: "What is the status of my crop?"
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
            
            const translationResponse = await client.chat.completions.create({
                model: 'gpt-4o', 
                messages: [
                    {
                        role: "system",
                        content: `Please translate the following message to ${language} for the user. Do not make any changes to the message itself. You are a translation model that only translates the text provided. Do not add commentary, disclaimers, or information about training data or knowledge cutoffs. Return only the translated text.`
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
        console.log(error)
        return { message: 'failure getting latest message' };
    }
}

export async function sendWhatsappMessage(phone_number, message) {
    dotenv.config();
    
    const url = 'https://graph.facebook.com/v20.0/304854782718986/messages';  // Add the WhatsApp API URL
    const headers = {
        'Authorization': process.env.WHATSAPP_BEARER,  // Add your authorization token here
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


export async function sendSensorReadings(phone) {
    try {
        dotenv.config();

        const OPENAI_CLIENT = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Fetch thread and user details
        const { thread_id, assistant_id, user_id } = getThreadID(phone);
        console.log(`Thread: ${thread_id} Assistant: ${assistant_id} User: ${user_id}`);

        // Fetch user language (if needed)
        const language = getLanguage(user_id);

        let records = "";

        // Temporary condition for specific users
        if (user_id === 2 || user_id === 3) {
            records = get10ReadingRecords(); // Fetch all sensor data for users 2 or 3
        } else {
            records = get10ReadingRecordsByUserID(user_id); // Fetch user-specific sensor data
        }

        // Format records
        const formatted_records = records.map(record => 
            `ID: ${record.id}, User ID: ${record.user_id}, pH: ${record.pH} pH, Nitrogen: ${record.nitrogen} mg/kg, ` +
            `Phosphorus: ${record.phosphorus} mg/kg, Potassium: ${record.potassium} mg/kg, Temperature: ${record.temperature} ℃, ` +
            `Moisture: ${record.moisture}%, Conductivity: ${record.conductivity} us/cm, Battery: ${record.battery}%, ` +
            `Created At: ${record.created_at}, Updated At: ${record.updated_at}`
        );


        const final_records = formatted_records.join("\n");

        const details = await getUserDetails(user_id)

        const message = await OPENAI_CLIENT.beta.threads.messages.create({
            thread_id: thread_id,
            role: "user",
            content: "Here are my latest Field Sensor Readings" +
            `\n The plant being grown is ${details['crop']}.\n` +
            `Readings:\n${final_records}.`
        });

        // Use OpenAI client to create and poll a thread run
        const run = await OPENAI_CLIENT.beta.threads.runs.create_and_poll({
            thread_id: thread_id,
            assistant_id: assistant_id,
            instructions: `You are a helpful assistant with great knowledge of agriculture. Your responses are brief, clear, and to the point (maximum of two to three sentences). Avoid unnecessary technical jargon, but keep advice actionable and relatable.`
        });

        let response = "";

        if (run.status === 'completed') {
            // Fetch messages from OpenAI thread
            const messages = await OPENAI_CLIENT.beta.threads.messages.list({
                thread_id: thread_id
            });

            response = messages.data[0].content[0].text.value;
            console.log(response);

            // Save the conversation in the database
            addConversation(user_id, user_prompt, response, follow_up);
        } else {
            console.log(run.status);
            return {
                user_prompt: 'No response from the assistant',
                original_response: 'No response from the assistant',
                context: 'No response from the assistant',
                'IOT Rows': 'No response from the assistant'
            };
        }
    } catch (error) {
        console.error("Error handling request: ", error);
        return {
            user_prompt: 'Error occurred',
            original_response: 'Error occurred',
            context: 'Error occurred',
            'IOT Rows': 'Error occurred'
        };
    }
}