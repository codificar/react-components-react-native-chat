import React, { Component } from 'react';
import { 
    View,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Text,
    Image
} from 'react-native';
import { withNavigation } from 'react-navigation';
import { listProvidersForConversation } from '../services/api';
import Toolbar from '../components/ToolBar';
import { TextInput } from 'react-native-gesture-handler';

class ListProvidersForConversation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: this.props.navigation.state.params.url,
            socket_url: this.props.navigation.state.params.socket_url,
            id: this.props.navigation.state.params.id,
            token: this.props.navigation.state.params.token,
            providers: []
        }
    }

    componentDidMount() {
        this.listProvidersForConversation();
    }

    async listProvidersForConversation(name = '') {
        try {
            const response = await listProvidersForConversation(
                this.state.url,
                this.state.id,
                this.state.token,
                name
            );

            const { data } = response;
            this.setState({
                providers: data.providers
            })
        } catch (error) {
            console.log(error);
        }
    }

    handleName(name) {
        this.listProvidersForConversation(name);
    }

    render() {
        return (
            <View style={styles.container}>
                <View>
                    <Toolbar />
                    <Text style={styles.title}>Prestadores</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder='Procurar prestador'
                    onChangeText={name => this.handleName(name)}
                />
                <View>
                    <FlatList 
                        data={this.state.providers}
                        keyExtractor={(x, i) => i.toString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => this.props.navigation.navigate('DirectChatScreen', {
                                    url: this.state.url,
                                    socket_url: this.state.socket_url,
                                    id: this.state.id,
                                    token: this.state.token,
                                    receiver: item.id
                                })}
                            >
                                <View style={styles.row} >
                                    <Image
                                        style={styles.img}
                                        source={{ uri: item.picture }}
                                    />
                                    <Text style={styles.row_txt} numberOfLines={1}>
                                        {item.first_name + ' ' + item.last_name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 25,
        marginBottom: 40
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
        fontSize: 16
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingLeft: 20,
        paddingRight: 10,
        paddingVertical: 10,
        margin: 5,
        marginBottom: 10
    }
});

export default withNavigation(ListProvidersForConversation);