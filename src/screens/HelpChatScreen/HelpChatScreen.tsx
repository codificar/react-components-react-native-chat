import React from 'react';
import {
  GiftedChat,
  MessageTextProps,
  BubbleProps,
  SendProps,
  IMessage
} from 'react-native-gifted-chat';
import Toolbar from '../../components/ToolBar';
import strings from '../../lang/strings';

import {ToolbarContainer, Wrapper} from './styles';

type Props = {
  ledger_id: string | number;
  renderMessageText(messageText: Readonly<MessageTextProps<never>> & Readonly<{
    children?: React.ReactNode;
}>):React.ReactNode;
  goBack():void;
  messages: any[];
  onSend([]): void;
  renderBubble(props: Readonly<BubbleProps<never>> & Readonly<{
    children?: React.ReactNode;
}>):React.ReactNode;
  renderSend(props: Readonly<SendProps<IMessage>> & Readonly<{
    children?: React.ReactNode;
}>):React.ReactNode;
  renderRefreshControl():void;
}

const HelpChatScreen: React.FC<Props> = ({
  goBack,
  messages,
  onSend, 
  ledger_id, 
  renderMessageText,
  renderBubble,
  renderSend,
  renderRefreshControl
}) => (
  <Wrapper>
    <ToolbarContainer>
      <Toolbar onPress={goBack}/>
    </ToolbarContainer>
    <GiftedChat
      messages={messages}
      placeholder={strings.send_message}
      locale="pt"
      onSend={messages => onSend(messages)}
      user={{ _id: ledger_id }}
      renderMessageText={renderMessageText}
      renderBubble={renderBubble}
      renderSend={props => renderSend(props)}
      listViewProps={{
        refreshControl: renderRefreshControl()
      }}
    />
  </Wrapper>
);

export default HelpChatScreen;
