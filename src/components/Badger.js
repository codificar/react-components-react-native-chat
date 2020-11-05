import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function Badger({ position, contador }) {
    if (contador > 0) {
        return (
            <View style={[styles.badge, position, { backgroundColor: '#e73536' }]}>
                <Text style={styles.text}>{contador}</Text>
            </View>
        )
    }
    return null
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 18,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: "#FFF",
        fontSize: 10
    }
})

export default Badger;