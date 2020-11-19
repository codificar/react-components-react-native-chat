import React, { Component } from 'react';
import { 
    View, 
    TouchableOpacity, 
    BackHandler, 
    Vibration,
    StyleSheet,
    Image,
    RefreshControl
} from 'react-native';
import Toolbar from '../components/ToolBar';
import { 
    GiftedChat, 
    Send, 
    Bubble, 
    MessageText, 
    Time, 
    Composer, 
    Day 
} from 'react-native-gifted-chat';
import { getMessageChat, seeMessage, sendMessage } from '../services/api';
import { withNavigation } from 'react-navigation';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';

const send = require('react-native-chat/src/img/send.png');
var color = '#FBFBFB';

class RideChatScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            messages: [],
            idBotMessage: 1,
            typingText: null,
            valueMessage: false,
            isMessageValue: false,
            userLedgeId: '',
            requestId: this.props.navigation.state.params.requestId,
            isLoading: '',
            receiveID: this.props.navigation.state.params.receiveID,
            lastIdMessage: '',
            user_ledger_id: 0,
            ledger: 0,
            sound: "",
            url: this.props.navigation.state.params.url,
            id: this.props.navigation.state.params.id,
            token: this.props.navigation.state.params.token,
            conversation_id: this.props.navigation.state.params.conversation_id,
            color: this.props.navigation.state.params.color,
            contNewMensag: 0,
            is_refreshing: false
        }

        color = this.props.navigation.state.params.color;

        this.socket = WebSocketServer.connect(this.props.navigation.state.params.socket_url);

        this.willBlur = this.props.navigation.addListener("willBlur", () => {
            
            this.unsubscribeSocket();
        })

        this.willFocus = this.props.navigation.addListener("willFocus", () => {

            this.getConversation();
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
		this.backHandler.remove();
		this.willBlur.remove();
		this.willFocus.remove();
	}

    async getConversation(refresh = false) {
        this.setState({ isLoading: true, is_refreshing: true })
        
        if (this.state.conversation_id) {
            try {
                const response = await getMessageChat(
                    this.state.url,
                    this.state.id,
                    this.state.token,
                    this.state.conversation_id
                );

                console.log('response chat messages: ', response)
                let responseJson = response.data

                if (!refresh) {
                    this.unsubscribeSocketNewConversation()
                    this.subscribeSocket();//subscribe socket new conversation
                }

                if (responseJson.success) {
                    let formattedArrayMessages = responseJson.messages
                    this.setState({
                        userLedgeId: responseJson.user_ledger_id,
                        requestId: responseJson.request_id
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
                    }
                    this.setState({ isLoading: false, is_refreshing: false })

                    if (formattedArrayMessages[formattedArrayMessages.length - 1].is_seen == 0) {
                        this.seeMessage()
                    }

                } else {
                    this.setState({ isLoading: false, is_refreshing: false  })
                }
            } catch (error) {
                this.setState({ isLoading: false, is_refreshing: false  });
                console.log(error);
            }
            
        } else {
            console.log('Nao tem conversa salva')
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
            if (this.props.conversation_id == 0) {
                constants.socket.emit("subscribe", { channel: "request." + id_request })
                    .on("newConversation", (channel, data) => {
                        console.log('Evento socket newConversation disparado! ', channel, data)
                        this.setState({
                            conversation_id: data.conversation_id
                        })
                        this.playSoundRequest();
                        this.getConversation();
                    })
            }
        } catch (error) {
            console.log('Erro subscribeSocketNewConversation:', error)
        }
    }
    
    subscribeSocket() {
        console.log('this.state.conversationId', this.state.conversation_id)

        this.socket
            .emit("subscribe", { channel: "conversation." + this.state.conversation_id })
            .on("newMessage", (channel, data) => {

                console.log('Evento socket newMessage disparado! ', channel, data)

                let newMessage = {
                    _id: data.message.id,
                    createdAt: data.message.created_at,
                    text: data.message.message,
                    sent: true,
                    received: false,
                    user: { _id: data.message.user_id }
                }
                console.log('newMessage: ', newMessage);

                this.setState(state => {
                    if (
                        newMessage._id !==
                        state.messages[state.messages.length - 1]._id &&
                        data.message.user_id !== this.state.userLedgeId
                    ) {
                        return {
                            messages: GiftedChat.append(state.messages, newMessage),
                        };
                    }
                });

                this.setState({ lastIdMessage: data.message.id });
                if (data.message.is_seen == 0 && data.message.user_id !== this.props.ledger) {
                    this.playSoundRequest();
                    this.seeMessage();
                }
            })
    }

    unsubscribeSocket() {
        if (this.socket != null) {
            if (this.state.conversation_id) {
                this.socket.removeAllListeners("newConversation")
                this.socket.removeAllListeners("newMessage")
                this.socket.removeAllListeners("readMessage")
                this.socket.removeAllListeners("newConversation")
                this.socket.emit("unsubscribe", {
                    channel: "conversation." + this.state.conversation_id
                })
            }
        }
    }

    unsubscribeSocketNewConversation() {
        this.socket.removeAllListeners("newConversation");
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
                type
            )

            var responseJson = response.data
            console.log('response send message: ', responseJson)

            if (responseJson.success) {
                if (responseJson.conversation_id) {
                    if (this.state.conversation_id == null || this.state.conversation_id == 0) {
                        this.setState({
                            conversation_id: responseJson.conversation_id
                        });
                        this.unsubscribeSocketNewConversation()
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
     * Render custom buttom value
     */
    renderComposer = props => {
        return (
            <View style={{ flexDirection: 'row' }}>
                <Composer {...props} />
                <TouchableOpacity onPress={this.changeChatMode} style={{ position: 'absolute', right: 5, bottom: 0 }}>
                    {/*  <Icon name='md-cash' type='ionicon' color='green' /> */}
                </TouchableOpacity>
            </View>
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
            <View style={styles.container}>
                <View style={{ marginLeft: 25 }}>
                    <Toolbar />
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
            </View>
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
        color: '#211F1F'
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