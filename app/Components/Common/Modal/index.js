import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Typography } from '_styles';
import { TextInput } from 'react-native-gesture-handler';
import CountryData from '../../../Utils/countryData.json';
import Config from 'react-native-config';

export default function index({visible, openModal, userCountry}) {
  const [countryData, setCountryData] = useState(null);
  const [search, setSearch] = useState(null);

  const renderItem = ({item}) => {
    return( 
      <Item title={item} 
        onPress={() => selectCountry(item)}
      />  
    );
  };
  const selectCountry = (title) => {
    userCountry(title);
  };
  const Item = ({ title, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={{flexDirection: 'row'}}>
        <Image 
          source={{
            uri: `${Config.CDN_URL}${title.currencyCountryFlag}.png`,
          }}
          style={styles.countryFlag}
          resizeMode="contain"
        />
        <View style={{paddingLeft: 20}}>
          <Text style={{color: 'white'}}>{title.currencyCode}</Text>
          <Text style={{color: 'white', paddingTop: 5}}>{title.countryName}</Text>

        </View>
      </View>
    </TouchableOpacity>
  );
  const sort = () => {
    CountryData.sort((a, b) => {
      if (a.countryName > b.countryName) {
        return 1;
      }
      if (b.countryName > a.countryName) {
        return -1;
      }
      return 0;
    });
    setCountryData(CountryData);
  };

  useEffect(() => {
    sort();
    return sort();
  }, []);

  useEffect(() => {
    if (search !== null) {
      handleFilter(search);
    }
  }, [search]);

  const modalOpen =() => {
    openModal(false);
  };

  const handleFilter = (input) => {
    const filteredData = CountryData.filter(el => el.countryName.toLowerCase().includes(input.toLowerCase()));
    setCountryData(filteredData);
  };
  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={() => {
          console.log('close');
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.searchContainer}>
              <Ionicons
                name= 'md-close'
                size={25}
                color={'white'}
                style={styles.iconStyle}
                onPress={modalOpen}
              />
              <TextInput 
                placeholder='choose country'
                style={styles.searchInput}
                placeholderTextColor="white"
                onChangeText={text => setSearch(text)}
              />
            </View>
            <View style={styles.itemContainer}>
              <FlatList 
                data={countryData}
                renderItem={renderItem}
                // keyExtractor={item => item.currencyName}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    height: '100%'
  },
  modalView: {
    // marginTop: 15,
    // paddingTop: 15,
    backgroundColor: 'white',
    // borderRadius: 20,
    // padding: 35,
    // alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5
  },
  searchContainer: {
    flexDirection: 'row',
    paddingTop: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: 'black',
    color: 'white'
  },
  iconStyle: {
    paddingTop: 10,
    paddingHorizontal: 15
  },
  searchInput: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    color: 'white',
    width: '100%'
  },
  item: {
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  itemContainer: {
    backgroundColor: 'black',
  },
  countryFlag: {
    height: 50,
    width: 50,
    borderRadius: 3
  }
});