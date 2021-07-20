import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { RefreshControl, Vibration } from "react-native";
import { RideChatScreenParams } from "../../types/screens/navigation";
import WebSocketServer from "../../services/socket";
import { getMessageChat, seeMessage, sendMessage } from "../../services/api";

import RideChatScreen from "./RideChatScreen";
import {
  Bubble,
  Day,
  GiftedChat,
  MessageText,
  Time,
} from "react-native-gifted-chat";
// import Sound from "react-native-sound";
import { Send } from "../../components";
// const sound_file = require("react-native-chat/src/files/beep.mp3");

export const RideChatScreenContainer: React.FC = () => {
  let socket;
  let sound;
  const navigation = useNavigation();

  const { params } = useRoute<RideChatScreenParams>();
  const [is_refreshing, setIs_refreshing] = useState(false);
  const [paramsListDirects, setParamsListDirects] = useState({
    id: "",
    token: "",
    url: "",
    socket_url: "",
    conversation_id: "",
    receiveID: 0,
  });

  const [request, setRequest] = useState({
    userLedgeId: 0,
    requestId: 0,
  });

  const [lastIdMessage, setLastIdMessage] = useState();
  const [messages, setMessages] = useState([]);

  const onSend = async (newMessages = []): Promise<void> => {
    try {
      const type = "text";
      const formatted = newMessages[0].text;
      const response = await sendMessage(
        paramsListDirects.url,
        +paramsListDirects.id,
        paramsListDirects.token,
        request.requestId,
        formatted,
        paramsListDirects.receiveID,
        type
      );

      const responseJson = response.data;

      if (responseJson.success) {
        if (responseJson.conversation_id) {
          if (
            paramsListDirects.conversation_id == null ||
            !paramsListDirects.conversation_id
          ) {
            setParamsListDirects({
              ...paramsListDirects,
              conversation_id: responseJson.conversation_id,
            });

            unsubscribeSocketNewConversation();
            getConversation();
          }
        }
      }

      if (messages.length > 0) {
        setMessages(GiftedChat.append(messages, newMessages));
      }
    } catch (error) {
      console.log("error send:", error);
    }
  };

  const playSoundRequest = (): void => {
    Vibration.vibrate();
    sound.setCurrentTime(0).play((success) => {
      if (!success) {
        console.log("didn't play");
      }
    });
  };

  const subscribeSocket = (): void => {
    socket
      .emit("subscribe", {
        channel: `conversation.${paramsListDirects.conversation_id}`,
      })
      .on("newMessage", (channel, data) => {
        const newMessage = [
          {
            _id: data.message.id,
            createdAt: data.message.created_at,
            text: data.message.message,
            sent: true,
            received: false,
            user: { _id: data.message.user_id },
          },
        ];

        if (
          newMessage[0]._id !== messages[messages.length - 1]._id &&
          data.message.user_id !== request.userLedgeId
        ) {
          setMessages(GiftedChat.append(messages, newMessage));
        }

        setLastIdMessage(data.message.id);
        if (
          data.message.is_seen === 0 &&
          data.message.user_id !== request.userLedgeId
        ) {
          playSoundRequest();
          getSeeMessage();
        }
      });
  };

  const getSeeMessage = (): void => {
    if (lastIdMessage) {
      seeMessage(
        paramsListDirects.url,
        +paramsListDirects.id,
        paramsListDirects.token,
        lastIdMessage
      )
        .then((response) => {
          const responseJson = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const getConversation = async (refresh = false): Promise<void> => {
    if (refresh) {
      setIs_refreshing(true);
    }
    if (paramsListDirects.conversation_id) {
      try {
        const response = await getMessageChat(
          paramsListDirects.url,
          +paramsListDirects.id,
          paramsListDirects.token,
          +paramsListDirects.conversation_id
        );
        const responseJson = response.data;

        if (!refresh) {
          unsubscribeSocketNewConversation();
          subscribeSocket();
        }

        if (responseJson.success) {
          const formattedArrayMessages = responseJson.messages;
          setRequest({
            userLedgeId: responseJson.user_ledger_id,
            requestId: responseJson.request_id,
          });
          if (formattedArrayMessages.length > 0) {
            setLastIdMessage(
              formattedArrayMessages[formattedArrayMessages.length - 1].id
            );
            const finalArrayMessages = [];
            for (let i = 0; i < formattedArrayMessages.length; i++) {
              finalArrayMessages.unshift({
                _id: formattedArrayMessages[i].id,
                createdAt: formattedArrayMessages[i].created_at,
                text: formattedArrayMessages[i].message,
                user: { _id: formattedArrayMessages[i].user_id },
              });
            }
            setMessages(finalArrayMessages);
          }
          setIs_refreshing(false);
          if (
            formattedArrayMessages[formattedArrayMessages.length - 1]
              .is_seen === 0
          ) {
            getSeeMessage();
          }
        } else {
          setIs_refreshing(false);
        }
      } catch (error) {
        setIs_refreshing(false);
      }
    } else {
      setIs_refreshing(false);
    }
  };

  const unsubscribeSocket = () => {
    if (socket) {
      if (paramsListDirects.conversation_id) {
        socket.removeAllListeners("newConversation");
        socket.removeAllListeners("newMessage");
        socket.removeAllListeners("readMessage");
        socket.removeAllListeners("newConversation");
        socket.emit("unsubscribe", {
          channel: "conversation." + paramsListDirects.conversation_id,
        });
      }
    }
  };

  const unsubscribeSocketNewConversation = (): void => {
    socket.removeAllListeners("newConversation");
  };

  useEffect(() => {
    // Sound.setCategory("Playback");

   /*  sound = new Sound(sound_file, null, (err) => {
      console.log(err);
    }); */
    if (params.id && params.token && params.url) {
      setParamsListDirects({
        id: params.id,
        token: params.token,
        url: params.url,
        socket_url: params.socket_url,
        conversation_id: params.conversation_id,
        receiveID: params.receiveID,
      });

      socket = WebSocketServer.connect(params.socket_url);

      subscribeSocket();
    }
  }, [params]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      unsubscribeSocket();
    });

    return unsubscribe;
  }, [navigation]);

  const renderRefreshControl = () => {
    return (
      <RefreshControl
        colors={["#000"]}
        refreshing={is_refreshing}
        onRefresh={() => getConversation(true)}
      />
    );
  };

  const renderSend = (props) => {
    if (!props.text.trim()) return;

    return <Send {...props} />;
  };

  const renderTime = (props) => {
    return (
      <Time
        {...props}
        textStyle={{
          left: {
            color: "#9aa2ab",
          },
          right: {
            color: "#fff",
          },
        }}
      />
    );
  };

  const renderMessageText = (props) => {
    return (
      <MessageText
        {...props}
        textStyle={{
          right: {
            color: "#fff",
          },
          left: {
            color: "#211F1F",
          },
        }}
      />
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: "#FBFBFB",
            marginTop: 10,
            marginLeft: -30,
            elevation: 5,
          },
          right: {
            backgroundColor: "#FBFBFB",
            elevation: 5,
            marginTop: 10,
          },
        }}
      />
    );
  };

  const renderDay = (props) => {
    return (
      <Day containerStyle={{ marginTop: 30, marginBottom: 0 }} {...props} />
    );
  };

  return (
    <RideChatScreen
      messages={messages}
      onSend={onSend}
      ledger_id={request.userLedgeId}
      renderTime={renderTime}
      renderMessageText={renderMessageText}
      renderBubble={renderBubble}
      renderSend={renderSend}
      renderDay={renderDay}
      isMessageValue={false}
      goBack={() => navigation.goBack()}
      renderRefreshControl={renderRefreshControl}
    />
  );
};

export default RideChatScreenContainer;
