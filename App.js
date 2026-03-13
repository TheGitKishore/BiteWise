import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InitialLandingScreen          from './boundary/InitialLandingScreen';
import MainLandingScreen             from './boundary/MainLandingScreen';
import ViewPricingPlansScreen        from './boundary/ViewPricingPlansScreen';
import ViewUserProfileFeaturesScreen from './boundary/ViewUserProfileFeaturesScreen';
import ViewReviewsScreen             from './boundary/ViewReviewsScreen';
import CreateAccountScreen           from './boundary/CreateAccountScreen';
import LoginScreen                   from './boundary/LoginScreen';
import UserDashboardScreen           from './boundary/UserDashboardScreen';
import AccountSettingsScreen         from './boundary/AccountSettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="InitialLandingScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="InitialLandingScreen"   component={InitialLandingScreen} />
        <Stack.Screen name="MainLandingScreen"      component={MainLandingScreen} />
        <Stack.Screen name="ViewPricingPlansScreen" component={ViewPricingPlansScreen} />
        <Stack.Screen name="ProfilesScreen"         component={ViewUserProfileFeaturesScreen} />
        <Stack.Screen name="ReviewsScreen"          component={ViewReviewsScreen} />
        <Stack.Screen name="SignUpScreen"           component={CreateAccountScreen} />
        <Stack.Screen name="LoginScreen"            component={LoginScreen} />
        <Stack.Screen name="UserDashboardScreen"    component={UserDashboardScreen} />
        <Stack.Screen name="AccountSettingsScreen"  component={AccountSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
