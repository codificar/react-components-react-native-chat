/* eslint-disable class-methods-use-this */
/* eslint-disable react/sort-comp */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable no-use-before-define */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { Component } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Image,
} from 'react-native';
import { withNavigation } from 'react-navigation';
import { getConversation } from '../services/api';
import WebSocketServer from '../services/socket';
import Badger from './Badger';

const icon = require('react-native-chat/src/img/chat.png');

class RideButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      receiveID: 0,
      conversation_id: 0,
      contNewMensag: 0,
    };

    this.socket = WebSocketServer.connect(this.props.socket_url);
  }

  async componentDidMount() {
    await this.getConversation();
    this.timer = setInterval(async () => {
      await this.getConversation();
    }, 8002);
    this.subscribeSocketNewConversation(this.props.request_id);
  }

  componentWillUnmount() {
    try {
      clearTimeout(this.timer);
      this.unsubscribeSocket();
      this.unsubscribeSocketNewConversation();
    } catch (error) {
      console.log('this.componentWillUnmount Error:', error);
    }
  }

  subscribeSocketConversation(id) {
    this.socket
      .emit('subscribe', { channel: `conversation.${id}` })
      .on('newMessage', (_channel, data) => {
        this.playSoundRequest();
        this.setState({
          contNewMensag: this.state.contNewMensag + 1,
        });
      });
  }

  subscribeSocketNewConversation(id_request) {
    console.log({ id_request });
    try {
      this.socket
        .emit('subscribe', { channel: `request.${id_request}` })
        .on('newConversation', (channel, data) => {
          console.log('SocketNewMenssage');
          this.setState({
            conversation_id: data.conversation_id,
            contNewMensag: this.state.contNewMensag + 1,
          });
          this.playSoundRequest();
        });
    } catch (error) {
      console.log('Erro subscribeSocketNewConversation:', error);
    }
  }

  unsubscribeSocketNewConversation() {
    this.socket.removeAllListeners('newConversation');
  }

  unsubscribeSocket() {
    if (this.socket != null) {
      if (this.state.conversation_id) {
        this.socket.removeAllListeners('newConversation');
        this.socket.removeAllListeners('newMessage');
        this.socket.removeAllListeners('readMessage');
        this.socket.removeAllListeners('newConversation');
        this.socket.emit('unsubscribe', {
          channel: `conversation.${this.state.conversation_id}`,
        });
      }
    }
  }

  playSoundRequest() {
    Vibration.vibrate();
  }

  async getConversation() {
    try {
      const data = await this.callApiConversation();
      this.subscribeSocketConversation(data.id);
      this.setState({
        receiveID: data.user.id,
        conversation_id: data.id,
        contNewMensag: data.new_messages,
      });
    } catch (error) {
      console.log('Erro getConversation:', error);
    }
  }

  async callApiConversation() {
    try {
      const response = await getConversation(
        this.props.url,
        this.props.id,
        this.props.token,
        this.props.request_id,
      );

      const { data } = response;

      return data.conversations[0];
    } catch (error) {
      return {
        id: 0,
      };
    }
  }

  async navigateTo() {
    let conversationId = this.state.conversation_id;

    if (conversationId === 0) {
      const data = await this.callApiConversation();
      conversationId = data.id;
    }
    this.setState({
      contNewMensag: 0,
    });
    this.props.navigation.navigate('RideChatScreen', {
      receiveID: this.state.receiveID,
      conversation_id: conversationId,
      url: this.props.url,
      socket_url: this.props.socket_url,
      id: this.props.id,
      token: this.props.token,
      requestId: this.props.request_id,
      color: this.props.color,
    });
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
            <Badger
              contador={this.state.contNewMensag}
              position={{
                position: 'absolute',
                top: -8,
                left: -8,
                zIndex: 999,
              }}
            />
            <Image style={styles.img} source={icon} />
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
    justifyContent: 'center',
  },
  iconCallUser: {
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    height: 45,
    width: 45,
    top: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    height: 22,
    width: 22,
  },
});

export default withNavigation(RideButton);
