import React, { Component } from 'react';
import { 
    View, 
    TouchableOpacity, 
    BackHandler, 
    Vibration,
    StyleSheet,
    Image,
    RefreshControl,
    Text,
    SafeAreaView
} from 'react-native';
import Toolbar from '../components/ToolBar';
import { 
    GiftedChat, 
    Send, 
    Bubble, 
    MessageText, 
    Time, 
    Day 
} from 'react-native-gifted-chat';
import { getConversation, getMessageChat, seeMessage, sendMessage } from '../services/api';
import { withNavigation } from '@react-navigation/compat';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const send = require('react-native-chat/src/img/send.png');
var color = '#FBFBFB';

function resolveRouteParams(props) {
    const navParams = props.navigation && props.navigation.state && props.navigation.state.params;
    if (navParams && Object.keys(navParams).length) {
        return navParams;
    }
    return (props.route && props.route.params) || {};
}

class RideChatScreen extends Component {
    constructor(props) {
        super(props)
        const paramRoute = resolveRouteParams(this.props);
        this.state = {
            messages: [],
            idBotMessage: 1,
            typingText: null,
            valueMessage: false,
            isMessageValue: false,
            userLedgeId: '',
            requestId: paramRoute.requestId,
            isLoading: '',
            receiveID: paramRoute.receiveID,
            lastIdMessage: '',
            user_ledger_id: 0,
            ledger: 0,
            sound: "",
            url: paramRoute.url,
            id: paramRoute.id,
            userName: paramRoute.userName,
            userAvatar: paramRoute.userAvatar,
            impersonate: paramRoute.impersonate,
            token: paramRoute.token,
            conversation_id: paramRoute.conversation_id,
            is_customer_chat: paramRoute.is_customer_chat,
            color: paramRoute.color,
            contNewMensag: 0,
            is_refreshing: false
        }

        color = paramRoute.color;

        this.socket = WebSocketServer.connect(paramRoute.socket_url);

        this.willBlur = this.props.navigation.addListener("blur", () => {
            this.unsubscribeSocket();
            this.unsubscribeSocketNewConversation();
        })

        this.willFocus = this.props.navigation.addListener("focus", async () => {
            await this.getConversation();
        });
        
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            this.props.navigation.goBack();
            return true;
        });

        const timer = setTimeout(() => {
            this.subscribeSocketNewConversation(this.state.requestId)
        }, 1002);
        return () => clearTimeout(timer);


    }

    componentWillUnmount() {
        try {
          this.backHandler && this.backHandler.remove();
          this.willBlur && this.willBlur();
          this.willFocus && this.willFocus();
          this.unsubscribeSocket();
          this.unsubscribeSocketNewConversation();
        } catch (error) {
          console.log('this.componentWillUnmount Error:', error);
        }
    
      }

    async resolveConversationId() {
        if (this.state.conversation_id) {
            return this.state.conversation_id;
        }

        try {
            const response = await getConversation(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.requestId,
                this.state.is_customer_chat || 0
            );
            const conversation = response.data &&
                response.data.conversations &&
                response.data.conversations[0];

            if (conversation && conversation.id) {
                this.setState({
                    conversation_id: conversation.id,
                    receiveID: (conversation.user && conversation.user.id) || this.state.receiveID,
                    userName: (conversation.user && conversation.user.name) || this.state.userName,
                    userAvatar: (conversation.user && conversation.user.image) || this.state.userAvatar,
                });
                return conversation.id;
            }
        } catch (error) {
            console.log('Erro resolveConversationId:', error);
        }

        return 0;
    }

    async getConversation(refresh = false) {
        this.setState({ isLoading: true, is_refreshing: true })

        const conversationId = await this.resolveConversationId();
        
        if (conversationId) {
            try {
                const response = await getMessageChat(
                    this.state.url,
                    this.state.id,
                    this.state.token,
                    conversationId
                );

                console.log('response chat messages: ', response)
                let responseJson = response.data

                if (!refresh) {
                    this.unsubscribeSocketNewConversation()
                    this.subscribeSocket(conversationId);
                }

                if (responseJson.success) {
                    let formattedArrayMessages = responseJson.messages || []
                    this.setState({
                        userLedgeId: responseJson.user_ledger_id,
                        requestId: responseJson.request_id || this.state.requestId,
                        conversation_id: conversationId
                    })
                    if (formattedArrayMessages.length > 0) {
                        this.setState({ lastIdMessage: formattedArrayMessages[formattedArrayMessages.length - 1].id })
                        let finalArrayMessages = []
                        for (let i = 0; i < formattedArrayMessages.length; i++) {
                            finalArrayMessages.unshift({
                                _id: formattedArrayMessages[i].id,
                                createdAt: formattedArrayMessages[i].created_at,
                                text: formattedArrayMessages[i].message,
                                user: { _id: formattedArrayMessages[i].user_id }
                            })
                        }
                        this.setState({ messages: finalArrayMessages })

                        if (formattedArrayMessages[formattedArrayMessages.length - 1].is_seen == 0) {
                            this.seeMessage()
                        }
                    }
                    this.setState({ isLoading: false, is_refreshing: false })

                } else {
                    this.setState({ isLoading: false, is_refreshing: false  })
                }
            } catch (error) {
                this.setState({ isLoading: false, is_refreshing: false  });
                console.log(error);
            }
            
        } else {
            console.log('Nao tem conversa salva')
            this.subscribeSocketNewConversation(this.state.requestId);
            this.setState({ isLoading: false, is_refreshing: false });
        }
    }

    /**
     * Play the sound request
     */
    playSoundRequest() {
        Vibration.vibrate();
    }

    seeMessage() {
        if (this.state.lastIdMessage) {
            seeMessage(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.lastIdMessage
            )
                .then(response => {
                    let responseJson = response.data;
                    console.log('responseJson: ', responseJson);
                    if (responseJson.success) {

                    } else {
                        this.setState({ isLoading: false });
                    }
                }).catch(error => {
                    console.log(error);
                })
        }
    }

    subscribeSocketNewConversation(id_request) {
        console.log('subscribeSocketNewConversation:', id_request)
        try {
            if (!this.state.conversation_id || this.state.conversation_id == 0) {
                if (!this.socket || !id_request) {
                    return;
                }

                if (this._onNewConversation) {
                    this.socket.off("newConversation", this._onNewConversation);
                }

                this._onNewConversation = (channel, data) => {
                    console.log('Evento socket newConversation disparado! ', channel, data)
                    const conversationId = data.conversation_id;
                    this.setState({
                        conversation_id: conversationId
                    })
                    this.playSoundRequest();
                    this.unsubscribeSocketNewConversation();
                    this.getConversation();
                };

                this.socket.on("newConversation", this._onNewConversation);

                const channel = "request." + id_request;
                if (this._subscribedRequestChannel === channel) {
                    WebSocketServer.emitSubscribe(channel);
                    return;
                }

                if (this._subscribedRequestChannel) {
                    WebSocketServer.unsubscribeChannel(this._subscribedRequestChannel);
                }

                this._subscribedRequestChannel = channel;
                WebSocketServer.subscribeChannel(channel);
            }
        } catch (error) {
            console.log('Erro subscribeSocketNewConversation:', error)
        }
    }
    
    subscribeSocket(conversationId) {
        const id = conversationId || this.state.conversation_id;
        console.log('this.state.conversationId', id)

        if (!this.socket || !id) {
            return;
        }

        if (this._onNewMessage) {
            this.socket.off("newMessage", this._onNewMessage);
        }

        this._onNewMessage = (channel, data) => {
            console.log('Evento socket newMessage disparado! ', channel, data)

            if (!data || !data.message) {
                return;
            }

            const message = data.message;
            let newMessage = {
                _id: message.id,
                createdAt: message.created_at,
                text: message.message,
                sent: true,
                received: false,
                user: { _id: message.user_id }
            }
            console.log('newMessage: ', newMessage);

            this.setState(state => {
                const alreadyExists = (state.messages || []).some(
                    item => String(item._id) === String(newMessage._id)
                );
                if (alreadyExists) {
                    return null;
                }

                if (Number(message.user_id) === Number(this.state.userLedgeId)) {
                    return null;
                }

                return {
                    messages: GiftedChat.append(state.messages, newMessage),
                };
            });

            this.setState({ lastIdMessage: message.id });
            if (message.is_seen == 0 && Number(message.user_id) !== Number(this.state.userLedgeId)) {
                this.playSoundRequest();
                this.seeMessage();
            }
        };

        this.socket.on("newMessage", this._onNewMessage);

        const channel = "conversation." + id;

        if (this._subscribedConversationId === id) {
            WebSocketServer.emitSubscribe(channel);
            return;
        }

        if (this._subscribedConversationId) {
            WebSocketServer.unsubscribeChannel(
                "conversation." + this._subscribedConversationId
            );
        }

        this._subscribedConversationId = id;
        WebSocketServer.subscribeChannel(channel);
    }

    unsubscribeSocket() {
        if (this.socket != null) {
            if (this._onNewMessage) {
                this.socket.off("newMessage", this._onNewMessage);
                this._onNewMessage = null;
            }
            const conversationId = this._subscribedConversationId || this.state.conversation_id;
            if (conversationId) {
                WebSocketServer.unsubscribeChannel("conversation." + conversationId);
            }
            this._subscribedConversationId = null;
        }
    }

    unsubscribeSocketNewConversation() {
        if (this.socket && this._onNewConversation) {
            this.socket.off("newConversation", this._onNewConversation);
            this._onNewConversation = null;
        }
        if (this._subscribedRequestChannel) {
            WebSocketServer.unsubscribeChannel(this._subscribedRequestChannel);
            this._subscribedRequestChannel = null;
        }
    }

    /**
     * set messages array with the new message
     * @param {any} messages 
     */
    async onSend(messages = []) {
        try {
            console.log('onSend messages: ', messages)
            let type = 'text'
            let formatted = messages[0].text
            console.log('response send message: ', this.state.receiveID)
            const response = await sendMessage(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.requestId,
                formatted,
                this.state.receiveID,
                this.state.is_customer_chat,
                type
            )

            var responseJson = response.data
            console.log('response send message: ', responseJson)

            if (responseJson.success) {
                if (responseJson.conversation_id) {
                    if (this.state.conversation_id == null || this.state.conversation_id == 0) {
                        const conversationId = responseJson.conversation_id;
                        this.setState({
                            conversation_id: conversationId
                        });
                        this.unsubscribeSocketNewConversation()
                        this.subscribeSocket(conversationId);
                        this.getConversation();
                    }
                }
            }

            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, messages),
            }));
        } catch (error) {
            console.log("error send:", error)
        }
    }

    /**
     * Render custom footer
     * @param {any} props 
     */
    renderSend = props => {
        if (props.text.trim()) { // text box filled
            return <Send {...props}>
                <View style={styles.contImg}>
                    <Image 
                        style={styles.send}
                        source={send} 
                    />
                </View>
            </Send>
        }

    }


    /**
     * Render day
     */
    renderDay(props) {
        return (
            <Day containerStyle={{ marginTop: 30, marginBottom: 0 }}
                {...props}
            />
        )
    }


    /**
     * render bubble
     * @param {any} props 
     */
    renderBubble(props) {
        return (
            <Bubble
                {...props}

                wrapperStyle={{
                    left: styles.leftBubble,
                    right: {
                        backgroundColor: color,
                        elevation: 5,
                        marginTop: 10
                    },
                }}
            />
        )
    }


    /**
     * render custom text message
     *  @param {any} props
     */
    renderMessageText(props) {
        return (
            <MessageText
                {...props}
                textStyle={{ right: styles.messageTextRight, left: styles.messageText }}
            />
        )
    }


    /**
     * render custom time about message
     */
    renderTime(props) {
        return (
            <Time
                {...props}
                textStyle={{ left: styles.time, right: styles.timeRight }}
            />
        )
    }


    /**
     * Mount RefreshControl
     */
    renderRefreshControl() {
        return <RefreshControl
            colors={['#000']}
            refreshing={this.state.is_refreshing}
            onRefresh={() => this.getConversation(true)} 
        />
    }

    render() {

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerView}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.backButton}
                      onPress={() => this.props.navigation.goBack()}
                    >
                      <MaterialIcons name="keyboard-arrow-left" color={this.state.color} size={35} />
                    </TouchableOpacity>
                    { !(this.state.impersonate && this.state.is_customer_chat) && (
                        <Image
                            style={styles.avatarImg}
                            source={{ uri: this.state.userAvatar }}
                        />
                    )}
                    <Text style={styles.userName}>
                        {(this.state.impersonate && this.state.is_customer_chat) ? 'Chat com usuário' : this.state.userName}
                    </Text>
                </View>
                <GiftedChat
                    messages={this.state.messages}
                    placeholder={strings.send_message}
                    locale='pt'
                    dateFormat='L'
                    onSend={messages => this.onSend(messages)}
                    user={{ _id: this.state.userLedgeId }}
                    renderSend={this.renderSend}
                    renderDay={this.renderDay}
                    renderBubble={this.renderBubble}
                    renderMessageText={this.renderMessageText}
                    renderTime={this.renderTime}
                    textInputProps={{ keyboardType: this.state.isMessageValue ? 'numeric' : 'default' }}
                    listViewProps={{
                        refreshControl: this.renderRefreshControl()
                    }}
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    messageText: {
        color: '#211F1F'
    },
    messageTextRight: {
        color: '#fff'
    },
    time: {
        color: '#9aa2ab'
    },
    timeRight: {
        color: '#fff'
    },
    leftBubble: {
        backgroundColor: '#FBFBFB',
        marginTop: 10
    },
    rightBubble: {
        backgroundColor: '#FBFBFB',
        elevation: 5,
        marginTop: 10
    },
    contImg: {
        marginRight: 15,
        marginBottom: 6,
        textTransform: 'uppercase',
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center"
    },
    avatarImg: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'lightgray'
    },
    backButton: {
        marginRight: 10,
        justifyContent: 'center'
    },
    headerView: {
        width: '100%',
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 10,
        alignItems: 'center',
        backgroundColor: 'white'
    },
    userName: {
        fontSize: 18,
        color: 'black',
        fontWeight: 'bold'
    },
    send: {
        width: 25,
        height: 25
    },
    leftBubble: {
        marginLeft: -30,
        backgroundColor: '#FBFBFB',
        marginTop: 10,
        elevation: 5,
    },
});

export default withNavigation(RideChatScreen);
