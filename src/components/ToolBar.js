import React, { Component } from 'react';
import { withNavigation } from 'react-navigation';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { 
    View, 
    Dimensions, 
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const statusbarHeight = getStatusBarHeight(true);

class ToolBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            
        }
    }

    handlePress() {
        this.props.navigation.goBack();
    }

    render() {
        return (
            <View style={styles.principal2}>
                <View style={{ height: 40 }}>
                    <TouchableOpacity 
                        style={{ width: 60 }} 
                        onPress={() => this.handlePress()}w
                    >
                        <Icon name="arrow-left" size={25} color="#222" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    principal: {
        width: width,
        height: 90 + statusbarHeight,
        position: "absolute",
        top: 0,
    },
    principal2: {
        height: 40,
        width: "100%",
        marginTop: 20 + statusbarHeight,
        elevation: 1
    },
    iconPress: {
        position: "absolute",
        top: 10 + statusbarHeight,
        left: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: 55,
        height: 55,


    },
    areaImage: {
        position: "absolute",
        top: 10 + statusbarHeight,
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
        height: 60,
        width: 60,

    },

});

export default withNavigation(ToolBar);