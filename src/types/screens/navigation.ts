import { RouteProp } from "@react-navigation/native";

type ScreensParams = {
  ["DirectChatScreen"]: {
    url: string;
    id: string;
    token: string;
    receiver: string;
    socket_url: string;
  };
  ["ListDirectsScreen"]: {
    url: string;
    id: string;
    token: string;
    app_type: string;
    socket_url: string;
  };
  ["RideChat"]: {
    url: string;
    id: string;
    token: string;
    socket_url: string;
    conversation_id: string;
    receiveID: number;
  };
};

export type DirectChatScreenParams = RouteProp<
  ScreensParams,
  "DirectChatScreen"
>;

export type ListDirectsScreenParams = RouteProp<
  ScreensParams,
  "ListDirectsScreen"
>;

export type RideChatScreenParams = RouteProp<ScreensParams, "RideChat">;
