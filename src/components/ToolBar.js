import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

// Padronizado para o padrao ScreenHeader do app: inset superior via
// useSafeAreaInsets (confiavel), linha de acoes de 56dp, alvo de toque de
// 48dp, icone Feather arrow-left de 24dp a 16dp da borda, acessibilidade.
// Replicado localmente porque a lib nao pode importar App/Components.
const ICON_SIZE = 24;
const TOUCH_SIZE = 48;
const EDGE = 16;

function ToolBar({ onPress, accessibilityLabel = 'Voltar' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.target}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={ICON_SIZE} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: EDGE - (TOUCH_SIZE - ICON_SIZE) / 2,
  },
  target: {
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ToolBar;
