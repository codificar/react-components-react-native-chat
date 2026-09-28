import React, { Component } from 'react';
import {
    GiftedChat,
    Send,
    Bubble,
    MessageText
} from 'react-native-gifted-chat';
import { View, StyleSheet, BackHandler, Image, RefreshControl } from 'react-native';
import Toolbar from '../components/ToolBar';
import { getMessageDirectChat, sendMessageDirectChat, responseQuickReply } from '../services/api';
import { withNavigation } from '@react-navigation/compat';
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';
import QuickReplies from 'react-native-gifted-chat/lib/QuickReplies';

const send = require('react-native-chat/src/img/send.png');

function resolveRouteParams(props) {
    const navParams = props.navigation && props.navigation.state && props.navigation.state.params;
    if (navParams && Object.keys(navParams).length) {
        return navParams;
    }
    return (props.route && props.route.params) || {};
}

function parseQuickReply(raw) {
    if (raw == null || raw === '') {
        return null;
    }
    if (typeof raw === 'object') {
        return raw;
    }
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.log('DirectChatScreen parseQuickReply Error:', error);
            return null;
        }
    }
    return null;
}

class DirectChatScreen extends Component {
    constructor(props) {
        super(props);
        const paramRoute = resolveRouteParams(this.props);

        this.state = {
            url: paramRoute.url,
            id: paramRoute.id,
            token: paramRoute.token,
            receiver: paramRoute.receiver,
            messages: [],
            conversation: 0,
            ledger_id: 0,
            is_refreshing: false,
        }

        this.socket = WebSocketServer.connect(paramRoute.socket_url);

        this.willBlur = this.props.navigation.addListener("blur", () => {
            this.unsubscribeSocket();
        })

        this.willFocus = this.props.navigation.addListener("focus", async () => {
            await this.getMessages();
        });

        this.getMessages();
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.goBack();
            return true;
        });
    }

    componentWillUnmount() {
        try {
            this.backHandler && this.backHandler.remove();
            this.willBlur && this.willBlur();
            this.willFocus && this.willFocus();
            this.unsubscribeSocket();
        } catch (error) {
            console.log('DirectChatScreen componentWillUnmount Error:', error);
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
                WebSocketServer.unsubscribeChannel("conversation." + conversationId);
            }
            this._subscribedConversationId = null;
        }
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
            const response = await getMessageDirectChat(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.receiver
            );
    
            const { data } = response;
            const rawMessages = data.messages || [];
            const formattedArrayMessages = this.formatMessages(rawMessages);
            const conversationId =
                (rawMessages.length > 0 && rawMessages[0].conversation_id) ||
                data.conversation_id ||
                0;

            this.setState({ 
                messages: formattedArrayMessages,
                ledger_id: data.user_ledger_id,
                conversation: conversationId || 0,
                is_refreshing: false,
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
                const message = messages[i];
                const baseMessage = {
                    _id: message.id,
                    createdAt: message.created_at,
                    text: message.message,
                    user: { _id: message.user_id },
                    image: message.picture ? this.state.url + '/uploads/' + message.picture : null
                };

                const quickReply = parseQuickReply(message.response_quick_reply);

                if (quickReply && quickReply.answered == null) {
                    finalArrayMessages.unshift({
                        ...baseMessage,
                        quickReplies: {
                            type: 'radio',
                            keepIt: true,
                            values: quickReply.values,
                        }
                    });
                } else {
                    finalArrayMessages.unshift(baseMessage);
                }
            } catch (error) {
                console.log('DirectChatScreen formatMessages item Error:', error);
            }
        }

        return finalArrayMessages;
    }

    async onQuickReply(quickReply) {
        var delivery_package_id = quickReply[0].delivery_package_id;
        var value = quickReply[0].value;
        var message_id = quickReply[0].messageId;
        var auto_response = quickReply[0].auto_response;
        var conversation = quickReply[0].conversation;
        var response = await responseQuickReply(
            this.state.url,
            this.state.id,
            this.state.token,
            {
                value,
                delivery_package_id,
                message_id,
                auto_response,
                receiver: this.state.ledger_id,
                conversation
            },
        );
        
        this.props.navigation.goBack();
    }

    /**
     * set messages array with the new message
     * @param {String} messages
     */
    async onSend(messages = []) {
        try {
            
            const response = await sendMessageDirectChat(
                this.state.url,
                this.state.id,
                this.state.token,
                this.state.receiver,
                messages[0].text
            )
    
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
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * @description  subscribe scoket
     */
    subscribeSocket(conversationId) {
        const id = conversationId || this.state.conversation;

        if (this.socket === null || !id) {
            return;
        }

        console.log(
            `Tentando se conectar no canal conversation.${id}`,
        );

        if (this._onNewMessage) {
            this.socket.off('newMessage', this._onNewMessage);
        }

        this._onNewMessage = (channel, data) => {
            console.log(
                '===========Evento socket newMessage disparado! ',
                channel,
                data,
            );

            if (!data || !data.message) {
                return;
            }

            const message = data.message;
            const newMessage = {
                _id: message.id,
                createdAt: message.created_at,
                text: message.message,
                sent: true,
                received: false,
                user: { _id: message.user_id },
            };

            this.setState(state => {
                const alreadyExists = (state.messages || []).some(
                    item => String(item._id) === String(newMessage._id)
                );
                if (alreadyExists) {
                    return null;
                }

                if (Number(message.user_id) === Number(this.state.ledger_id)) {
                    return null;
                }

                return {
                    messages: GiftedChat.append(state.messages, newMessage),
                };
            });
        };

        this.socket.on('newMessage', this._onNewMessage);

        const channel = `conversation.${id}`;

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

     /**
     * render custom text message
     *  @param {any} props
     */
    renderMessageQuickReplies(props) {
        return (
            <QuickReplies
                {...props}
                textStyle={{ right: styles.messageTextRight, left: styles.messageText }}
            />
        )
    }


    render() {
        return (
            <View style={styles.container}>
                <View style={{ marginLeft: 25 }}>
                    <Toolbar onPress={() => this.props.navigation.goBack()}/>
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
                    renderQuickReplies={this.renderMessageQuickReplies}
                    onQuickReply={(quickReply) => this.onQuickReply(quickReply)}
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

export default withNavigation(DirectChatScreen);
