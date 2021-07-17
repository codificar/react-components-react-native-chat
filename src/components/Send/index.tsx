import * as React from 'react';
import { Send } from 'react-native-gifted-chat';
import { ImageSend, Wrapper } from './styles';

const send = require('react-native-chat/src/img/send.png');

const SendContainer: React.FC = ({...props }) => (
    <Send {...props}>
        <Wrapper>
            <ImageSend source={send} />
        </Wrapper>
    </Send>
);

export default SendContainer;
