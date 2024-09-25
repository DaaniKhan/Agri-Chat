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
export async function addUser(name, address, phone, city, country, language, thread_id, update_time) {
  const query = `
    INSERT INTO users (name, address, phone, city, country, language, thread_id, update_time, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  `;

  try {
    await pool.query(query, [name, address, phone, city, country, language, thread_id, update_time]);
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
export async function addConversation(user_id, message, response, actionable) {
  const query = `
    INSERT INTO messages (user_id, message, response, actionable, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `;

  try {
    await pool.query(query, [user_id, message, response, actionable]);
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
    SELECT thread_id, assistant_id, id FROM users WHERE phone = $1
  `;

  try {
    const result = await pool.query(query, [phone]);
    if (result.rows.length > 0) {
      const { thread_id, assistant_id, id } = result.rows[0];
      return { thread_id, assistant_id, id };
    } else {
      return { thread_id: '', assistant_id: '', id: '' };
    }
  } catch (error) {
    console.error('Error: Could Not Get User Thread.', error);
    return { thread_id: '', assistant_id: '', id: '' };
  }
}

// Function to update the update_time of a user by user_id
export async function updateUserTime(user_id, new_update_time) {
  const query = `
    UPDATE users
    SET update_time = $1, updated_at = NOW()
    WHERE id = $2
  `;

  try {
    const res = await pool.query(query, [new_update_time, user_id]);

    if (res.rowCount > 0) {
      console.log(`User ${user_id} update_time updated to ${new_update_time}`);
    } else {
      console.log(`User with id ${user_id} not found.`);
    }
  } catch (error) {
    console.error('Error: Could Not Update User update_time.', error);
  }
}

// Function to get the update_time of a user by user_id
export async function getUserUpdateTime(user_id) {
  const query = `
    SELECT update_time
    FROM users
    WHERE id = $1
  `;

  try {
    const res = await pool.query(query, [user_id]);

    if (res.rows.length > 0) {
      return res.rows[0].update_time;
    } else {
      console.log(`User with id ${user_id} not found.`);
      return null;
    }
  } catch (error) {
    console.error('Error: Could not fetch update_time.', error);
    return null;
  }
}

// Function to get the update_time for all users ordered by user_id
export async function getAllUserUpdateTimes() {
  const query = `
    SELECT update_time
    FROM users
    ORDER BY id ASC
  `;

  try {
    const res = await pool.query(query);

    if (res.rows.length > 0) {
      // Map the rows to extract the update_time values into an array
      return res.rows.map(row => row.update_time);
    } else {
      console.log('No users found.');
      return [];
    }
  } catch (error) {
    console.error('Error: Could not fetch update times.', error);
    return [];
  }
}

// Function to get user details by user_id
export async function getUserDetails(user_id) {
  const query = `
    SELECT id, name, address, phone, city, country, language, thread_id, assistant_id, update_time, gender, age, socioeconomic, TypeOfFarm, crop
    FROM users
    WHERE id = $1
  `;

  try {
    // Query the database to get user details
    const result = await pool.query(query, [user_id]);

    // Check if user exists and return details
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        user_id: user.id,
        name: user.name,
        address: user.address,
        phone: user.phone,
        city: user.city,
        country: user.country,
        language: user.language,
        thread_id: user.thread_id,
        assistant_id: user.assistant_id,
        update_time: user.update_time,
        gender: user.gender,
        age: user.age,
        socioeconomic: user.socioeconomic,
        TypeOfFarm: user.TypeOfFarm,
        crop: user.crop
      };
    } else {
      return `No user found with ID ${user_id}`;
    }
  } catch (error) {
    console.error('Error: Could not retrieve user details.', error);
    return `Error: Could not retrieve user details. Exception: ${error.message}`;
  }
}
