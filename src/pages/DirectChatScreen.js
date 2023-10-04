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
import WebSocketServer from "../services/socket";
import strings from '../lang/strings';
import QuickReplies from 'react-native-gifted-chat/lib/QuickReplies';

const send = require('react-native-chat/src/img/send.png');

class DirectChatScreen extends Component {
    constructor(props) {
        super(props);
        const paramRoute = this.props.navigation.state != undefined ? this.props.navigation.state.params : this.props.route.params;

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
            this.subscribeSocket();
        });

        this.getMessages();
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.goBack();
            return true;
        });
    }

    unsubscribeSocket() {
        if (this.socket != null) {
            if (this.state.conversation) {
                console.log('qweqwe', "conversation." + this.state.conversation);
                this.socket.removeAllListeners("newConversation")
                this.socket.removeAllListeners("newMessage")
                this.socket.removeAllListeners("readMessage")
                this.socket.removeAllListeners("newConversation")
                this.socket.emit("unsubscribe", {
                    channel: "conversation." + this.state.conversation
                })
            }
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
            const formattedArrayMessages = this.formatMessages(data.messages);
    
            this.setState({ 
                messages: formattedArrayMessages,
                ledger_id: data.user_ledger_id,
                is_refreshing: false,
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
            
            for (let i = 0; i < formattedArrayMessages.length; i++) {
                let quickReply = JSON.parse(formattedArrayMessages[i].response_quick_reply);
                if((!!formattedArrayMessages[i].response_quick_reply && quickReply.answered == null)){
                    
                    finalArrayMessages.unshift({
                        _id: formattedArrayMessages[i].id,
                        createdAt: formattedArrayMessages[i].created_at,
                        text: formattedArrayMessages[i].message,
                        user: { _id: formattedArrayMessages[i].user_id },
                        image: formattedArrayMessages[i].picture ? this.state.url + '/uploads/' + formattedArrayMessages[i].picture : null,
                        quickReplies: {
                            type: 'radio', // or 'checkbox',
                            keepIt: true,
                            values: quickReply.values,
                            
                        }
                        
                    });
                } 
                else {
                    finalArrayMessages.unshift({
                        _id: formattedArrayMessages[i].id,
                        createdAt: formattedArrayMessages[i].created_at,
                        text: formattedArrayMessages[i].message,
                        user: { _id: formattedArrayMessages[i].user_id },
                        image: formattedArrayMessages[i].picture ? this.state.url + '/uploads/' + formattedArrayMessages[i].picture : null                        
                    });
                }
                

            
            }

            return finalArrayMessages;
        }

        return [];
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
    
            if (!this.state.conversation) {
                this.setState({
                    conversation: response.data.conversation_id
                });
                this.subscribeSocket();
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

                const newMessage = {
                    _id: data.message.id,
                    createdAt: data.message.created_at,
                    text: data.message.message,
                    sent: true,
                    received: false,
                    user: { _id: data.message.user_id },
                };

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

export default DirectChatScreen;