// db.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new pool for PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});


// Add a new user to the database
export async function addUser(name, address, phone, city, country, language, thread_id) {
  const query = `
    INSERT INTO users (name, address, phone, city, country, language, thread_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  `;

  try {
    await pool.query(query, [name, address, phone, city, country, language, thread_id]);
    console.log('User added successfully');
  } catch (error) {
    console.error('Error: Could Not Add User.', error);
  }
}

// Add a new reading record to the database
export async function addReadingRecord(pH, nitrogen, phosphorus, potassium, temperature, moisture, conductivity, battery, user_id) {
  const query = `
    INSERT INTO readings (pH, nitrogen, phosphorus, potassium, temperature, moisture, conductivity, battery, user_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
  `;

  try {
    await pool.query(query, [pH, nitrogen, phosphorus, potassium, temperature, moisture, conductivity, battery, user_id]);
    console.log('Reading record added successfully');
  } catch (error) {
    console.error('Error: Could Not Add Reading Record.', error);
  }
}

// Get the latest 10 reading records
export async function get10ReadingRecords() {
  const query = `
    SELECT * FROM readings ORDER BY created_at DESC LIMIT 10
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error: Could Not Get Latest Readings.', error);
    return [];
  }
}

// Get the latest 10 reading records for a specific user
export async function get10ReadingRecordsByUserID(user_id) {
  const query = `
    SELECT * FROM readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
  `;

  try {
    const result = await pool.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    console.error('Error: Could Not Get Latest Readings by User ID.', error);
    return [];
  }
}

// Add a conversation (message) to the database
export async function addConversation(user_id, message, response) {
  const query = `
    INSERT INTO messages (user_id, message, response, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
  `;

  try {
    await pool.query(query, [user_id, message, response]);
    console.log('Conversation added successfully');
  } catch (error) {
    console.error('Error: Could Not Add Conversation.', error);
  }
}

// Get the language of a user by their user ID
export async function getLanguage(user_id) {
  const query = `
    SELECT language FROM users WHERE id = $1
  `;

  try {
    const result = await pool.query(query, [user_id]);
    if (result.rows.length > 0) {
      return result.rows[0].language;
    } else {
      return '';
    }
  } catch (error) {
    console.error('Error: Could Not Get User Language.', error);
    return '';
  }
}

// Get the thread ID and user ID by phone number
export async function getThreadID(phone) {
  const query = `
    SELECT thread_id, id FROM users WHERE phone = $1
  `;

  try {
    const result = await pool.query(query, [phone]);
    if (result.rows.length > 0) {
      const { thread_id, id } = result.rows[0];
      return { thread_id, id };
    } else {
      return { thread_id: '', id: '' };
    }
  } catch (error) {
    console.error('Error: Could Not Get User Thread.', error);
    return { thread_id: '', id: '' };
  }
}

// const {thread, id} = await getThreadID("923224661550")
// console.log(thread)
// console.log(id)