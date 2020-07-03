import 'react-native-gesture-handler';
import React from 'react'
import { SafeAreaView, Button } from 'react-native'
import Auth0 from 'react-native-auth0';
const auth0 = new Auth0({ domain: 'planetapp.eu.auth0.com', clientId: 'LiEqEef641Pzv8cBGn6i9Jt9jrnyLJEt' });

const App = () => {

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Button title={'AUTH 0 Mod'} onPress={() => {
                auth0
                    .webAuth
                    .authorize({ scope: 'openid profile email' })
                    .then(credentials => {
                        console.log('credentials', credentials)
                    }
                    )
                    .catch(error => console.log(error));
            }}>AUTHO)))</Button>
        </SafeAreaView>
    )
}

export default App
