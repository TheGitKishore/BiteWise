import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InitialLandingScreen          from './boundary/InitialLandingScreen';
import MainLandingScreen             from './boundary/MainLandingScreen';
import ViewPricingPlansScreen        from './boundary/ViewPricingPlansScreen';
import ViewUserProfileFeaturesScreen from './boundary/ViewUserProfileFeaturesScreen';
import ViewReviewsScreen             from './boundary/ViewReviewsScreen';
import CreateAccountScreen           from './boundary/CreateAccountScreen';
import LoginScreen                   from './boundary/LoginScreen';
import FreeUserDashboardScreen       from './boundary/FreeUserDashboardScreen';
import PremiumUserDashboardScreen    from './boundary/PremiumUserDashboardScreen';
import AccountSettingsScreen         from './boundary/AccountSettingsScreen';
import FoodTrackingLandingScreen     from './boundary/FoodTrackingLandingScreen';
import NutritionTargetsScreen        from './boundary/NutritionTargetsScreen';
import ActivityTrackingScreen        from './boundary/ActivityTrackingScreen';
import RecipesScreen                 from './boundary/RecipesScreen';
import SavedRecipesScreen            from './boundary/SavedRecipesScreen';
import MealPlansScreen               from './boundary/MealPlansScreen';
import CreateRecipeScreen            from './boundary/CreateRecipeScreen';
import DashboardRouter from './boundary/DashboardRouter';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="InitialLandingScreen"
        screenOptions={{ headerShown: false }}
      >
        {/* Sprint 1 */}
        <Stack.Screen name="InitialLandingScreen"         component={InitialLandingScreen} />
        <Stack.Screen name="MainLandingScreen"            component={MainLandingScreen} />
        <Stack.Screen name="ViewPricingPlansScreen"       component={ViewPricingPlansScreen} />
        <Stack.Screen name="ProfilesScreen"               component={ViewUserProfileFeaturesScreen} />
        <Stack.Screen name="ReviewsScreen"                component={ViewReviewsScreen} />
        <Stack.Screen name="SignUpScreen"                 component={CreateAccountScreen} />
        <Stack.Screen name="LoginScreen"                  component={LoginScreen} />
        <Stack.Screen name="DashboardRouter" component={DashboardRouter}/>
        <Stack.Screen name="FreeUserDashboardScreen"      component={FreeUserDashboardScreen} />
        <Stack.Screen name="PremiumUserDashboardScreen"   component={PremiumUserDashboardScreen} />
        <Stack.Screen name="AccountSettingsScreen"        component={AccountSettingsScreen} />

        {/* Sprint 2 */}
        <Stack.Screen name="FoodTrackingLandingScreen"    component={FoodTrackingLandingScreen} />
        <Stack.Screen name="NutritionTargetsScreen"       component={NutritionTargetsScreen} />
        <Stack.Screen name="ActivityTrackingScreen"       component={ActivityTrackingScreen} />

        {/* Sprint 3 */}
        <Stack.Screen name="RecipesScreen"                component={RecipesScreen} />
        <Stack.Screen name="SavedRecipesScreen"           component={SavedRecipesScreen} />
        <Stack.Screen name="MealPlansScreen"              component={MealPlansScreen} />
        <Stack.Screen name="CreateRecipeScreen"           component={CreateRecipeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
