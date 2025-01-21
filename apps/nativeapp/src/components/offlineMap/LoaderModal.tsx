import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal';
import { Colors, Typography } from 'src/utils/constants';

interface Props{
    isLoaderShow: boolean,
    areaName: string
}

const LoaderModal =(props:Props) => {
        const {isLoaderShow,areaName} = props
      return (
        <Modal isVisible={isLoaderShow} style={styles.container}>
          <View style={styles.downloadModalContainer}>
            <View style={styles.contentContainer}>
              <ActivityIndicator size="large" color={Colors.NEW_PRIMARY} style={styles.loader} />
              <Text style={styles.areaName}>{areaName}</Text>
            </View>
          </View>
        </Modal>
      );
    }
  

export default LoaderModal

const styles = StyleSheet.create({
    areaName: {
        fontSize: 16,
        textAlign: 'center',
        color:Colors.TEXT_COLOR,
        fontFamily:Typography.FONT_FAMILY_SEMI_BOLD
      },
      downloadModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      contentContainer: {
        backgroundColor: Colors.WHITE,
        width: 250,
        height:200,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:12
      },
      loader: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        marginVertical: 20,
      },
      container:{
        flex:1,
        margin:0
      }
})