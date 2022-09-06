import React, { Component } from 'react';
import { 
    View,
    TouchableOpacity,
    StyleSheet,
    Vibration,
    Image
} from 'react-native';
import { withNavigation } from 'react-navigation';
import { getConversation } from '../services/api';
import WebSocketServer from "../services/socket";
import Sound from "react-native-sound";
import Badger from './Badger';
import { handlerException } from '../../../../App/Services/Exception';

const icon = require('react-native-chat/src/img/chat.png');

class RideButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            receiveID: 0,
            conversation_id: 0,
            contNewMensag: 0,
            audio: this.props.audio,
            playSound: null,
            playSoundError: true,
        }

        this.connectSocket();

        this.willFocus = this.props.navigation.addListener("willFocus", async () => {
            await this.getConversation();
            await this.connectSocket();
            this.subscribeSocketNewConversation(this.props.request_id);
        });

        this.willBlur = this.props.navigation.addListener("willBlur", async () => {
			await this.unsubscribeSocket();
			await this.unsubscribeSocketNewConversation();
		});
    }

    async connectSocket() {
        try {
            if (!WebSocketServer.isConnected) {
                this.socket = WebSocketServer.connect(this.props.socket_url);
            } else {
                this.socket = WebSocketServer.socket;
            }
        } catch (error) {
            handlerException('connectSocket - RideButton', error);
        }
    }

    componentDidMount() {

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
        
    }

    subscribeSocketConversation(id) {
		console.log('subscribeSocketConversation', id)
		this.socket
			.emit("subscribe", { channel: "conversation." + id })
			.on("newMessage", (channel, data) => {
                this.setState({
                    contNewMensag: this.state.contNewMensag + 1
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
                        contNewMensag: 1
                    });
					console.log('Evento socket newConversation disparado! ', channel, data)
				})
		} catch (error) {
			console.log('Erro subscribeSocketNewConversation:', error)
		}
    }

    async unsubscribeSocketNewConversation() {
        this.socket.removeAllListeners("newConversation");
    }

    async unsubscribeSocket() {
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

    async getConversation() {
		try {
			const data = await this.callApiConversation();
            console.log('getConversation', data);

            this.subscribeSocketConversation(data.id);
            
			this.setState({
                receiveID: data.user.id,
                conversation_id: data.id,
                contNewMensag: data.new_messages
			})

		} catch (error) {
			console.log('Erro getConversation:', error)
		}
    }

    async callApiConversation() {
        try {
            const response = await getConversation(
                this.props.url,
                this.props.id,
                this.props.token,
                this.props.request_id
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
    
    async navigateTo() {
        let conversationId = this.state.conversation_id;

        if (conversationId == 0) {
            const data = await this.callApiConversation();
            conversationId = data.id;
            console.log('conversationId', conversationId);
        }

        this.unsubscribeSocket();

        this.props.navigation.navigate('RideChatScreen', {
            receiveID: this.state.receiveID,
            conversation_id: conversationId,
            url: this.props.url,
            socket_url: this.props.socket_url,
            id: this.props.id,
            token: this.props.token,
            requestId: this.props.request_id,
            color: this.props.color,
            audio: this.state.audio
        })
    }

    render() {
        return (
            <View>
                <TouchableOpacity
                    style={styles.iconCallUser}
                    onPress={() => this.navigateTo()}
                    activeOpacity={0.6}
                >
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
            </View>
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
    }
});

export default withNavigation(RideButton);