// server.js
import express from 'express';
import cors from 'cors';
import userRoute from './routes/usersroute.js'; // <-- note the .js extension (add files from routes folder)
import reviewRoute from './routes/reviewroute.js';
import membershipplanRoute from './routes/membershipplanroute.js';
import userprofiletypeRoute from './routes/userprofiletyperoute.js';
import foodRoute from './routes/foodroute.js';

// ✅ ADD THIS
import { initializeDatabases } from './backend_services/api.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/membership-plans', membershipplanRoute);
app.use('/api/user-profile-types', userprofiletypeRoute);
app.use('/api/food', foodRoute);

// ✅ Initialize DB before server starts
const startServer = async () => {
  try {
    //await initializeDatabases();   // 🔥 THIS IS WHAT YOU WERE MISSING

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
  }
};


startServer();