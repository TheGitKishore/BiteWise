// server.js
import express from 'express';
import cors from 'cors';
import userRoute from './routes/usersroute.js'; // <-- note the .js extension (add files from routes folder)
import reviewRoute from './routes/reviewroute.js';
import membershipplanRoute from './routes/membershipplanroute.js';
import userprofiletypeRoute from './routes/userprofiletyperoute.js';
import foodintakeentryRoute from './routes/foodintakeentryroute.js';
import fooditemRoute from './routes/fooditemroute.js';
import exerciseentryRoute from './routes/exerciseentryroute.js';
import mealplanRoute from './routes/mealplanroute.js';
import recipeRoute from './routes/reciperoute.js';
import weightentryRoute from './routes/weightentryroute.js';
import heightentryRoute from './routes/heightentryroute.js';
import healthgoalRoute from './routes/healthgoalroute.js';
import foodRoute from './routes/foodroute.js';
import diaryentryRoute from './routes/diaryentryroute.js';
import uploadRoute from './routes/uploadroute.js';
import grocerylistRoute from './routes/grocerylistroute.js';
import curatorapplicationRoute from './routes/curatorapplicationroute.js';

// ? ADD THIS
import { initializeDatabases } from './routes/apiroute.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/membership-plans', membershipplanRoute);
app.use('/api/user-profile-types', userprofiletypeRoute);
app.use('/api/food-entries', foodintakeentryRoute);
app.use('/api/food-items', fooditemRoute);
app.use('/api/exercise-entries', exerciseentryRoute);
app.use('/api/meal-plans', mealplanRoute);
app.use('/api/recipes', recipeRoute);
app.use('/api/weight-entries', weightentryRoute);
app.use('/api/height-entries', heightentryRoute);
app.use('/api/health-goals', healthgoalRoute);
app.use('/api/food-api', foodRoute);
app.use('/api/diary-entries', diaryentryRoute);
app.use('/api/uploads', uploadRoute);
app.use('/api/grocery-lists', grocerylistRoute);
app.use('/api/curator-applications', curatorapplicationRoute);

// ? Initialize DB before server starts
const startServer = async () => {
  try {
    await initializeDatabases();   // ?? THIS IS WHAT YOU WERE MISSING

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
