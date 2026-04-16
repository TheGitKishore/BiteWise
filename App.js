import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Sprint 1 ────────────────────────────────────────────────────────────────
import InitialLandingScreen          from './boundary/InitialLandingScreen';
import MainLandingScreen             from './boundary/MainLandingScreen';
import ViewPricingPlansScreen        from './boundary/ViewPricingPlansScreen';
import ViewUserProfileFeaturesScreen from './boundary/ViewUserProfileFeaturesScreen';
import ViewReviewsScreen             from './boundary/ViewReviewsScreen';
import CreateAccountScreen           from './boundary/CreateAccountScreen';
import LoginScreen                   from './boundary/LoginScreen';
import FreeUserDashboardScreen       from './boundary/FreeUserDashboardScreen';
import UserDashboardScreen           from './boundary/UserDashboardScreen';
import PremiumUserDashboardScreen    from './boundary/PremiumUserDashboardScreen';
import AccountSettingsScreen         from './boundary/AccountSettingsScreen';

// ─── Sprint 2 ────────────────────────────────────────────────────────────────
import FoodTrackingLandingScreen     from './boundary/FoodTrackingLandingScreen';
import NutritionTargetsScreen        from './boundary/NutritionTargetsScreen';
import ActivityTrackingScreen        from './boundary/ActivityTrackingScreen';

// ─── Sprint 3 ────────────────────────────────────────────────────────────────
import RecipesScreen                 from './boundary/RecipesScreen';
import SavedRecipesScreen            from './boundary/SavedRecipesScreen';
import MealPlansScreen               from './boundary/MealPlansScreen';
import CreateRecipeScreen            from './boundary/CreateRecipeScreen';
import DashboardRouter               from './boundary/DashboardRouter';

// ─── Sprint 4 ────────────────────────────────────────────────────────────────
import ReportsScreen                 from './boundary/ReportsScreen';
import WeightTrackingScreen          from './boundary/WeightTrackingScreen';
import CuratorProgramScreen          from './boundary/CuratorProgramScreen';
import WriteReviewScreen             from './boundary/WriteReviewScreen';
import MyRecipesScreen               from './boundary/MyRecipesScreen';

// ─── Sprint 5 ────────────────────────────────────────────────────────────────
import DiaryScreen                   from './boundary/DiaryScreen';
import GroceryListScreen             from './boundary/GroceryListScreen';
import CuratorDashboardScreen        from './boundary/CuratorDashboardScreen';
import EditCuratorRecipeScreen       from './boundary/EditCuratorRecipeScreen';
import AdminLoginScreen              from './boundary/AdminLoginScreen';
import AdminDashboardScreen          from './boundary/AdminDashboardScreen';


// ─── Sprint 6 ────────────────────────────────────────────────────────────────
import BlogPostsScreen               from './entity/BlogPostsScreen';
import EditBlogPostScreen            from './boundary/EditBlogPostScreen';
import CuratorBlogsScreen            from './boundary/CuratorBlogsScreen';
import MindfulSnackingScreen         from './boundary/MindfulSnackingScreen';
import FoodAlternativesScreen        from './boundary/FoodAlternativesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="InitialLandingScreen"
        screenOptions={{ headerShown: false }}
      >
        {/* ── Sprint 1 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="InitialLandingScreen"         component={InitialLandingScreen} />
        <Stack.Screen name="MainLandingScreen"            component={MainLandingScreen} />
        <Stack.Screen name="ViewPricingPlansScreen"       component={ViewPricingPlansScreen} />
        <Stack.Screen name="ProfilesScreen"               component={ViewUserProfileFeaturesScreen} />
        <Stack.Screen name="ReviewsScreen"                component={ViewReviewsScreen} />
        <Stack.Screen name="SignUpScreen"                 component={CreateAccountScreen} />
        <Stack.Screen name="LoginScreen"                  component={LoginScreen} />
        <Stack.Screen name="DashboardRouter"              component={DashboardRouter} />
        <Stack.Screen name="FreeUserDashboardScreen"      component={FreeUserDashboardScreen} />
        <Stack.Screen name="UserDashboardScreen"          component={UserDashboardScreen} />
        <Stack.Screen name="PremiumUserDashboardScreen"   component={PremiumUserDashboardScreen} />
        <Stack.Screen name="AccountSettingsScreen"        component={AccountSettingsScreen} />

        {/* ── Sprint 2 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="FoodTrackingLandingScreen"    component={FoodTrackingLandingScreen} />
        <Stack.Screen name="NutritionTargetsScreen"       component={NutritionTargetsScreen} />
        <Stack.Screen name="ActivityTrackingScreen"       component={ActivityTrackingScreen} />

        {/* ── Sprint 3 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="RecipesScreen"                component={RecipesScreen} />
        <Stack.Screen name="SavedRecipesScreen"           component={SavedRecipesScreen} />
        <Stack.Screen name="MealPlansScreen"              component={MealPlansScreen} />
        <Stack.Screen name="CreateRecipeScreen"           component={CreateRecipeScreen} />

        {/* ── Sprint 4 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="ReportsScreen"                component={ReportsScreen} />
        <Stack.Screen name="WeightTrackingScreen"         component={WeightTrackingScreen} />
        <Stack.Screen name="CuratorProgramScreen"         component={CuratorProgramScreen} />
        <Stack.Screen name="WriteReviewScreen"            component={WriteReviewScreen} />
        <Stack.Screen name="MyRecipesScreen"              component={MyRecipesScreen} />

        {/* ── Sprint 5 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="DiaryScreen"                  component={DiaryScreen} />
        <Stack.Screen name="GroceryListScreen"            component={GroceryListScreen} />
        <Stack.Screen name="CuratorDashboardScreen"       component={CuratorDashboardScreen} />
        <Stack.Screen name="EditCuratorRecipeScreen"      component={EditCuratorRecipeScreen} />
        <Stack.Screen name="AdminLoginScreen"             component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboardScreen"         component={AdminDashboardScreen} />

        {/* ── Sprint 6 ─────────────────────────────────────────────────── */}
        <Stack.Screen name="BlogPostsScreen"              component={BlogPostsScreen} />
        <Stack.Screen name="EditBlogPostScreen"           component={EditBlogPostScreen} />
        <Stack.Screen name="CuratorBlogsScreen"           component={CuratorBlogsScreen} />
        <Stack.Screen name="MindfulSnackingScreen"        component={MindfulSnackingScreen} />
        <Stack.Screen name="FoodAlternativesScreen"       component={FoodAlternativesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
