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
            audio: paramRoute.audio,
            conversations: [],
            show_new_conversation: false,
            is_refreshing: false
        }

        /*this.willFocus = this.props.navigation.addListener("willFocus", () => {
            this.listDirectConversations();
        });*/
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.props.navigation.goBack();
            return true;
        });

        this.listDirectConversations();
    }

    componentWillUnmount() {
		this.backHandler.remove();
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
            this.setState({
                is_refreshing: false,
                conversations: data.conversations
            });
        } catch (error) {
            this.setState({
                is_refreshing: false
            });
            console.log(error);
        }
    }

    navigateToChatScreen(item) {
        if (!item.request_id || item.request_id == 0)
            this.props.navigation.navigate('ChatStack', {
                screen: 'DirectChatScreen',
                params: {
                    url: this.state.url,
                    socket_url: this.state.socket_url,
                    id: this.state.id,
                    token: this.state.token,
                    receiver: item.id,
                    audio: this.state.audio,
            }})
        else
            this.props.navigation.navigate('ChatStack', {
                screen: 'RideChatScreen',
                params: {
                    conversation_id: item.conversation_id,
                    url: this.state.url,
                    socket_url: this.state.socket_url,
                    id: this.state.id,
                    token: this.state.token,
                    requestId: item.request_id,
                    color: '#687a95',
                    audio: this.state.audio,
            }});
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
                            onPress={() => this.props.navigation.navigate('ChatStack', {
                                screen: 'ListProvidersForConversation',
                                params: {
                                    url: this.state.url,
                                    socket_url: this.state.socket_url,
                                    id: this.state.id,
                                    token: this.state.token
                            }})}
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
