import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ListDirectsScreenParams } from "../../types/screens/navigation";
import { listDirectConversations } from "../../services/api";

import ListDirectsScreen from "./ListDirectsScreen";

export const ListDirectsScreenContainer: React.FC = () => {
  const navigation = useNavigation();

  const { params } = useRoute<ListDirectsScreenParams>();
  const [paramsListDirects, setParamsListDirects] = useState({
    id: "",
    token: "",
    url: "",
    socket_url: "",
  });
  const [conversations, setConversations] = useState([]);
  const [is_refreshing, setIs_refreshing] = useState(false);
  const [show_new_conversation, setShow_new_conversation] = useState(false);

  const navigateToChatScreen = (item) => {
    if (!item.request_id || item.request_id == 0)
      navigation.navigate("DirectChatScreen", {
        url: paramsListDirects.url,
        socket_url: paramsListDirects.socket_url,
        id: paramsListDirects.id,
        token: paramsListDirects.token,
        receiver: item.id,
      });
    else
      navigation.navigate("RideChatScreen", {
        conversation_id: item.conversation_id,
        url: paramsListDirects.url,
        socket_url: paramsListDirects.socket_url,
        id: paramsListDirects.id,
        token: paramsListDirects.token,
        requestId: item.request_id,
        color: "#687a95",
      });
  };

  const getListDirectConversations = async () => {
    try {
      setIs_refreshing(true);
      const response = await listDirectConversations(
        paramsListDirects.url,
        +paramsListDirects.id,
        paramsListDirects.token
      );

      const { conversations } = response.data;
      setConversations(conversations);
      setIs_refreshing(false);
    } catch (error) {
      setIs_refreshing(false);
    }
  };

  const navigationListProvider = () => {
    navigation.navigate("ListProvidersForConversation", {
      url: paramsListDirects.url,
      socket_url: paramsListDirects.socket_url,
      id: paramsListDirects.id,
      token: paramsListDirects.token,
    });
  };

  useEffect(() => {
    if (params.id && params.token && params.url) {
      setParamsListDirects({
        id: params.id,
        token: params.token,
        url: params.url,
        socket_url: params.socket_url,
      });
    }
  }, [params]);

  return (
    <ListDirectsScreen
      conversations={conversations}
      goBack={() => navigation.goBack()}
      navigate={navigationListProvider}
      onPressConversation={navigateToChatScreen}
      listDirectConversations={getListDirectConversations}
      is_refreshing={is_refreshing}
      show_new_conversation={show_new_conversation}
    />
  );
};

export default ListDirectsScreenContainer;
