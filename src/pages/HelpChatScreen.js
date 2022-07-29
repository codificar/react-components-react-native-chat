import React, { Component } from 'react';
import {
    GiftedChat,
    Send,
    Bubble,
    MessageText
} from 'react-native-gifted-chat';
import { View, StyleSheet, BackHandler, Image, RefreshControl, Vibration } from 'react-native';
import Toolbar from '../components/ToolBar';
import Sound from "react-native-sound";
import { getMessageHelpChat, sendMessageHelpChat } from '../services/api';
import { withNavigation } from 'react-navigation';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';

const send = require('react-native-chat/src/img/send.png');

class HelpChatScreen extends Component {
    constructor(props) {
        super(props);
        const paramRoute = this.props.navigation.state != undefined ? this.props.navigation.state.params : this.props.route.params;

        this.state = {
            url: paramRoute.url,
            id: paramRoute.id,
            token: paramRoute.token,
            request_id: paramRoute.request_id,
            conversation: null,
            messages: [],
            ledger_id: 0,
            audio: paramRoute.audio,
            playSound: null,
            playSoundError: true,
            is_refreshing: false
        }

        if(!WebSocketServer.isConnected) {
            this.socket = WebSocketServer.connect(paramRoute.socket_url);
        } else {
            this.socket = WebSocketServer.socket;
        }

        this.willBlur = this.props.navigation.addListener("willBlur", async () => {
            await this.unsubscribeSocket();
            await this.unsubscribeSocketNewConversation();
        });

        this.willFocus = this.props.navigation.addListener("willFocus", async () => {
            await this.unsubscribeSocketNewConversation();
            await this.unsubscribeSocket();
            await this.getMessages();
            this.subscribeSocket();
        });
    }

    async componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', async () => {
            await this.unsubscribeSocket();
            await this.unsubscribeSocketNewConversation();
            this.props.navigation.goBack();
            return true;
        });


        const filenameOrFile = this.state.audio ? this.state.audio : "beep.wav";
        const basePath = this.state.audio ? null : Sound.MAIN_BUNDLE;

        const sound = new Sound(filenameOrFile, basePath, (error) => {
            if(error) {
                console.log('failed to load the sound', error);
                return;
            }
        });

        if(sound) {
            this.setState({ 
                playSound: sound,
                playSoundError: false 
            })
        }

        /*await this.getMessages();
        this.subscribeSocket();*/
    }

    async componentWillUnmount() {
        await this.unsubscribeSocketNewConversation();
		this.backHandler.remove();
		this.willBlur.remove();
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
        } catch (e) {
            console.log('playSound Error:', e);
        }

    }


    async unsubscribeSocketNewConversation() {
        await this.socket.removeAllListeners("newConversation");
    }

    async unsubscribeSocket() {
        if (this.socket != null) {
            if (this.state.conversation) {
                console.log('qweqwe', "conversation." + this.state.conversation);
                await this.socket.removeAllListeners("newConversation")
                await this.socket.removeAllListeners("newMessage")
                await this.socket.removeAllListeners("readMessage")
                await this.socket.emit("unsubscribe", {
                    channel: "conversation." + this.state.conversation
                })
            }
        }
    }

    /**
     * set messages array with the new message
     * @param {String} messages
     */
    async onSend(messages = []) {
        const response = await sendMessageHelpChat(
            this.state.url,
            this.state.id,
            this.state.token,
            messages[0].text,
            this.state.request_id
        );

        if (!this.state.conversation) {
            this.setState({
                conversation: response.data.conversation_id
            });
            //this.subscribeSocket();
        }

        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, messages),
        }));

        console.log('send', response.data);
    }

    /**
     * Get messages
     * @param {String} messages
     */
    async getMessages() {
        this.setState({
            is_refreshing: true
        });

        try {
            const response = await getMessageHelpChat(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.request_id
            );
    
            const { data } = response; console.log(data);
            const formattedArrayMessages = this.formatMessages(data.messages);
    
            this.setState({ 
                messages: formattedArrayMessages,
                ledger_id: data.user_ledger_id,
                is_refreshing: false
            });
            
        } catch (error) {
            this.setState({
                is_refreshing: false
            });
            console.log(error);
        }
    }

    /**
     * Format messages array
     * @param {*} messages 
     */
    formatMessages (messages) {
        const formattedArrayMessages = messages;

        if (formattedArrayMessages.length > 0) {
            this.setState({
                conversation: formattedArrayMessages[0].conversation_id
            })
            const finalArrayMessages = [];
            formattedArrayMessages.map(message => {
                if(message.response_quick_reply) {
                    let quickReply = JSON.parse(message.response_quick_reply);
                    if((!!message.response_quick_reply && quickReply.answered == null)){
                        finalArrayMessages.unshift({
                            _id: message.id,
                            createdAt: message.created_at,
                            text: message.message,
                            user: { _id: message.user_id },
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
                            user: { _id: message.user_id },
                            image: message.picture ? this.state.url + '/uploads/' + message.picture : null                        
                        });
                    }
                } else {
                    finalArrayMessages.unshift({
                        _id: message.id,
                        createdAt: message.created_at,
                        text: message.message,
                        user: { _id: message.user_id },
                        image: message.picture ? this.state.url + '/uploads/' + message.picture : null                        
                    });
                }
            });

            return finalArrayMessages;
        }

        return [];
    }

    /**
     * @description  subscribe scoket
     */
    subscribeSocket() {

        if (this.socket !== null && this.state.conversation !== null) {
            console.log(
                `Tentando se conectar no canal conversation.${this.state.conversation}`,
            );

            this.socket
            .emit('subscribe', {
                channel: `conversation.${this.state.conversation}`,
            })
            .on('newMessage', (channel, data) => {
                console.log(
                    '===========Evento socket newMessage disparado! ',
                    channel,
                    data,
                );

                let newMessage = {
                    _id: data.message.id,
                    createdAt: data.message.created_at,
                    text: data.message.message,
                    sent: true,
                    received: false,
                    user: { _id: data.message.user_id },
                };

                if(data.message.user_id !== this.state.ledger_id) {
                    this.playSoundRequest();
                }

                this.setState(state => {
                    if (
                        newMessage._id !==
                        state.messages[state.messages.length - 1]._id &&
                        data.message.user_id !== this.state.ledger_id
                    ) {
                        return {
                            messages: GiftedChat.append(state.messages, newMessage),
                        };
                    }
                });
            })
        }
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
        );
    }

    /**
     * render bubble
     * @param {any} props
     */
    renderBubble(props) {
        return (
            <Bubble
                {...props}
                wrapperStyle={{ left: styles.leftBubble, right: styles.rightBubble }}
            />
        );
    }

    /**
     * Render custom sender
     * @param {any} props
     */
    renderSend(props) {
        if (!props.text.trim()) return;

        return (
            <Send {...props}>
                <View style={styles.contImg}>
                    <Image 
                        style={styles.send}
                        source={send} 
                    />
                </View>
            </Send>
        );
    }

    /**
     * Mount RefreshControl
     */
    renderRefreshControl() {
        return <RefreshControl
            colors={['#000']}
            refreshing={this.state.is_refreshing}
            onRefresh={() => this.getMessages()} 
        />
    }

    async navigationGoBack() {
        await this.unsubscribeSocketNewConversation();
        await this.unsubscribeSocket();
        this.props.navigation.goBack();
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={{ marginLeft: 25 }}>
                    <Toolbar onPress={() => this.navigationGoBack()} />
                </View>
                <GiftedChat
                    messages={this.state.messages}
                    placeholder={strings.send_message}
                    locale="pt"
                    onSend={messages => this.onSend(messages)}
                    user={{ _id: this.state.ledger_id }}
                    renderMessageText={this.renderMessageText}
                    renderBubble={this.renderBubble}
                    renderSend={props => this.renderSend(props)}
                    listViewProps={{
                        refreshControl: this.renderRefreshControl()
                    }}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messageText: {
        color: '#211F1F',
    },
    messageTextRight: {
        color: '#fff',
    },
    time: {
        color: '#9aa2ab',
    },
    timeRight: {
        color: '#fff',
    },
    leftBubble: {
        marginLeft: -30,
        backgroundColor: '#FBFBFB',
        marginTop: 10,
        elevation: 5,
    },
    rightBubble: {
        backgroundColor: '#687a95',
        elevation: 5,
        marginTop: 10,
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
    }
});

export default withNavigation(HelpChatScreen);