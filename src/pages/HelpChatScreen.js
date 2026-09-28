import React, { Component } from 'react';
import {
    GiftedChat,
    Send,
    Bubble,
    MessageText
} from 'react-native-gifted-chat';
import { View, StyleSheet, BackHandler, Image, RefreshControl } from 'react-native';
import Toolbar from '../components/ToolBar';
import { getMessageHelpChat, sendMessageHelpChat } from '../services/api';
import { withNavigation } from '@react-navigation/compat';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';

const send = require('react-native-chat/src/img/send.png');

function resolveRouteParams(props) {
    const navParams = props.navigation && props.navigation.state && props.navigation.state.params;
    if (navParams && Object.keys(navParams).length) {
        return navParams;
    }
    return (props.route && props.route.params) || {};
}

class HelpChatScreen extends Component {
    constructor(props) {
        super(props);
        const paramRoute = resolveRouteParams(this.props);

        this.state = {
            url: paramRoute.url,
            id: paramRoute.id,
            token: paramRoute.token,
            request_id: paramRoute.request_id,
            conversation: null,
            messages: [],
            ledger_id: 0,
            is_refreshing: false
        }

        this.socket = WebSocketServer.connect(paramRoute.socket_url);

        this.willBlur = this.props.navigation.addListener("blur", () => {
            this.unsubscribeSocket();
        })
    }

    async componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.goBack();
            return true;
        });

        await this.getMessages();
    }

    componentWillUnmount() {
        try {
            this.backHandler && this.backHandler.remove();
            this.willBlur && this.willBlur();
            this.unsubscribeSocket();
        } catch (error) {
            console.log('HelpChatScreen componentWillUnmount Error:', error);
        }
	}


    unsubscribeSocket() {
        if (this.socket != null) {
            if (this._onNewMessage) {
                this.socket.off("newMessage", this._onNewMessage);
                this._onNewMessage = null;
            }
            const conversationId = this._subscribedConversationId || this.state.conversation;
            if (conversationId) {
                this.socket.emit("unsubscribe", {
                    channel: "conversation." + conversationId
                })
            }
            this._subscribedConversationId = null;
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

        const conversationId = response.data && response.data.conversation_id;
        if (!this.state.conversation && conversationId) {
            this.setState({
                conversation: conversationId
            });
            this.subscribeSocket(conversationId);
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
    
            const { data } = response;
            const rawMessages = data.messages || [];
            const formattedArrayMessages = this.formatMessages(rawMessages);
            const conversationId =
                (rawMessages.length > 0 && rawMessages[0].conversation_id) ||
                data.conversation_id ||
                null;

            this.setState({ 
                messages: formattedArrayMessages,
                ledger_id: data.user_ledger_id,
                conversation: conversationId,
                is_refreshing: false
            });

            if (conversationId) {
                this.subscribeSocket(conversationId);
            }
            
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
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return [];
        }

        const finalArrayMessages = [];
        for (let i = 0; i < messages.length; i++) {
            try {
                finalArrayMessages.unshift({
                    _id: messages[i].id,
                    createdAt: messages[i].created_at,
                    text: messages[i].message,
                    user: { _id: messages[i].user_id },
                });
            } catch (error) {
                console.log('HelpChatScreen formatMessages item Error:', error);
            }
        }

        return finalArrayMessages;
    }

    /**
     * @description  subscribe scoket
     */
    subscribeSocket(conversationId) {
        const id = conversationId || this.state.conversation;

        if (this.socket !== null && id) {
            console.log(
                `Tentando se conectar no canal conversation.${id}`,
            );

            if (this._onNewMessage) {
                this.socket.off('newMessage', this._onNewMessage);
            }

            this._subscribedConversationId = id;

            this._onNewMessage = (channel, data) => {
                console.log(
                    '===========Evento socket newMessage disparado! ',
                    channel,
                    data,
                );

                const newMessage = {
                    _id: data.message.id,
                    createdAt: data.message.created_at,
                    text: data.message.message,
                    sent: true,
                    received: false,
                    user: { _id: data.message.user_id },
                };

                this.setState(state => {
                    const lastMessage = state.messages[state.messages.length - 1];
                    if (
                        (!lastMessage || newMessage._id !== lastMessage._id) &&
                        data.message.user_id !== this.state.ledger_id
                    ) {
                        return {
                            messages: GiftedChat.append(state.messages, newMessage),
                        };
                    }
                    return null;
                });
            };

            this.socket
            .emit('subscribe', {
                channel: `conversation.${id}`,
            })
            .on('newMessage', this._onNewMessage)
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

    render() {
        return (
            <View style={styles.container}>
                <View style={{ marginLeft: 25 }}>
                    <Toolbar onPress={() => this.props.navigation.goBack()} />
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
