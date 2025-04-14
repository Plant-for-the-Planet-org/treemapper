import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import useStore from '../../store/useUserStore';


const Counter = () => {
    const count = useStore((state) => state.count);
    const increase = useStore((state) => state.increase);
    const decrease = useStore((state) => state.decrease);
    const reset = useStore((state) => state.reset);

    return (
        <View style={styles.container}>
            <Text style={styles.countText}>Count: {count}</Text>
            <Button title="Increase" onPress={increase} />
            <Button title="Decrease" onPress={decrease} />
            <Button title="Reset" onPress={reset} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default Counter;