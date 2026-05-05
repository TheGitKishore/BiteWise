// server.js
import 'dotenv/config';
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
import smartEatingContentRoute from './routes/smarteatingcontentroute.js';
import diaryentryRoute from './routes/diaryentryroute.js';
import uploadRoute from './routes/uploadroute.js';
import grocerylistRoute from './routes/grocerylistroute.js';
import curatorapplicationRoute from './routes/curatorapplicationroute.js';
import adminRoutes from './routes/adminroute.js';
import healthReportRoute from './routes/healthreportroute.js';
import blogPostRoute from './routes/blogpostroute.js';
import recipedraftRoute from './routes/recipedraftroute.js';
import nutritiontargetsRoute from './routes/nutritiontargetsroute.js';
import dineoutRoute from './routes/dineoutroute.js';
import curatorprofileRoute from './routes/curatorprofileroute.js';


// ? ADD THIS
import { initializeDatabases } from './routes/apiroute.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

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
app.use('/api/food-api/smart-eating', smartEatingContentRoute);
app.use('/api/diary-entries', diaryentryRoute);
app.use('/api/uploads', uploadRoute);
app.use('/api/grocery-lists', grocerylistRoute);
app.use('/api/curator-applications', curatorapplicationRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/health-reports', healthReportRoute);
app.use('/api/blog-posts', blogPostRoute);
app.use('/api/recipe-drafts', recipedraftRoute);
app.use('/api/nutrition-targets', nutritiontargetsRoute);
app.use('/api/dine-out', dineoutRoute);
app.use('/api/curator-profiles', curatorprofileRoute);

// ? Initialize DB before server starts
const startServer = async () => {
  try {
    await initializeDatabases();   // ?? THIS IS WHAT YOU WERE MISSING

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
