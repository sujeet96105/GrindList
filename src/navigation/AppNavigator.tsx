import React from 'react';
import { DefaultTheme, NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { TodayScreen } from '../screens/TodayScreen';
import { AllTasksScreen } from '../screens/AllTasksScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CreateTaskScreen } from '../screens/CreateTaskScreen';
import { EditTaskScreen } from '../screens/EditTaskScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { useTheme } from '../theme';
import { RootStackParamList } from './types';
import { strings } from '../i18n/strings';

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors } = useTheme();

  const navTheme: NavTheme = {
    ...DefaultTheme,
    dark: colors.background === '#000000',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{ headerShown: true, title: 'New Task' }}
        />
        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{ headerShown: true, title: 'Edit Task' }}
        />
        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{ headerShown: true, title: 'Task Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TabsNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name={strings.today} component={TodayScreen} />
      <Tab.Screen name={strings.allTasks} component={AllTasksScreen} />
      <Tab.Screen name={strings.focus} component={FocusScreen} />
      <Tab.Screen name={strings.insights} component={InsightsScreen} />
      <Tab.Screen name={strings.settings} component={SettingsScreen} />
    </Tab.Navigator>
  );
}
