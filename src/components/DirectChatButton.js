import React, { Component } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Vibration,
    Image,
    Text
} from 'react-native';
import { withNavigation } from 'react-navigation';
import { getConversation } from '../services/api';
import WebSocketServer from "../services/socket";
import Badger from './Badger';

const icon = require('react-native-chat/src/img/chat.png');
import strings from '../lang/strings';

class DirectChatButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            receiveID: 0,
            contNewMensag: 0
        }
    }

    componentDidMount() {

    }

    async navigateTo() {
        this.props.navigation.navigate('DirectChatScreen', {
            receiver: this.props.receiver,
            url: this.props.url,
            socket_url: this.props.socket_url,
            id: this.props.id,
            token: this.props.token,
        })
    }

    render() {
        return (
            <TouchableOpacity
                style={styles.touchable}
                onPress={() => this.navigateTo()}>
                <View style={styles.childrenTouchable}>
                   <Image
                        style={styles.img}
                        source={icon}
                   />
                </View>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    touchable: {
        height: 55,
        width: '30%',
        borderRadius: 5,
        elevation: 5,
        backgroundColor: 'white'
    },
    childrenTouchable: {
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white'
    },
    img: {
        height: 22,
        width: 22
    }
    
});

export default withNavigation(DirectChatButton);