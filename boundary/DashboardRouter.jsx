import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import PremiumUserDashboardScreen from './PremiumUserDashboardScreen';
import FreeUserDashboardScreen from './FreeUserDashboardScreen';
import UserController from '../controller/UserController';

const controller = new UserController();

const DashboardRouter = ({ navigation, route }) => {
  const initialUser = route.params?.user;
  const [user, setUser] = useState(initialUser);

  const refreshUser = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const result = await controller.getUser(user.userId);
      const updatedUser = result?.data || result?.user;

      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err) {
      console.log("Router refresh failed:", err);
    }
  }, [user?.userId]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  if (user?.role === 'premium') {
    return <PremiumUserDashboardScreen navigation={navigation} route={{ ...route, params: { user } }} />;
  }

  return <FreeUserDashboardScreen navigation={navigation} route={{ ...route, params: { user } }} />;
};

export default DashboardRouter;