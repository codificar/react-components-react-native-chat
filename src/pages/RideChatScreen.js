/* eslint-disable no-underscore-dangle */
/* eslint-disable no-plusplus */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/sort-comp */
/* eslint-disable consistent-return */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { Component } from 'react';
import {
  View,
  BackHandler,
  Vibration,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import {
  GiftedChat,
  Send,
  Bubble,
  MessageText,
  Time,
  Day,
} from 'react-native-gifted-chat';
import { withNavigation } from 'react-navigation';
import Toolbar from '../components/ToolBar';
import { getMessageChat, seeMessage, sendMessage } from '../services/api';
import WebSocketServer from '../services/socket';
import strings from '../lang/strings';
import Sound from 'react-native-sound';

const send = require('react-native-chat/src/img/send.png');
const sound_file = require('react-native-chat/src/files/beep.mp3');

let color = '#FBFBFB';

class RideChatScreen extends Component {
  constructor(props) {
    super(props);
    const paramRoute =
      this.props.navigation.state !== undefined
        ? this.props.navigation.state.params
        : this.props.route.params;
    this.state = {
      messages: [],
      idBotMessage: 1,
      typingText: null,
      valueMessage: false,
      isMessageValue: false,
      userLedgeId: '',
      requestId: paramRoute.requestId,
      isLoading: false,
      receiveID: paramRoute.receiveID,
      lastIdMessage: '',
      user_ledger_id: 0,
      ledger: 0,
      sound: '',
      url: paramRoute.url,
      id: paramRoute.id,
      token: paramRoute.token,
      conversation_id: paramRoute.conversation_id,
      color: paramRoute.color,
      contNewMensag: 0,
      is_refreshing: false,
    };

    color = paramRoute.color;

    this.socket = WebSocketServer.connect(paramRoute.socket_url);
    Sound.setCategory('Playback');

    this.sound = new Sound(sound_file, null, (err) => {
        console.log(err);
    });
  }

  componentDidMount() {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.props.navigation.goBack();
      return true;
    });
    this.subscribeSocketNewConversation(this.state.requestId);
    this.getConversation(true);
    this.timer = setInterval(() => {
      this.getConversation();
    }, 5002);
  }

  componentWillUnmount() {
    try {
      clearTimeout(this.timer);
      this.unsubscribeSocket();
      this.unsubscribeSocketNewConversation();
      this.backHandler.remove();
    } catch (error) {
      console.log('componentWillUnmount Error:', error);
    }
  }

  async getConversation(refresh = false) {
    if (refresh) {
      this.setState({ isLoading: true, is_refreshing: true });
    }
    if (this.state.conversation_id) {
      try {
        const response = await getMessageChat(
          this.state.url,
          this.state.id,
          this.state.token,
          this.state.conversation_id,
        );
        const responseJson = response.data;

        if (!refresh) {
          this.unsubscribeSocketNewConversation();
          this.subscribeSocket();
        }

        if (responseJson.success) {
          const formattedArrayMessages = responseJson.messages;
          this.setState({
            userLedgeId: responseJson.user_ledger_id,
            requestId: responseJson.request_id,
          });
          if (formattedArrayMessages.length > 0) {
            this.setState({
              lastIdMessage:
                formattedArrayMessages[formattedArrayMessages.length - 1].id,
            });
            const finalArrayMessages = [];
            for (let i = 0; i < formattedArrayMessages.length; i++) {
              finalArrayMessages.unshift({
                _id: formattedArrayMessages[i].id,
                createdAt: formattedArrayMessages[i].created_at,
                text: formattedArrayMessages[i].message,
                user: { _id: formattedArrayMessages[i].user_id },
              });
            }
            this.setState({ messages: finalArrayMessages });
          }
          this.setState({ isLoading: false, is_refreshing: false });

          if (
            formattedArrayMessages[formattedArrayMessages.length - 1]
              .is_seen === 0
          ) {
            this.seeMessage();
          }
        } else {
          this.setState({ isLoading: false, is_refreshing: false });
        }
      } catch (error) {
        this.setState({ isLoading: false, is_refreshing: false });
      }
    } else {
      this.setState({ isLoading: false, is_refreshing: false });
    }
  }

  /**
   * Play the sound request
   */
  playSoundRequest() {
    Vibration.vibrate();
    this.sound.setCurrentTime(0).play((success) => {
      if(!success){
          console.log("didn't play");
      }
    });
  }

  seeMessage() {
    if (this.state.lastIdMessage) {
      seeMessage(
        this.state.url,
        this.state.id,
        this.state.token,
        this.state.lastIdMessage,
      )
        .then((response) => {
          const responseJson = response.data;
          if (!responseJson.success) {
            this.setState({ isLoading: false });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  subscribeSocketNewConversation(id_request) {
    try {
      if (this.props.conversation_id === 0) {
        this.socket
          .emit('subscribe', { channel: `request.${id_request}` })
          .on('newConversation', (channel, data) => {
            this.setState({
              conversation_id: data.conversation_id,
            });
            this.playSoundRequest();
            this.getConversation();
          });
      }
    } catch (error) {
      console.log('Erro subscribeSocketNewConversation:', error);
    }
  }

  subscribeSocket() {
    this.socket
      .emit('subscribe', {
        channel: `conversation.${this.state.conversation_id}`,
      })
      .on('newMessage', (channel, data) => {
        const newMessage = {
          _id: data.message.id,
          createdAt: data.message.created_at,
          text: data.message.message,
          sent: true,
          received: false,
          user: { _id: data.message.user_id },
        };
        const { userLedgeId } = this.state;

        this.setState((state) => {
          if (
            newMessage._id !== state.messages[state.messages.length - 1]._id &&
            data.message.user_id !== userLedgeId
          ) {
            return {
              messages: GiftedChat.append(state.messages, newMessage),
            };
          }
        });

        this.setState({ lastIdMessage: data.message.id });
        if (
          data.message.is_seen === 0 &&
          data.message.user_id !== this.state.userLedgeId
        ) {
          this.playSoundRequest();
          this.seeMessage();
        }
      });
  }

  unsubscribeSocket() {
    if (this.socket != null) {
      if (this.state.conversation_id) {
        this.socket.removeAllListeners('newConversation');
        this.socket.removeAllListeners('newMessage');
        this.socket.removeAllListeners('readMessage');
        this.socket.emit('unsubscribe', {
          channel: `conversation.${this.state.conversation_id}`,
        });
      }
    }
  }

  unsubscribeSocketNewConversation() {
    this.socket.removeAllListeners('newConversation');
  }

  /**
   * set messages array with the new message
   * @param {any} messages
   */
  async onSend(messages = []) {
    try {
      const type = 'text';
      const formatted = messages[0].text;
      const response = await sendMessage(
        this.state.url,
        this.state.id,
        this.state.token,
        this.state.requestId,
        formatted,
        this.state.receiveID,
        type,
      );

      const responseJson = response.data;

      if (responseJson.success) {
        if (responseJson.conversation_id) {
          if (
            this.state.conversation_id == null ||
            !this.state.conversation_id
          ) {
            this.setState({
              conversation_id: responseJson.conversation_id,
            });
            this.unsubscribeSocketNewConversation();
            this.getConversation();
          }
        }
      }

      if (this.state.messages.length > 0) {
        this.setState((previousState) => ({
          messages: GiftedChat.append(previousState.messages, messages),
        }));
      }
    } catch (error) {
      console.log('error send:', error);
    }
  }

  /**
   * Render custom footer
   * @param {any} props
   */
  renderSend = (props) => {
    if (props.text.trim()) {
      // text box filled
      return (
        <Send {...props}>
          <View style={styles.contImg}>
            <Image style={styles.send} source={send} />
          </View>
        </Send>
      );
    }
  };

  /**
   * Render day
   */
  renderDay(props) {
    return (
      <Day containerStyle={{ marginTop: 30, marginBottom: 0 }} {...props} />
    );
  }

  /**
   * render bubble
   * @param {any} props
   */
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: styles.leftBubble,
          right: {
            backgroundColor: color,
            elevation: 5,
            marginTop: 10,
          },
        }}
      />
    );
  }

  /**
   * render custom text message
   *  @param {any} props
   */
  renderMessageText(props) {
    return (
      <MessageText
        {...props}
        textStyle={{ right: styles.messageTextRight, left: styles.messageText }}
      />
    );
  }

  /**
   * render custom time about message
   */
  renderTime(props) {
    return (
      <Time
        {...props}
        textStyle={{ left: styles.time, right: styles.timeRight }}
      />
    );
  }

  /**
   * Mount RefreshControl
   */
  renderRefreshControl() {
    return (
      <RefreshControl
        colors={['#000']}
        refreshing={this.state.is_refreshing}
        onRefresh={() => this.getConversation(true)}
      />
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={{ marginLeft: 25 }}>
          <Toolbar onPress={() => this.props.navigation.goBack()} />
        </View>
        <GiftedChat
          messages={this.state.messages}
          placeholder={strings.send_message}
          locale="pt"
          dateFormat="L"
          onSend={(messages) => this.onSend(messages)}
          user={{ _id: this.state.userLedgeId }}
          renderSend={this.renderSend}
          renderDay={this.renderDay}
          renderBubble={this.renderBubble}
          renderMessageText={this.renderMessageText}
          renderTime={this.renderTime}
          textInputProps={{
            keyboardType: this.state.isMessageValue ? 'numeric' : 'default',
          }}
          listViewProps={{
            refreshControl: this.renderRefreshControl(),
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageText: {
    color: '#211F1F',
  },
  messageTextRight: {
    color: '#fff',
  },
  time: {
    color: '#9aa2ab',
  },
  timeRight: {
    color: '#fff',
  },
  leftBubble: {
    backgroundColor: '#FBFBFB',
    marginTop: 10,
    marginLeft: -30,
    elevation: 5,
  },
  rightBubble: {
    backgroundColor: '#FBFBFB',
    elevation: 5,
    marginTop: 10,
  },
  contImg: {
    marginRight: 15,
    marginBottom: 6,
    textTransform: 'uppercase',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  send: {
    width: 25,
    height: 25,
  },
});

export default withNavigation(RideChatScreen);
