import React, { Component } from 'react';
import { 
    View, 
    TouchableOpacity, 
    BackHandler, 
    Vibration,
    StyleSheet,
    Image,
    RefreshControl,
    Text
} from 'react-native';
import Toolbar from '../components/ToolBar';
import Sound from "react-native-sound";
import { 
    GiftedChat, 
    Send, 
    Bubble, 
    MessageText, 
    Time, 
    Day 
} from 'react-native-gifted-chat';
import { getConversation, getMessageChat, seeMessage, sendMessage } from '../services/api';
import { withNavigation } from 'react-navigation';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';
import { handleException } from '@codificar/use-log-errors'; 

import 'dayjs/locale/en';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/es';

const send = require('react-native-chat/src/img/send.png');
var color = '#FBFBFB';

class RideChatScreen extends Component {
    constructor(props) {
        super(props)
        const paramRoute = this.props.navigation.state != undefined ? this.props.navigation.state.params : this.props.route.params;
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
            audio: paramRoute.audio,
            playSound: null,
            playSoundError: true,
            url: paramRoute.url,
            id: paramRoute.id,
            token: paramRoute.token,
            conversation_id: paramRoute.conversation_id,
            color: paramRoute.color,
            contNewMensag: 0,
            is_refreshing: false,
            intervalConversation: null,
            baseUrl: paramRoute.basUrl || '',
            projectName: paramRoute.projectName || '',
            appType: paramRoute.appType || '',
            refreshInterval: paramRoute.refreshInterval || 5000,
            socket_url: paramRoute.socket_url || null,
        }

        color = paramRoute.color;

        this.connectSocket();

        this.willBlur = this.props.navigation.addListener("willBlur", async () => {
            await this.unsubscribeSocket();
            await this.unsubscribeSocketNewConversation();
            this.clearIntervalConverstaion();
        })

        this.willFocus = this.props.navigation.addListener("willFocus", async () => {
            await this.connectSocket();
            await this.getConversation();
        });
        
        
    }

    async connectSocket() {
        try {
            if(WebSocketServer.socket !== undefined && WebSocketServer.socket != null)
                return;
            if (!WebSocketServer.isConnected) {
                WebSocketServer.socket = await WebSocketServer.connect(this.state.socket_url);
                await this.subscribeSocket();
            }
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.connectSocket(): ',
                error,
            });
        }
    }

    async componentDidMount() {
        this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            this.unsubscribeSocket();
            this.unsubscribeSocketNewConversation();
            this.props.navigation.goBack();
            return true;
        });

        this.setSound();
        await this.connectSocket();
        this.initIntervalGetConversation();
        this.initiIntervalCallApiConversation();
        
        return () => {
            clearInterval(this.intervalConversation);
            clearInterval(this.refreshInterval);
        };
    }

    initIntervalGetConversation() {
        if (this.state.refreshInterval) {
            this.refreshInterval = setInterval(() => {
                if (!WebSocketServer.isConnected) {
                    this.getConversation();
                }
            }, this.state.refreshInterval);
        }
    }
    initiIntervalCallApiConversation() {
        if(!this.state.conversation_id || this.state.conversation_id == 0) {
            this.intervalConversation = setInterval(async () => {
                await this.callApiConversation();
            }, 5000);

        }
    }

    setSound() {
        const filenameOrFile = this.state.audio ? this.state.audio : "beep.wav";
        const basePath = this.state.audio ? null : Sound.MAIN_BUNDLE;
        try {
            const sound = new Sound(filenameOrFile, basePath, (error) => {
                if (error) {
                    console.log('failed to load the sound', error);
                    return;
                }
            });
    
            if (sound) {
                this.setState({
                    playSound: sound,
                    playSoundError: false
                });
            }
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.setSound(): ',
                error,
            });
        }
    }

    componentWillUnmount() {
        try {
            this.unsubscribeSocket();
            this.unsubscribeSocketNewConversation();
            this.backHandler.remove();
            this.clearIntervalConverstaion();
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.componentWillUnmount()',
                error,
            });
        }
      }

    async callApiConversation() {
        try {
            const response = await getConversation(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.requestId
            );
            const { data } = response;
            
            if(data && data.conversations
                && data.conversations.length > 0
                && data.conversations[0].id
                && (!this.state.conversation_id || this.state.conversation_id == 0)
            ) {
                this.setState({ conversation_id: data.conversations[0].id });
                this.getConversation();
                this.clearIntervalConverstaion();
            }
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.callApiConversation:',
                error,
            });
        }
    }

    clearIntervalConverstaion() {
        clearInterval(this.state.intervalConversation);
        clearInterval(this.refreshInterval);
        this.setState({
            intervalConversation: null
        });
    }

    async getConversation(refresh = false) {
        if(refresh) {
            this.setState({ isLoading: true, is_refreshing: true })
        }
        
        if (this.state.conversation_id) {
            try {
                const response = await getMessageChat(
                    this.state.url,
                    this.state.id,
                    this.state.token,
                    this.state.conversation_id
                );

                let responseJson = response.data

                if (!refresh) {
                    this.unsubscribeSocketNewConversation();
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
                        
                        formattedArrayMessages.map(message => {
                            if(message.response_quick_reply) {
                                let quickReply = JSON.parse(message.response_quick_reply);
                                if((!!message.response_quick_reply && quickReply.answered == null)){
                                    finalArrayMessages.unshift({
                                        _id: message.id,
                                        createdAt: message.created_at,
                                        text: message.message,
                                        user: { 
                                            _id: message.user_id
                                        },
                                        image: message.picture ? this.state.url + '/uploads/' + message.picture : null,
                                        quickReplies: {
                                            type: 'radio', // or 'checkbox',
                                            keepIt: true,
                                            values: quickReply.values
                                        }
                                    });
                                } else {
                                    finalArrayMessages.unshift({
                                        _id: message.id,
                                        createdAt: message.created_at,
                                        text: message.message,
                                        user: { 
                                            _id: message.user_id
                                        },
                                        image: message.picture ? this.state.url + '/uploads/' + message.picture : null                        
                                    });
                                }
                            } else {
                                finalArrayMessages.unshift({
                                    _id: message.id,
                                    createdAt: message.created_at,
                                    text: message.message,
                                    user: { 
                                        _id: message.user_id
                                    },
                                    image: message.picture ? this.state.url + '/uploads/' + message.picture : null                        
                                });
                            }
                        });
                        this.setState({ messages: finalArrayMessages })
                    }

                    if(refresh) {
                        this.setState({ isLoading: false, is_refreshing: false })
                    }

                    if (formattedArrayMessages[formattedArrayMessages.length - 1].is_seen == 0) {
                        this.seeMessage()
                    }

                } else {
                    if(refresh) {
                        this.setState({ isLoading: false, is_refreshing: false })
                    }
                }
            } catch (error) {
                this.setState({ isLoading: false, is_refreshing: false  });
                handleException({
                    baseUrl: this.state.baseUrl,
                    projectName: this.state.projectName,
                    appType: this.state.appType,
                    errorInfo: 'LibChat.RideChatScreen.getConversation()',
                    error,
                });
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
        try {
            Vibration.vibrate();
            Sound.setCategory("Playback");
        
            if (!this.state.playSoundError) {
                this.state.playSound.setVolume(1);
                this.state.playSound.play();
            }    
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChat.playSoundRequest:',
                error,
            });
        }

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
                    if (responseJson.success) {

                    } else {
                        this.setState({ isLoading: false });
                    }
                }).catch(error => {
                    handleException({
                        baseUrl: this.state.baseUrl,
                        projectName: this.state.projectName,
                        appType: this.state.appType,
                        errorInfo: 'LibChat.RideChatScreen.seeMessage()',
                        error,
                    });
                })
        }
    }

    subscribeSocketNewConversation(id_request) {
        console.log('subscribeSocketNewConversation:', id_request)
        try {
            if (this.props.conversation_id == 0) {
                if(WebSocketServer.socket != undefined && WebSocketServer.socket != null) {
                    WebSocketServer.socket.emit("subscribe", { channel: "request." + id_request })
                        .on("newConversation", (channel, data) => {
                            console.log('Evento socket newConversation disparado! ', channel, data)
                            this.setState({
                                conversation_id: data.conversation_id
                            })
                            //this.playSoundRequest();
                            this.getConversation();
                        });
                }
            }
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: `LibChat.RideChatScreen.subscribeSocketNewConversation(${id_request})`,
                error,
            });
        }
    }
    
    async subscribeSocket() {
        try {
            if(WebSocketServer.socket != undefined && WebSocketServer.socket != null) {
                WebSocketServer.socket
                    .emit("subscribe", { channel: "conversation." + this.state.conversation_id })
                    .on("newMessage", (channel, data) => {
    
                        let newMessage = {
                            _id: data.message.id,
                            createdAt: data.message.created_at,
                            text: data.message.message,
                            sent: true,
                            received: false,
                            user: { 
                                _id: data.message.user_id
                            }
                        }
                        
                        const isAdminOrCorp = data.message.admin_id && data.message.admin_id !== this.state.userLedgeId;
                        const isMessageAlert = data.message.user_id && this.state.userLedgeId && 
                            parseInt(data.message.user_id) !== parseInt(this.state.userLedgeId);
                        const isNewMessage = this.state.messages && 
                            !this.state.messages.some((message) => message._id === newMessage._id) && 
                            ( isMessageAlert || isAdminOrCorp);
    
                        this.setState(state => {
                            if (isNewMessage) {
                                return {
                                    messages: GiftedChat.append(state.messages, newMessage),
                                };
                            }
                        });
    
                        this.setState({ lastIdMessage: data.message.id });
                        if (data.message.is_seen == 0 && data.message.user_id !== this.props.ledger) {
                            this.seeMessage();
                        }
                    });
            }
        }  catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: `LibChat.RideChatScreen.subscribeSocket(${this.state.conversation_id})`,
                error,
            });
        }
    }

    async unsubscribeSocket() {
        if (WebSocketServer.socket != undefined && WebSocketServer.socket != null) {
            if (this.state.conversation_id) {
                try {
                    WebSocketServer.socket.removeAllListeners("newConversation")
                    WebSocketServer.socket.removeAllListeners("newMessage")
                    WebSocketServer.socket.removeAllListeners("readMessage")
                    WebSocketServer.socket.emit("unsubscribe", {
                        channel: "conversation." + this.state.conversation_id
                    })
                } catch (error) {
                    handleException({
                        baseUrl: this.state.baseUrl,
                        projectName: this.state.projectName,
                        appType: this.state.appType,
                        errorInfo: 'LibChat.RideChatScreen.unsubscribeSocket()',
                        error,
                    });
                }
            }
        }
    }

    async unsubscribeSocketNewConversation() {
        try {
            if(WebSocketServer.socket != undefined && WebSocketServer.socket != null) {
                WebSocketServer.socket.removeAllListeners("newConversation");
            }
        }  catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.unsubscribeSocketNewConversation()',
                error,
            });
        }
    }

    /**
     * set messages array with the new message
     * @param {any} messages 
     */
    async onSend(messages = []) {
        try {
            
            let type = 'text';
            let formatted = messages[0].text;
            let conversationId = 0;
            if(this.state.conversation_id) {
                conversationId = this.state.conversation_id;
            }
            
            const response = await sendMessage(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.requestId,
                formatted,
                this.state.receiveID,
                type,
                conversationId,
            );

            var responseJson = response.data;

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

            if (this.state.messages.length > 0) {
                this.setState(previousState => ({
                    messages: GiftedChat.append(previousState.messages, messages),
                }));
            }
        } catch (error) {
            handleException({
                baseUrl: this.state.baseUrl,
                projectName: this.state.projectName,
                appType: this.state.appType,
                errorInfo: 'LibChat.RideChatScreen.onSend()',
                error,
            });
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
        const isConversation = this.state.conversation_id && this.state.conversation_id != 0;
        return (
            <View style={styles.container}>
                <View style={{ marginLeft: 25 }}>
                    <Toolbar onPress={() => this.props.navigation.goBack()} />
                </View>
                { !isConversation 
                    ? ( <View style={styles.containerNoConversation}>
                            <Text style={styles.textNoConversation}> Chat ainda não iniciado. Envie uma mensagem para iniciar. </Text>
                        </View>)
                    : null
                }                
                <GiftedChat
                    messages={this.state.messages}
                    placeholder={strings.send_message}
                    locale={strings.locale}
                    dateFormat='L'
                    onSend={messages => this.onSend(messages)}
                    user={{ _id: this.state.userLedgeId }}
                    renderUsernameOnMessage={false}
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
    containerNoConversation: {
        margin: 25, 
        padding: 5, 
        borderRadius: 5, 
        backgroundColor: '#687a95', 
        display: 'flex', 
        justifyContent: 'center' 
    },
    textNoConversation: {
        fontSize: 18, 
        textAlign: 'center', 
        color: '#FFF'
    }
});

export default withNavigation(RideChatScreen);