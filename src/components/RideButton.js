import React, { Component } from 'react';
import { 
    View,
    TouchableOpacity,
    StyleSheet,
    Vibration,
    Image,
    Text
} from 'react-native';
import { withNavigation } from '@react-navigation/compat';
import { getConversation } from '../services/api';
import WebSocketServer from "../services/socket";
import Badger from './Badger';
import { FloatingAction } from "react-native-floating-action";

const icon = require('react-native-chat/src/img/chat.png');

class RideButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            receiveID: 0,
            conversation_id: 0,
            userName: '',
            userAvatar: '',
            contNewMensag: 0,
            is_customer_chat: this.props.is_customer_chat ? this.props.is_customer_chat : 0,
            text: this.props.text ? this.props.text : '',
            buttonStyle: this.props.buttonStyle ? this.props.buttonStyle : styles.iconCallUser
        }

        this.socket = WebSocketServer.connect(this.props.socket_url);

        this.focusListener = this.props.navigation.addListener("focus", async () => {
            await this.getConversation();
            this.subscribeSocketNewConversation(this.props.request_id);
        });
    }

    componentDidMount() {
        this.getConversation();
        this.subscribeSocketNewConversation(this.props.request_id);
    }

    componentWillUnmount() {
        try {
            this.focusListener && this.focusListener();
            this.unsubscribeSocket();
            this.unsubscribeSocketNewConversation();
        } catch (error) {
            console.log('RideButton componentWillUnmount Error:', error);
        }
    }

    subscribeSocketConversation(id) {
		console.log('subscribeSocketConversation', id)
        if (!this.socket || !id) {
            return;
        }

        if (this._onConversationNewMessage) {
            this.socket.off("newMessage", this._onConversationNewMessage);
        }

        this._onConversationNewMessage = (channel, data) => {
            this.playSoundRequest();
            this.setState({
                contNewMensag: this.state.contNewMensag + 1
            });
        };

        this.socket.on("newMessage", this._onConversationNewMessage);

        const channel = "conversation." + id;
        if (this._subscribedConversationChannel === channel) {
            WebSocketServer.emitSubscribe(channel);
            return;
        }

        if (this._subscribedConversationChannel) {
            WebSocketServer.unsubscribeChannel(this._subscribedConversationChannel);
        }

        this._subscribedConversationChannel = channel;
        WebSocketServer.subscribeChannel(channel);
	}

    subscribeSocketNewConversation(id_request) {
		console.log('subscribeSocketNewConversation')
		try {
            if (!this.socket || !id_request) {
                return;
            }

            if (this._onNewConversation) {
                this.socket.off("newConversation", this._onNewConversation);
            }

            this._onNewConversation = (channel, data) => {
                this.setState({
                    conversation_id: data.conversation_id,
                    contNewMensag: 1
                });
                this.playSoundRequest()
                console.log('Evento socket newConversation disparado! ', channel, data)
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
		} catch (error) {
			console.log('Erro subscribeSocketNewConversation:', error)
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

    unsubscribeSocket() {
        if (this.socket != null) {
            if (this._onConversationNewMessage) {
                this.socket.off("newMessage", this._onConversationNewMessage);
                this._onConversationNewMessage = null;
            }
            if (this._subscribedConversationChannel) {
                WebSocketServer.unsubscribeChannel(this._subscribedConversationChannel);
                this._subscribedConversationChannel = null;
            } else if (this.state.conversation_id) {
                WebSocketServer.unsubscribeChannel(
                    "conversation." + this.state.conversation_id
                );
            }
        }
    }
    
    /**
     * Play the sound request
     */
    playSoundRequest() {
        Vibration.vibrate();
    }

    async getConversation() {
		try {
			const data = await this.callApiConversation();
            console.log('getConversation', data);

            if (!data || !data.id) {
                return;
            }

            this.subscribeSocketConversation(data.id);
            
			this.setState({
                receiveID: data.user && data.user.id,
                conversation_id: data.id,
                userName: data.user && data.user.name,
                userAvatar: data.user && data.user.image,
                contNewMensag: data.new_messages
			})

		} catch (error) {
			console.log('Erro getConversation:', error)
		}
    }

    async callApiConversation(is_customer_chat = 0) {
        try {
            const response = await getConversation(
                this.props.url,
                this.props.id,
                this.props.token,
                this.props.request_id,
                is_customer_chat
            );

            const { data } = response;
            if (!data || !data.conversations || !data.conversations[0]) {
                return null;
            }

            return data.conversations[0];
        } catch (error) {
            console.log('Erro callApiConversation:', error);
            return null;
        }
    }

    handleChat(name = 'bt_institution') {
        if (name == 'bt_institution') {
            this.navigateTo(0);
        } else {
            this.navigateTo(1);
        }
    }
    
    async navigateTo(is_customer_chat = 0) {
        let conversationId = this.state.conversation_id;
        let userName = this.state.userName;
        let userAvatar = this.state.userAvatar;
        let receiveID = this.state.receiveID;

        if (!conversationId) {
            const data = await this.callApiConversation(is_customer_chat);
            if (data && data.id) {
                conversationId = data.id;
                userName = (data.user && data.user.name) || userName;
                userAvatar = (data.user && data.user.image) || userAvatar;
                receiveID = (data.user && data.user.id) || receiveID;
                console.log('conversationId', conversationId);
            } else {
                conversationId = 0;
            }
        }

        this.props.navigation.navigate('RideChatScreen', {
            receiveID: receiveID,
            conversation_id: conversationId || 0,
            url: this.props.url,
            socket_url: this.props.socket_url,
            id: this.props.id,
            token: this.props.token,
            is_customer_chat: is_customer_chat,
            requestId: this.props.request_id,
            color: this.props.color,
            userName: userName,
            userAvatar: userAvatar,
            impersonate: this.props.impersonate
        })
    }

    render() {
        return (
            this.props.impersonate ? (
                <FloatingAction
                    color="white"
                    position="left"
                    floatingIcon={icon}
                    distanceToEdge={this.props.distanceToEdge}
                    actions={this.props.actions}
                    onPressItem={name => {
                        this.handleChat(name);
                    }}
                />
            ) : (
                <TouchableOpacity
                    style={this.state.buttonStyle}
                    onPress={() => this.navigateTo(this.state.is_customer_chat)}
                    activeOpacity={0.6}
                >
                    { this.state.text.length > 0 && (
                        <Text style={styles.title}>{this.state.text}</Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <Badger contador={this.state.contNewMensag}
                            position={{
                                position: 'absolute',
                                top: -8,
                                left: -8,
                                zIndex: 999
                            }} />
                        <Image 
                            style={styles.img}
                            source={icon}
                        />
                    </View>
                </TouchableOpacity>
            )
        );
    }
}

const styles = StyleSheet.create({
    chatBtn: {
        marginRight: 16,
        backgroundColor: '#eee',
        width: 45,
        height: 45,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconCallUser: {
        backgroundColor: '#F5F5F5',
        borderRadius: 50,
        height: 45,
        width: 45,
        top: -10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    img: {
        height: 22,
        width: 22
    },
    title: {
        textAlign: 'center',
        marginRight: 10
    }
});

export default withNavigation(RideButton);
