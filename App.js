import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InitialLandingScreen   from './boundary/InitialLandingScreen';
import MainLandingScreen      from './boundary/MainLandingScreen';
import ViewPricingPlansScreen from './boundary/ViewPricingPlansScreen';
import ViewUserProfileFeaturesScreen from './boundary/ViewUserProfileFeaturesScreen';
import ViewReviewsScreen             from './boundary/ViewReviewsScreen';


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
        <Stack.Screen name="ProfilesScreen" component={ViewUserProfileFeaturesScreen} />
        <Stack.Screen name="ReviewsScreen"  component={ViewReviewsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}