import * as React from "react";
import PerfilImage from "../PerfilImage";
import { Touchable, Wrapper, InfoMessage, Time, Name, Message } from "./styles";

type Props = {
  key: number;
  item: any;
  onPress(): void;
};

const ConversationPerfilContainer: React.FC<Props> = ({
  item,
  key,
  onPress,
}) => (
  <Touchable onPress={onPress} key={key}>
    <Wrapper>
      <PerfilImage src={item.picture} />
      <InfoMessage>
        <Time>{item.time}</Time>
        <Name>{item.full_name}</Name>
        <Message numberOfLines={1}>{item.last_message}</Message>
      </InfoMessage>
    </Wrapper>
  </Touchable>
);

export default ConversationPerfilContainer;
