import React from "react";
import {
  GiftedChat,
  MessageTextProps,
  BubbleProps,
  SendProps,
  IMessage,
  DayProps,
  TimeProps,
} from "react-native-gifted-chat";
import Toolbar from "../../components/ToolBar";
import strings from "../../lang/strings";

import { ToolbarContainer, Wrapper } from "./styles";

type Props = {
  ledger_id: string | number;
  isMessageValue: boolean;
  renderMessageText(
    messageText: Readonly<MessageTextProps<never>> &
      Readonly<{
        children?: React.ReactNode;
      }>
  ): React.ReactNode;
  goBack(): void;
  messages: any[];
  onSend([]): void;
  renderBubble(
    props: Readonly<BubbleProps<never>> &
      Readonly<{
        children?: React.ReactNode;
      }>
  ): React.ReactNode;
  renderDay(props: Readonly<DayProps<any>> & Readonly<{
    children?: React.ReactNode;
}>): React.ReactNode;
  renderSend(
    props: Readonly<SendProps<IMessage>> &
      Readonly<{
        children?: React.ReactNode;
      }>
  ): React.ReactNode;
  renderRefreshControl(): void;
  renderTime(props: Readonly<TimeProps<any>> & Readonly<{
    children?: React.ReactNode;
}>): React.ReactNode;
};

const HelpChatScreen: React.FC<Props> = ({
  isMessageValue,
  goBack,
  messages,
  onSend,
  ledger_id,
  renderMessageText,
  renderBubble,
  renderSend,
  renderRefreshControl,
  renderDay,
  renderTime,
}) => (
  <Wrapper>
    <ToolbarContainer>
      <Toolbar onPress={goBack} />
    </ToolbarContainer>
    <GiftedChat
      messages={messages}
      placeholder={strings.send_message}
      locale="pt"
      dateFormat="L"
      onSend={(messages) => onSend(messages)}
      user={{ _id: ledger_id }}
      renderDay={renderDay}
      renderMessageText={renderMessageText}
      renderTime={renderTime}
      renderBubble={renderBubble}
      renderSend={(props) => renderSend(props)}
      textInputProps={{
        keyboardType: isMessageValue ? "numeric" : "default",
      }}
      listViewProps={{
        refreshControl: renderRefreshControl(),
      }}
    />
  </Wrapper>
);

export default HelpChatScreen;
