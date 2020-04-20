import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '_features/public/Home';
import OnBoarding from '_features/static/OnBoarding';
import Login from '_features/authentication/Login';
const Stack = createStackNavigator();

const Entry = () => {
    return (
        <Stack.Navigator initialRouteName="Login" headerMode={'none'}>
            <Stack.Screen name="OnBoarding" component={OnBoarding} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    )
}

export default Entry
