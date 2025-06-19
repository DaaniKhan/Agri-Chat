# 🌾 Daily Update Scheduler — Kissan Dost 🌤️

This Node.js/Express server is a **cron-based job scheduler** that sends daily personalized agriculture updates to users via **WhatsApp**, powered by OpenAI GPT-4o and IoT sensor readings.

It complements the [`Kissan Dost`](https://github.com/Saad4858/Pandas) FastAPI backend by running independently and handling time-based messaging.

---

## 📦 Features

- 🕑 Sends **personalized crop health summaries** daily at user-specific times
- 🌐 Supports **multi-language** responses based on user preferences
- 📈 Uses **sensor data** (moisture, pH, NPK, etc.) to evaluate crop conditions
- 💬 Delivered directly to farmers via **WhatsApp Cloud API**
- 🔁 Automatically updates cron jobs daily using dynamic DB values

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/DaaniKhan/Agri-Chat.git
cd Agri-Chat
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create `.env` File

Set up your environment variables for DB and API access:

```env
# PostgreSQL DB
DB_NAME=kissanDost
DB_USER=youruser
DB_PASS=yourpassword
DB_HOST=localhost
DB_PORT=your_port
DB_TYPE=postgres

# OpenAI
OPENAI_API_KEY=your_api_key

# WhatsApp
WHATSAPP_BEARER=your_api_key
```

---

## 🧠 How It Works

### ⏱️ Scheduling Logic

- Uses `node-cron` to schedule messages at the time specified in each user’s `update_time` column (stored in the PostgreSQL DB).
- Every night at **midnight**, it re-reads all `update_time` values and dynamically **reschedules** jobs.

### 🔁 Daily Update Flow

1. Fetch sensor readings for each user.
2. Generate GPT-4o response via OpenAI API based on those readings.
3. Translate response (if needed).
4. Send the update via WhatsApp API.
5. Log the message in the `messages` DB table.

---

## ▶️ Running the Server

```bash
node index.js
```
Locally: 
- The server runs on [http://localhost:3000](http://localhost:3000)
- You will see logs for scheduling and message dispatches

> ✅ **Make sure your DB (used by the main FastAPI app) is running and accessible.**

---

## 📇 Adding Phone Numbers

Update the `phone_numbers` array in `index.js` to link user IDs with WhatsApp phone numbers:

```js
let phone_numbers = [
  '923xxxxxxxx1',
  '923xxxxxxxx2',
  ...
];
```

> 📌 Phone numbers are indexed by `user_id - 1`, so ensure proper ordering.
> You will first have to configure WhatsApp using its own services and register the numbers over there.

---

## 📂 Folder Structure

```bash
.
├── db.js                # Sequelize DB connection
├── db_controller.js     # PostgreSQL read/write logic
├── db_schema.js         # Sequelize model definitions
├── helpers.js           # OpenAI logic, message formatting
├── daily_updates.js     # Triggering logic for updates
├── index.js             # Express server & cron scheduler
└── .env                 # Your environment variables
```

---

## 🙌 Credits

- 💡 Built as part of the **Kissan-Dost** ecosystem. ([`Kissan Dost`](https://github.com/Saad4858/Pandas)), (['Agri-Dash'](https://github.com/DaaniKhan/Agri-Dash))
- 🤖 GPT-4o integration by [OpenAI](https://openai.com)
- 📡 Messaging via [Meta's WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp)