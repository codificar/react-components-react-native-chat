import * as React from "react";
import { Vibration } from "react-native";
import { useState } from "react";
import Badger from "../Badger";
import { Routes } from "../../navigation/routes";
import WebSocketServer from "../../services/socket";
import { getConversation } from "../../services/api";
import { Touchable, Wrapper, Container, Img } from "./styles";
import { useEffect } from "react";
import Sound from "react-native-sound";
import { useNavigation } from '@react-navigation/native';

const icon = require("react-native-chat/src/img/chat.png");
const sound_file = require("react-native-chat/src/files/beep.mp3");

type Props = {
  id: number;
  token: string;
  url: string;
  color: string;
  socket_url: string;
  request_id: number;
};

const ConversationPerfilContainer: React.FC<Props> = ({
  id,
  token,
  url,
  color,
  socket_url,
  request_id,
}) => {
  let timer;
  let socket = WebSocketServer.connect(socket_url);
  const navigation = useNavigation();
  const [contNewMensag, setContNewMensag] = useState(0);
  const [conversation_id, setConversation_id] = useState(0);
  const [receiveID, setReceiveID] = useState(0);
  let sound = new Sound(sound_file, null);

  const playSoundRequest = () => {
    Vibration.vibrate();
    sound.setCurrentTime(0);
  };

  const subscribeSocketConversation = (id) => {
    socket
      .emit("subscribe", { channel: `conversation.${id}` })
      .on("newMessage", (_channel, data) => {
        playSoundRequest();
        setContNewMensag(contNewMensag + 1);
      });
  };

  const getConversationInternal = async () => {
    try {
      const data = await callApiConversation();
      subscribeSocketConversation(data.id);
      setContNewMensag(data.new_messages);
      setConversation_id(data.id);
      setReceiveID(data.user.id);
    } catch (error) {}
  };

  const subscribeSocketNewConversation = (id_request) => {
    try {
      socket
        .emit("subscribe", { channel: `request.${id_request}` })
        .on("newConversation", (channel, data) => {
          setConversation_id(data.conversation_id);
          setContNewMensag(contNewMensag + 1);

          playSoundRequest();
        });
    } catch (error) {}
  };

  const unsubscribeSocket = () => {
    if (socket != null) {
      if (conversation_id) {
        socket.removeAllListeners('newConversation');
        socket.removeAllListeners('newMessage');
        socket.removeAllListeners('readMessage');
        socket.removeAllListeners('newConversation');
        socket.emit('unsubscribe', {
          channel: `conversation.${conversation_id}`,
        });
      }
    }
  }

  const unsubscribeSocketNewConversation = () => {
    socket.removeAllListeners('newConversation');
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
        clearTimeout(timer);
        unsubscribeSocket();
        unsubscribeSocketNewConversation();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getConversationInternal();
    timer = setInterval(async () => {
        getConversationInternal();
    }, 8002);
    subscribeSocketNewConversation(request_id);
  }, []);

  const callApiConversation = async () => {
    try {
      const response = await getConversation(url, id, token, request_id);

      const { data } = response;

      return data.conversations[0];
    } catch (error) {
      return {
        id: 0,
      };
    }
  };

  const navigateTo = async () => {
    let conversationId = conversation_id;

    if (conversationId === 0) {
      const data = await callApiConversation();
      conversationId = data.id;
    }
    setContNewMensag(0);
    navigation.navigate(Routes.RideChat, {
      receiveID: receiveID,
      conversation_id: conversationId,
      url: url,
      socket_url: socket_url,
      id: id,
      token: token,
      requestId: request_id,
      color: color,
    });
  };

  return (
    <Wrapper>
      <Touchable onPress={navigateTo} activeOpacity={0.6}>
        <Container>
          <Badger
            contador={contNewMensag}
            position={{
              position: "absolute",
              top: -8,
              left: -8,
              zIndex: 999,
            }}
          />
          <Img source={icon} />
        </Container>
      </Touchable>
    </Wrapper>
  );
};

export default ConversationPerfilContainer;
