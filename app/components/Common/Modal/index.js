import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { Typography, Colors } from '_styles';
import CountryData from '../../../utils/countryData.json';
import i18next from 'i18next';
import { APIConfig } from '../../../actions/Config';
import { ENVS } from '../../../../environment';
import { useSelector } from 'react-redux';

const { protocol } = APIConfig;

export default function index({ visible, openModal, userCountry }) {
  const [countryData, setCountryData] = useState(null);
  const [search, setSearch] = useState(null);
  const { currentEnv } = useSelector(state => state.envSlice);

  const renderItem = ({ item }) => {
    return <Item title={item} onPress={() => selectCountry(item)} />;
  };
  const selectCountry = title => {
    userCountry(title);
  };
  const Item = ({ title, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={{ flexDirection: 'row' }}>
        <Image
          source={{
            // not using currencyCountryFlag any more as we have flags for every country
            uri: ENVS[currentEnv].CDN_URL
              ? `${protocol}://${ENVS[currentEnv].CDN_URL}/media/images/flags/png/256/${title.countryCode}.png`
              : null,
          }}
          style={styles.countryFlag}
          resizeMode="contain"
        />
        <View style={{ paddingLeft: 20 }}>
          {/* <Text style={{color: 'black'}}>{title.currencyCode}</Text> */}
          <Text style={{ color: 'black', paddingTop: 12 }}>{title.countryName}</Text>
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

  const modalOpen = () => {
    openModal(false);
  };

  const handleFilter = input => {
    const filteredData = CountryData.filter(el =>
      el.countryName.toLowerCase().includes(input.toLowerCase()),
    );
    setCountryData(filteredData);
  };
  return (
    <View style={styles.centeredView}>
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={() => {}}>
        <View style={styles.centeredView}>
          <View style={styles.container}>
            <TouchableOpacity style={{ paddingTop: Platform.OS === 'ios' ? 14 : null }}>
              <Ionicons
                name="arrow-back"
                size={30}
                color={Colors.TEXT_COLOR}
                style={styles.iconStyle}
                onPress={modalOpen}
              />
            </TouchableOpacity>
            <View />
          </View>
          <View style={{ paddingLeft: 10, paddingTop: 15 }}>
            <Text style={styles.headerText}>{i18next.t('label.select_country')}</Text>
          </View>
          {/* <View style={{paddingLeft: 10}}>
            <Header headingText={i18next.t('label.select_country')} />
          </View> */}
          <View style={styles.modalView}>
            {/* <View style={styles.searchContainer}>
              <TextInput
                placeholder={i18next.t('label.select_country')}
                style={styles.searchInput}
                placeholderTextColor="black"
                onChangeText={text => setSearch(text)}
              />
            </View> */}
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
    backgroundColor: 'white',
    height: '100%',
  },
  modalView: {
    // marginTop: 15,
    // paddingTop: 15,
    backgroundColor: 'white',
    color: 'black',
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
  // searchContainer: {
  //   flexDirection: 'row',
  //   paddingTop: Platform.OS === 'ios' ? 25 : 10,
  //   backgroundColor: 'white',
  //   color: 'black'
  // },
  iconStyle: {
    paddingTop: 10,
  },
  // searchInput: {
  //   fontFamily: Typography.FONT_FAMILY_REGULAR,
  //   fontSize: Typography.FONT_SIZE_20,
  //   color: 'black',
  //   width: '100%',
  //   fontWeight: 'bold',
  //   paddingTop: 10,
  //   paddingLeft: 10
  // },
  item: {
    padding: 4,
    marginVertical: 0,
    marginHorizontal: 16,
  },
  itemContainer: {
    backgroundColor: 'white',
    paddingBottom: 160,
  },
  countryFlag: {
    height: 40,
    width: 40,
    borderRadius: 0,
  },
  headerText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_27,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingTop: Platform.OS === 'ios' ? 20 : 14,
  },
});
