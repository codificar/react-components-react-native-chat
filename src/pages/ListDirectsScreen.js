import React, { Component } from 'react';
import { 
    View,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Text,
    Image,
    BackHandler,
    RefreshControl
} from 'react-native';
import { withNavigation } from '@react-navigation/compat';
import { listDirectConversations } from '../services/api';
import Toolbar from '../components/ToolBar';
import strings from '../lang/strings';
import PerfilImage from '../components/PerfilImage';
import WebSocketServer from '../services/socket';

const box_img = require('react-native-chat/src/img/box.png');

class ListDirectsScreen extends Component {
    constructor(props) {
        super(props);
        var paramRoute = this.props.navigation.state != undefined ? this.props.navigation.state.params : this.props.route.params;

        if (paramRoute === undefined)
            paramRoute = this.props.route.params;

        this.state = {
            url: paramRoute.url,
            socket_url: paramRoute.socket_url,
            id: paramRoute.id,
            token: paramRoute.token,
            app_type: paramRoute.app_type,
            conversations: [],
            show_new_conversation: false,
            is_refreshing: false
        }

        this._subscribedChannels = [];
        this.socket = WebSocketServer.connect(paramRoute.socket_url);

        this.willFocus = this.props.navigation.addListener("focus", () => {
            this.listDirectConversations();
        });

        this.willBlur = this.props.navigation.addListener("blur", () => {
            this.unsubscribeConversationSockets();
        });
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
            this.willFocus && this.willFocus();
            this.willBlur && this.willBlur();
            this.unsubscribeConversationSockets();
        } catch (error) {
            console.log('ListDirectsScreen componentWillUnmount Error:', error);
        }
    }

    unsubscribeConversationSockets() {
        if (this._onNewMessage && this.socket) {
            this.socket.off('newMessage', this._onNewMessage);
            this._onNewMessage = null;
        }

        (this._subscribedChannels || []).forEach((channel) => {
            WebSocketServer.unsubscribeChannel(channel);
        });
        this._subscribedChannels = [];
    }

    subscribeConversationSockets(conversations) {
        this.unsubscribeConversationSockets();

        if (!this.socket || !conversations || !conversations.length) {
            return;
        }

        this._onNewMessage = (channel, data) => {
            if (!data || !data.message) {
                return;
            }

            const message = data.message;
            const conversationId = message.conversation_id;
            if (!conversationId) {
                return;
            }

            const preview =
                message.message ||
                (message.picture ? '[imagem]' : '');

            this.setState((state) => {
                const conversations = (state.conversations || []).map((item) => {
                    if (String(item.conversation_id) !== String(conversationId)) {
                        return item;
                    }

                    return {
                        ...item,
                        last_message: preview || item.last_message,
                        time: message.created_at || item.time,
                    };
                });

                return { conversations };
            });
        };

        this.socket.on('newMessage', this._onNewMessage);

        const channels = [];
        conversations.forEach((item) => {
            if (!item.conversation_id) {
                return;
            }
            const channel = 'conversation.' + item.conversation_id;
            if (channels.indexOf(channel) !== -1) {
                return;
            }
            channels.push(channel);
            WebSocketServer.subscribeChannel(channel);
        });

        this._subscribedChannels = channels;
    }

    async listDirectConversations() {
        this.setState({
            is_refreshing: true
        });

        try {
            const response = await listDirectConversations(
                this.state.url,
                this.state.id,
                this.state.token
            );

            const { data } = response;
            const conversations = data.conversations || [];
            this.setState({
                is_refreshing: false,
                conversations
            });
            this.subscribeConversationSockets(conversations);
        } catch (error) {
            this.setState({
                is_refreshing: false
            });
            console.log(error);
        }
    }

    navigateToChatScreen(item) {
        if (!item.request_id || item.request_id == 0)
            this.props.navigation.navigate('DirectChatScreen', {
                    url: this.state.url,
                    socket_url: this.state.socket_url,
                    id: this.state.id,
                    token: this.state.token,
                    receiver: item.id,
                    conversation_id: item.conversation_id
            })
        else
            this.props.navigation.navigate('RideChatScreen', {
                    conversation_id: item.conversation_id,
                    url: this.state.url,
                    socket_url: this.state.socket_url,
                    id: this.state.id,
                    token: this.state.token,
                    requestId: item.request_id,
                    color: '#687a95'
            });
    }

    render() {
        return (
            <View style={styles.container}>
                <View>
                    <Toolbar onPress={() => this.props.navigation.goBack()} />
                    <Text style={styles.title}>{strings.directs}</Text>
                </View>

                {
                    this.state.show_new_conversation &&
                    <View
                        style={styles.box_new}
                    >
                        <TouchableOpacity
                            onPress={() => this.props.navigation.navigate('ListProvidersForConversation', {
                                    url: this.state.url,
                                    socket_url: this.state.socket_url,
                                    id: this.state.id,
                                    token: this.state.token
                            })}
                        >
                            <Text style={styles.box_new_txt}>
                                {strings.new_direct}
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
                
                <View style={{ flex: 1 }}>
                    {
                        this.state.conversations.length > 0 
                        ?
                        <FlatList 
                            data={this.state.conversations}
                            keyExtractor={(x, i) => i.toString()}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    onPress={() => this.navigateToChatScreen(item)}
                                >
                                    <View style={styles.row} >
                                        
                                        <PerfilImage 
                                            src={item.picture}
                                        />

                                        <View
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <Text style={styles.timeText}>
                                                {item.time}
                                            </Text>

                                            <Text style={styles.row_txt} numberOfLines={1}>
                                                {item.full_name}
                                            </Text>

                                            <Text
                                                numberOfLines={1}
                                            >
                                                {item.last_message}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            refreshControl={
                                <RefreshControl
                                    colors={['#000']}
                                    refreshing={this.state.is_refreshing}
                                    onRefresh={() => this.listDirectConversations()} />
                            }
                        />
                        :
                        <View
                            style={styles.no_directs}
                        >
                            <Image
                                style={styles.img_box}
                                source={box_img}
                            />
                            <Text>{strings.no_directs}</Text>
                        </View>
                    }
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25
    },
    title: {
        color: "#222B45",
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10
    },  
    img: {
        width: 50,
        height: 50,
        borderRadius: 50,
        marginRight: 25
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#fff",
        borderRadius: 4,
        elevation: 3,
        paddingLeft: 20,
        paddingRight: 10,
        paddingVertical: 10,
        margin: 5
    },
    row_txt: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    box_new: {
        marginBottom: 15
    },
    box_new_txt: {
        fontWeight: 'bold',
        color: '#6666FF'
    },
    img_box: {
        width: 150,
        height: 150
    },
    no_directs: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    timeText: {
        textAlign: 'right',
        fontSize: 11
    }
});

export default withNavigation(ListDirectsScreen);
