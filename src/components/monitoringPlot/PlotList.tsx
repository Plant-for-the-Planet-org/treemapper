import React from 'react'
import { FlashList } from '@shopify/flash-list'
import PlotCards from './PlotCards'
import { StyleSheet } from 'react-native'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const Dummy1 = require('assets/images/intervention/PlotDummy1.png')
const Dummy2 = require('assets/images/intervention/PlotDummy2.png')
const Dummy3 = require('assets/images/intervention/PlotDummy3.png')



const dummyData = [{
    label:'Plot A',
    note:'Simple Intervention Plot',
    obs:'8 obs',
    date:'1h ago',
    image:Dummy1,
    show:true
},
{
    label:'Plot B',
    note:'Standard Control Plot',
    date:'2y ago',
    obs:'546 obs',
    image:Dummy2,
    show:false
},
{
    label:'Plot C',
    note:'Standard Intervention Plot',
    date:'5d ago',
    obs:'24 obs',
    image:Dummy3,
    show:false
}
]


const PlotList = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection=()=>{
        navigation.navigate('AddRemeasurment')
    }
    return (
        <FlashList
        renderItem={({ item }) => (<PlotCards item={item} handleSelection={handleSelection}/>)}
        data={dummyData} estimatedItemSize={100}
        contentContainerStyle={styles.container}
        />
    )
}

export default PlotList

const styles=StyleSheet.create({
    container:{
        backgroundColor:Colors.BACKDROP_COLOR,
        paddingTop:20
    }
})

