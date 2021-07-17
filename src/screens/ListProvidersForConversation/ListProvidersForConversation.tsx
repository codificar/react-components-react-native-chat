import React from "react";
import { ToolBar, ComponentPerfil } from "../../components";
import strings from "../../lang/strings";

import {
  ToolbarContainer,
  Wrapper,
  Title,
  Input,
  Container,
  ListMessage,
} from "./styles";

type Props = {
  goBack(): void;
  navigate(id: string | number): void;
  handleName(name: string): void;
  providers: any[];
};

const HelpChatScreen: React.FC<Props> = ({
  goBack,
  navigate,
  handleName,
  providers,
}) => (
  <Wrapper>
    <ToolbarContainer>
      <ToolBar onPress={goBack} />
      <Title>{strings.providers}</Title>
    </ToolbarContainer>
    <Input placeholder={strings.search_providers} onChangeText={handleName} />
    <Container>
      <ListMessage
        data={providers}
        keyExtractor={(x, i) => i.toString()}
        renderItem={({ item, index }) => (
          <ComponentPerfil
            onPress={() => navigate(item.id)}
            key={index}
            item={item}
          />
        )}
      />
    </Container>
  </Wrapper>
);

export default HelpChatScreen;
