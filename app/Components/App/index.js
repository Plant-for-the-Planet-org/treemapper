import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { StateProvider } from '../../Actions/store';

import 'react-native-gesture-handler';

import { RegisterTree, MultipleTrees, SelectProject, TPOQuestion, LocateTree, CreatePolygon, TreeInventory, InventoryOverview } from "../";

const Stack = createStackNavigator();


const App = () => {
    return (
        <StateProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="TreeInventory" headerMode={'none'}>
                    <Stack.Screen name="TreeInventory" component={TreeInventory} />
                    <Stack.Screen name="RegisterTree" component={RegisterTree} />
                    <Stack.Screen name="MultipleTrees" component={MultipleTrees} />
                    <Stack.Screen name="SelectProject" component={SelectProject} />
                    <Stack.Screen name="LocateTree" component={LocateTree} />
                    <Stack.Screen name="CreatePolygon" component={CreatePolygon} />
                    <Stack.Screen name="InventoryOverview" component={InventoryOverview} />
                </Stack.Navigator>
            </NavigationContainer>
        </StateProvider>
    )
}

export default App
