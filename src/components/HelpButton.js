import React, { Component } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity,
    StyleSheet,
    Image
} from 'react-native';
import { withNavigation } from 'react-navigation';

const icon = require('react-native-chat/src/img/chat.png');

class HelpButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <View>
                <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => this.props.navigation.navigate('HelpChatScreen', {
                        url: this.props.url,
                        socket_url: this.props.socket_url,
                        id: this.props.id,
                        token: this.props.token,
                        request_id: this.props.request_id
                    })}
                >
                    <Image 
                        style={styles.img}
                        source={icon}
                    />
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
    img: {
        height: 22,
        width: 22
    }
});

export default withNavigation(HelpButton);