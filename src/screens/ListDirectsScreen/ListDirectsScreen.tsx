import React from "react";
import { RefreshControl } from "react-native";
import { ToolBar, If, ConversationPerfil } from "../../components";
import strings from "../../lang/strings";

import {
  ToolbarContainer,
  Wrapper,
  Title,
  Box,
  NewDirect,
  TextDirect,
  Container,
  ListMessage,
  NoMessage,
  ImageBox,
  NoMessageText,
} from "./styles";

const box_img = require("react-native-chat/src/img/box.png");

type Props = {
  goBack(): void;
  navigate(): void;
  onPressConversation(item:any): void;
  listDirectConversations(): void;
  conversations: any[];
  show_new_conversation: boolean;
  is_refreshing: boolean;
};

const HelpChatScreen: React.FC<Props> = ({
  goBack,
  navigate,
  onPressConversation,
  listDirectConversations,
  conversations,
  show_new_conversation,
  is_refreshing,
}) => (
  <Wrapper>
    <ToolbarContainer>
      <ToolBar onPress={goBack} />
      <Title>{strings.directs}</Title>
    </ToolbarContainer>
    <If condition={show_new_conversation}>
      <Box>
        <NewDirect onPress={navigate}>
          <TextDirect>{strings.new_direct}</TextDirect>
        </NewDirect>
      </Box>
    </If>
    <Container>
      <If condition={conversations.length > 0}>
        <ListMessage
          data={conversations}
          keyExtractor={(x, i) => i.toString()}
          renderItem={({ item, index }) => (
            <ConversationPerfil
              onPress={() => onPressConversation(item)}
              key={index}
              item={item}
            />
          )}
          refreshControl={
            <RefreshControl
              colors={["#000"]}
              refreshing={is_refreshing}
              onRefresh={listDirectConversations}
            />
          }
        />
      </If>
      <If condition={!(conversations.length > 0)}>
        <NoMessage>
          <ImageBox source={box_img} />
          <NoMessageText>{strings.no_directs}</NoMessageText>
        </NoMessage>
      </If>
    </Container>
  </Wrapper>
);

export default HelpChatScreen;
