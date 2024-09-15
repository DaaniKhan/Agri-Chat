// Import required packages using ESM syntax
import 'dotenv/config';  // Automatically loads the .env file
import { Sequelize, DataTypes, Model } from 'sequelize';

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_TYPE,
    port: process.env.DB_PORT
  }
);

// Define the User model
class User extends Model {}
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  address: DataTypes.STRING,
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  city: DataTypes.STRING,
  country: DataTypes.STRING,
  language: DataTypes.STRING,
  thread_id: DataTypes.STRING,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  }
}, { 
  sequelize, 
  modelName: 'User',
  tableName: 'users',
  timestamps: true, // Automatically manages createdAt and updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define the Message model
class Message extends Model {}
Message.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  message: DataTypes.STRING,
  response: DataTypes.STRING,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  }
}, {
  sequelize, 
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define the Reading model
class Reading extends Model {}
Reading.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  pH: DataTypes.FLOAT,
  nitrogen: DataTypes.FLOAT,
  phosphorus: DataTypes.FLOAT,
  potassium: DataTypes.FLOAT,
  temperature: DataTypes.FLOAT,
  moisture: DataTypes.FLOAT,
  conductivity: DataTypes.FLOAT,
  battery: DataTypes.FLOAT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW')
  }
}, {
  sequelize, 
  modelName: 'Reading',
  tableName: 'readings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define relationships
User.hasMany(Reading, { foreignKey: 'user_id', as: 'readings' });
Reading.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Message, { foreignKey: 'user_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'user_id' });

// Sync models with the database
(async () => {
  try {
    await sequelize.authenticate(); // Ensure database connection
    console.log("Database connection has been established successfully.");
    await sequelize.sync({ force: false }); // For development, set `force: true` to recreate tables
    console.log("Tables have been created");
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// (async () => {
//   try {
//     // Ensure the database connection
//     await sequelize.authenticate();
//     console.log("Database connection has been established successfully.");

//     // Drop the individual tables
//     await Message.drop();  // Drops the 'messages' table
//     await Reading.drop();  // Drops the 'readings' table
//     await User.drop();     // Drops the 'users' table
    

//     console.log("Tables dropped successfully.");
//   } catch (error) {
//     console.error("Unable to drop the tables:", error);
//   }
// })();
