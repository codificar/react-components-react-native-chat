import * as React from "react";
import PerfilImage from "../PerfilImage";
import { Touchable, Wrapper, Name } from "./styles";

type Props = {
  key: number;
  item: any;
  onPress(): void;
};

const ComponentPerfilContainer: React.FC<Props> = ({ item, key, onPress }) => (
  <Touchable onPress={onPress} key={key}>
    <Wrapper>
      <PerfilImage src={item.picture} />
      <Name>`${item.first_name} ${item.last_name}`</Name>
    </Wrapper>
  </Touchable>
);

export default ComponentPerfilContainer;
