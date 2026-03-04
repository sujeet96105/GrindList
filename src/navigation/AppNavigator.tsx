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
import { strings } from '../i18n/strings';
import { useTheme } from '../theme';
import { AppStackParamList } from './types';

import TodayIcon from '../assests/icons/today.svg';
import AllTasksIcon from '../assests/icons/all-task.svg';
import FocusIcon from '../assests/icons/focus.svg';
import InsightsIcon from '../assests/icons/insights.svg';
import SettingsIcon from '../assests/icons/settings.svg';
enableScreens();

const Tab = createBottomTabNavigator();
const AppStack = createNativeStackNavigator<AppStackParamList>();
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
      <AppStackNavigator />
    </NavigationContainer>
  );
}
function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={TabsNavigator} />
      <AppStack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ headerShown: true, title: 'New Task' }}
      />
      <AppStack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ headerShown: true, title: 'Edit Task' }}
      />
      <AppStack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
        options={{ headerShown: true, title: 'Task Details' }}
      />
    </AppStack.Navigator>
  );
}



function TabsNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const props = { width: size, height: size, color };
          switch (route.name) {
            case strings.today:
              return <TodayIcon {...props} />;
            case strings.allTasks:
              return <AllTasksIcon {...props} />;
            case strings.focus:
              return <FocusIcon {...props} />;
            case strings.insights:
              return <InsightsIcon {...props} />;
            case strings.settings:
              return <SettingsIcon {...props} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name={strings.today} component={TodayScreen} />
      <Tab.Screen name={strings.allTasks} component={AllTasksScreen} />
      <Tab.Screen name={strings.focus} component={FocusScreen} />
      <Tab.Screen name={strings.insights} component={InsightsScreen} />
      <Tab.Screen name={strings.settings} component={SettingsScreen} />
    </Tab.Navigator>
  );
}
