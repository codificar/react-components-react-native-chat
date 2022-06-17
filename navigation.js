//This file must be imported by the parent project that uses this model to function the navigation
import HelpChatScreen from './src/pages/HelpChatScreen';
import RideChatScreen from './src/pages/RideChatScreen';
import ListDirectsScreen from './src/pages/ListDirectsScreen';
import DirectChatScreen from './src/pages/DirectChatScreen';
import ListProvidersForConversation from './src/pages/ListProvidersForConversation';

const screens = {
    HelpChatScreen: { screen: HelpChatScreen },
    RideChatScreen: { screen: RideChatScreen },
    ListDirectsScreen: { screen: ListDirectsScreen },
    DirectChatScreen: { screen: DirectChatScreen },
    ListProvidersForConversation: { screen: ListProvidersForConversation }
};

export {
    HelpChatScreen,
    RideChatScreen,
    ListDirectsScreen,
    DirectChatScreen,
    ListProvidersForConversation,
}

export default screens;