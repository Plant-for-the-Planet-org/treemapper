import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';

import { RegisterTree, MultipleTrees, SelectProject, TPOQuestion, LocateTree, CreatePolygon, TreeInventory, InventoryOverview } from "../";

const Stack = createStackNavigator();


const App = () => {

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="MultipleTrees" headerMode={'none'}>
                <Stack.Screen name="RegisterTree" component={RegisterTree} />
                <Stack.Screen name="MultipleTrees" component={MultipleTrees} />
                <Stack.Screen name="SelectProject" component={SelectProject} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default App
