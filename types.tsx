export type PropsDirectChatScreen = {
  url: string;
  id: string;
  token: string;
  receiver: string;
  socket_url: string;
};

export type PropsHelpChatScreen = {
  id: string;
  receiver: string;
  token: string;
  url: string;
};
export type PropsListDirectsScreen = {
  id: string;
  token: string;
  url: string;
  socket_url: string;
};
export type PropsListProvidersForConversation = {
  id: string;
  token: string;
  url: string;
  socket_url: string;
};
export type PropsRideChatScreen = {
  id: string;
  token: string;
  url: string;
  socket_url: string;
  conversation_id: string;
  receiveID: number;
};
