import * as React from "react";
import strings from '../../lang/strings';
import { Touchable, Wrapper, InfoMessage, Message } from "./styles";

type Props = {
  id: number;
  token: string;
  receiver: string;
  url: string;
  socket_url: string;
  navigation: any;
};

const ConversationPerfilContainer: React.FC<Props> = ({
  id,
  token,
  receiver,
  url,
  socket_url,
  navigation,
}) => {
  const navigateTo = () => {
    navigation.navigate("DirectChatScreen", {
      receiver,
      url,
      socket_url,
      id,
      token,
    });
  };

  return (
    <Touchable onPress={() => navigateTo()}>
      <Wrapper>
        <InfoMessage>
          <Message>{strings.chat}</Message>
        </InfoMessage>
      </Wrapper>
    </Touchable>
  );
};

export default ConversationPerfilContainer;
