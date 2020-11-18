import React, { Component } from 'react';
import {
    StyleSheet,
    Image
} from 'react-native';

const default_img = require('react-native-chat/src/img/user.png');

class PerfilImage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            image: { 
                uri: this.props.src
            }
        }
    }

    imageFallback() {
        this.setState({
            image: default_img
        });
    }

    render() {
        return (
            <Image
                style={styles.img}
                source={this.state.image}
                onError={() => this.imageFallback()}
            />
        );
    }
}

const styles = StyleSheet.create({
    img: {
        width: 50,
        height: 50,
        borderRadius: 50,
        marginRight: 25
    }
});

export default PerfilImage;