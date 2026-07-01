import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Image
} from 'react-native';

const arrow = require('react-native-chat/src/img/left-arrow.png');
const { width } = Dimensions.get('window');


function ToolBar({ onPress }) {

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.principal2, { marginTop: 20 + insets.top }]}>
      <View style={{ height: 40 }}>
        <TouchableOpacity
          style={{ width: 60 }}
          onPress={onPress}
        >
          <Image
            style={styles.img}
            source={arrow}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  principal: {
    width: width,
    height: 90,
    position: "absolute",
    top: 0,
  },
  principal2: {
    height: 40,
    width: "100%",
    marginTop: 20,
    elevation: 1
  },
  iconPress: {
    position: "absolute",
    top: 10,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 55,
    height: 55,


  },
  areaImage: {
    position: "absolute",
    top: 10,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 55,
    height: 55,
    borderRadius: 45,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    shadowColor: "#000",
    elevation: 3,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    padding: 3,
    borderColor: "#fff",
    borderWidth: 4
  },
  img: {
    height: 30,
    width: 30
  },

});

export default ToolBar;
