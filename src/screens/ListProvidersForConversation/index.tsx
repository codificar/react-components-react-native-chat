import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ListDirectsScreenParams } from "../../types/screens/navigation";
import { listProvidersForConversation } from "../../services/api";

import ListProvidersForConversationScreen from "./ListProvidersForConversation";

export const Index: React.FC = () => {
  const navigation = useNavigation();

  const { params } = useRoute<ListDirectsScreenParams>();
  const [paramsListDirects, setParamsListDirects] = useState({
    id: "",
    token: "",
    url: "",
    socket_url: "",
  });
  const [providers, setProviders] = useState([]);

  const getListProvidersForConversation = async (name: string) => {
    try {
      const response = await listProvidersForConversation(
        paramsListDirects.url,
        +paramsListDirects.id,
        paramsListDirects.token,
        name
      );

      const { data } = response;
      setProviders(data.providers);
    } catch (error) {}
  };

  const navigationListProvider = (id) => {
    navigation.navigate("DirectChatScreen", {
      url: paramsListDirects.url,
      socket_url: paramsListDirects.socket_url,
      id: paramsListDirects.id,
      token: paramsListDirects.token,
      receiver: id,
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
    <ListProvidersForConversationScreen
      providers={providers}
      goBack={() => navigation.goBack()}
      navigate={navigationListProvider}
      handleName={getListProvidersForConversation}
    />
  );
};

export default Index;
