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
            countNewMessage: 0,
            countNewMessageCustomer: 0,
            is_customer_chat: this.props.is_customer_chat || 0,
            text: this.props.text || '',
            buttonStyle: this.props.buttonStyle || styles.iconCallUser,
            titleStyle: this.props.titleStyle || styles.title,
            iconStyle: this.props.iconStyle || styles.img,
            actions: this.props.actions || []
        }

        this.socket = WebSocketServer.connect(this.props.socket_url);

        this.willFocus = this.props.navigation.addListener("focus", async () => {
            await this.getConversation();
            this.subscribeSocketNewConversation(this.props.request_id);
        });

        this.willBlur = this.props.navigation.addListener("blur", () => {
			this.unsubscribeSocket();
			this.unsubscribeSocketNewConversation();
		});
    }

    async componentDidMount() {
        let actions = this.state.actions;
        const newActions = actions.map(action => ({
            ...action,
            render: () => this.renderAction(action)
        }));
  
        this.setState({
            actions: newActions
        });

        await this.getConversation();

        if (this.props.refreshInterval) {
            this.refreshInterval = setInterval(async () => {
                await this.getConversation();
            }, this.props.refreshInterval);
        }
    }

    componentWillUnmount() {
        if (this.props.refreshInterval)
            clearInterval(this.refreshInterval);

        this.unsubscribeSocket();
        this.unsubscribeSocketNewConversation();
    }
  
    renderAction(action) {
        return (
            <>
                <View style={{ ...styles.actionButton, backgroundColor: action.color }}>
                    <Badger contador={ action.name === 'bt_customer' ? this.state.countNewMessageCustomer : this.state.countNewMessage }
                        position={{
                            position: 'absolute',
                            top: -8,
                            left: 28,
                            zIndex: 999,
                            elevation: 6
                        }}
                    />
                    <Image
                        style={{...styles.img, tintColor: 'white'}}
                        source={icon}
                    />
                </View>
                <View style={styles.viewTitle}>
                    <Text style={{ ...styles.title, marginLeft: 10 }}>{action.text}</Text>
                </View>
            </>
        )
    }

    subscribeSocketConversation(id) {
		console.log('subscribeSocketConversation', id)
		this.socket
			.emit("subscribe", { channel: "conversation." + id })
			.on("newMessage", (channel, data) => {

				this.playSoundRequest();
                this.setState({
                    countNewMessage: this.state.countNewMessage + 1
                });
			})
	}

    subscribeSocketNewConversation(id_request) {
		console.log('subscribeSocketNewConversation')
		try {
			this.socket.emit("subscribe", { channel: "request." + id_request })
				.on("newConversation", (channel, data) => {
                    this.setState({
                        conversation_id: data.conversation_id,
                        countNewMessage: 1
                    });
					this.playSoundRequest()
					console.log('Evento socket newConversation disparado! ', channel, data)
				})
		} catch (error) {
			console.log('Erro subscribeSocketNewConversation:', error)
		}
    }

    unsubscribeSocketNewConversation() {
        this.socket.removeAllListeners("newConversation");
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
    
    /**
     * Play the sound request
     */
    playSoundRequest() {
        Vibration.vibrate();
    }

    async getConversation() {
		try {
			const dataPromise = this.callApiConversation(0);
            const dataCustomerChatPromise = this.callApiConversation(1);

            const [data, dataCustomerChat] = await Promise.all([dataPromise, dataCustomerChatPromise]);

            if (data.id !== 0)
                this.subscribeSocketConversation(data.id);
            if (dataCustomerChat.id !== 0)
                this.subscribeSocketConversation(dataCustomerChat.id);
            
			this.setState({
                receiveID: data.user.id,
                conversation_id: data.id,
                userName: data.user.name,
                userAvatar: data.user.image,
                countNewMessage: data.new_messages || 0,
                countNewMessageCustomer: dataCustomerChat.new_messages || 0
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

            return data.conversations[0];
        } catch (error) {
            console.log('Erro callApiConversation:', error);

            return {
                id: 0
            }
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

        const data = await this.callApiConversation(is_customer_chat);
        conversationId = data.id;
        userName = data.user.name;
        userAvatar = data.user.image;
        
        this.props.navigation.navigate('ChatStack', {
            screen: 'RideChatScreen', 
            params: {
                receiveID: this.state.receiveID,
                conversation_id: conversationId,
                url: this.props.url,
                socket_url: this.props.socket_url,
                id: this.props.id,
                token: this.props.token,
                is_customer_chat: is_customer_chat,
                requestId: this.props.request_id,
                color: this.props.color,
                userName: userName,
                userAvatar: userAvatar,
                impersonate: this.props.impersonate,
                refreshInterval: this.props.refreshInterval
        }})
    }

    render() {
        return (
            this.props.impersonate ? (
                <>
                    <FloatingAction
                        color="white"
                        position="left"
                        floatingIcon={icon}
                        distanceToEdge={this.props.distanceToEdge}
                        actions={this.state.actions}
                        onPressItem={name => {
                            this.handleChat(name);
                        }}
                    />
                    <Badger contador={this.state.countNewMessage + this.state.countNewMessageCustomer}
                        position={{
                            bottom: this.props.distanceToEdge.vertical + 40,
                            position: 'absolute',
                            left: this.props.distanceToEdge.horizontal + 40,
                            zIndex: 999,
                            elevation: 6
                        }}
                    />
                </>
            ) : (
                <TouchableOpacity
                    style={this.state.buttonStyle}
                    onPress={() => this.navigateTo(this.state.is_customer_chat)}
                    activeOpacity={0.6}
                >
                    { this.state.text.length > 0 && (
                        <Text style={this.state.titleStyle}>{this.state.text}</Text>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <Badger contador={this.state.is_customer_chat ? this.state.countNewMessageCustomer : this.state.countNewMessage}
                            position={{
                                position: 'absolute',
                                top: -10,
                                left: 10,
                                zIndex: 999,
                                elevation: 6
                            }}
                        />
                        <Image 
                            style={this.state.iconStyle}
                            source={icon}
                        />
                    </View>
                </TouchableOpacity>
            )
        );
    }
}

const styles = StyleSheet.create({
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 45,
        borderRadius: 22,
        aspectRatio: 1
    },
    viewTitle: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        marginLeft: 10,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 5
    },  
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