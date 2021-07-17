import React, {FC, useEffect,useState} from 'react';
import {RefreshControl, Vibration } from 'react-native';
import Sound from 'react-native-sound';
import {
    GiftedChat,
    Bubble,
    MessageText
} from 'react-native-gifted-chat';
import { getMessageDirectChat, sendMessageDirectChat } from '../../services/api';
import WebSocketServer from "../../services/socket";
import { useRoute, useNavigation } from '@react-navigation/native';
import DirectChatScreen from './DirectChatScreen';
import { DirectChatScreenParams } from '../../types/screens/navigation';
import { Send } from '../../components';

const sound_file = require('react-native-chat/src/files/beep.mp3');

export const DirectChatScreenContainer: FC = () => {
    let socket
    const navigation = useNavigation();
    const { params } = useRoute<DirectChatScreenParams>();
    const [ paramsDirectChatScreen, setParamsDirectChatScreen] = useState({
        id: '',receiver: '',token: '',url: ''
    })
    const [conversation, setConversation] = useState(0);
    const [ledger_id, setLedger_id] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [messages, setMessages] = useState([]);

    const onSend = async (messagesNew = [])  => {
        try {
            const response = await sendMessageDirectChat(
                paramsDirectChatScreen.url,
                +paramsDirectChatScreen.id,
                paramsDirectChatScreen.token,
                +paramsDirectChatScreen.receiver,
                messagesNew[0].text
            )
    
            if (!conversation) {
                setConversation(response.data.conversation_id);
                subscribeSocket();
            }
            setMessages(GiftedChat.append(messages, messagesNew))
        } catch (error) {}
    }

    const play = () => {
        Vibration.vibrate();
        new Sound(sound_file, null).setCurrentTime(0);
    }

    const unsubscribeSocket = () => {
        if (socket) {
            if (conversation) {
                socket.removeAllListeners("newConversation")
                socket.removeAllListeners("newMessage")
                socket.removeAllListeners("readMessage")
                socket.removeAllListeners("newConversation")
                socket.emit("unsubscribe", {
                    channel: "conversation." + conversation
                })
            }
        }
    }
  
    const subscribeSocket = () => {

        if (conversation) {
            socket
            .emit('subscribe', {
                channel: `conversation.${conversation}`,
            })
            .on('newMessage', (channel, data) => {
                const newMessage = [{
                    _id: data.message.id,
                    createdAt: data.message.created_at,
                    text: data.message.message,
                    sent: true,
                    received: false,
                    user: { _id: data.message.user_id },
                }];

                if (data.message.user_id !== ledger_id) {
                    play();
                }

                    if (
                        newMessage[0]._id !==
                        messages[messages.length - 1]._id &&
                        data.message.user_id !== ledger_id
                    ) {

                        setMessages( GiftedChat.append(messages, newMessage))
                 
                    }

            })
        }
    }

    const formatMessages = (messages) => {
        const formattedArrayMessages = messages;

        if (formattedArrayMessages.length > 0) {
            setConversation(formattedArrayMessages[0].conversation_id)

            const finalArrayMessages = [];
            for (let i = 0; i < formattedArrayMessages.length; i++) {
                finalArrayMessages.unshift({
                    _id: formattedArrayMessages[i].id,
                    createdAt: formattedArrayMessages[i].created_at,
                    text: formattedArrayMessages[i].message,
                    user: { _id: formattedArrayMessages[i].user_id },
                });
            }

            return finalArrayMessages;
        }

        return [];
    }

    const getMessages = async () => {

        try {
            setIsRefreshing(true);
            const response = await getMessageDirectChat(
                paramsDirectChatScreen.url,
                +paramsDirectChatScreen.id,
                paramsDirectChatScreen.token,
                +paramsDirectChatScreen.receiver
            );
    
            const { data } = response;
            const formattedArrayMessages = formatMessages(data.messages);
            setMessages(formattedArrayMessages);
            setLedger_id(data.user_ledger_id);
            setIsRefreshing(false);
           
        } catch (error) {
            setIsRefreshing(false);
        }
    }

    useEffect(() =>{
        if(params.id && params.receiver && params.token && params.url){
            setParamsDirectChatScreen({
                id: params.id,
                receiver: params.receiver,
                token: params.token,
                url: params.url
            })
            socket = WebSocketServer.connect(params.socket_url)
        }
    },[params])

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            unsubscribeSocket()
        });
    
        return unsubscribe;
      }, [navigation]);

    const renderRefreshControl = () => {
        return (
            <RefreshControl
                colors={['#000']}
                refreshing={isRefreshing}
                onRefresh={() => getMessages()} 
            />
        )
    }

    const renderMessageText = (props) => {
        return (
            <MessageText
                {...props}
                textStyle={{ right: {color: '#fff'}, left: { color: '#211F1F'} }}
            />
        );
    }

    const renderBubble = (props) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{ left: {
                    marginLeft: -30,
                    backgroundColor: '#FBFBFB',
                    marginTop: 10,
                    elevation: 5,
                }, 
                right:{
                    backgroundColor: '#687a95',
                    elevation: 5,
                    marginTop: 10,
                }}}
            />
        );
    }

    const renderSend = (props) => {
        if (!props.text.trim()) return;

        return (
            <Send {...props}/>
        );
    }

  return (
    <DirectChatScreen
        messages={messages}
        goBack={() => navigation.goBack()}
        ledger_id={ledger_id}
        renderSend={renderSend}
        renderBubble={renderBubble} 
        renderMessageText={renderMessageText} 
        onSend={onSend} 
        renderRefreshControl={renderRefreshControl} 
    />
  );
};

export default DirectChatScreenContainer;
