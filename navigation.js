//This file must be imported by the parent project that uses this model to function the navigation
import React from 'react';
import HelpChatScreen from './src/pages/HelpChatScreen';
import RideChatScreen from './src/pages/RideChatScreen';
import ListDirectsScreen from './src/pages/ListDirectsScreen';
import DirectChatScreen from './src/pages/DirectChatScreen';
import ListProvidersForConversation from './src/pages/ListProvidersForConversation';
import { createStackNavigator } from '@react-navigation/stack';

export const screens = {
    HelpChatScreen: { screen: HelpChatScreen },
    RideChatScreen: { screen: RideChatScreen },
    ListDirectsScreen: { screen: ListDirectsScreen },
    DirectChatScreen: { screen: DirectChatScreen },
    ListProvidersForConversation: { screen: ListProvidersForConversation }
};

const Stack = createStackNavigator();

const ChatStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="DirectChatScreen" component={DirectChatScreen} />
    <Stack.Screen name="HelpChatScreen" component={HelpChatScreen} />
    <Stack.Screen name="ListDirectsScreen" component={ListDirectsScreen} />
    <Stack.Screen
      name="ListProvidersForConversation"
      component={ListProvidersForConversation}
    />
    <Stack.Screen name="RideChatScreen" component={RideChatScreen} />
  </Stack.Navigator>
);

export default ChatStack;
