// This file must be imported by the parent project that uses this model to function the navigation
import {
  HelpChatScreen,
  RideChatScreen,
  ListDirectsScreen,
  DirectChatScreen,
  ListProvidersForConversation,
} from './src/pages';

const screens = {
  HelpChatScreen: { screen: HelpChatScreen },
  RideChatScreen: { screen: RideChatScreen },
  ListDirectsScreen: { screen: ListDirectsScreen },
  DirectChatScreen: { screen: DirectChatScreen },
  ListProvidersForConversation: { screen: ListProvidersForConversation },
};

export {
  HelpChatScreen,
  RideChatScreen,
  ListDirectsScreen,
  DirectChatScreen,
  ListProvidersForConversation,
};

export default screens;
