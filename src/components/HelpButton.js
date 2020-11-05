import React, { Component } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { withNavigation } from 'react-navigation';

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
                    <Text>
                        <Icon name="chat" size={25} color="#000" />
                    </Text>
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
    }
});

export default withNavigation(HelpButton);