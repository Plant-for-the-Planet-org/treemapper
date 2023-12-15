import moment from 'moment';
import React, { useContext, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '../../styles';
import HeaderV2 from '../Common/Header/HeaderV2';
import { IS_ANDROID } from '../../styles/mixins';
import { PrimaryButton, Switch } from '../Common';
import { ProjectContext } from '../../reducers/project';
import FloatingHeaderDropdown from '../Common/Dropdown/FloatingHeaderDropdown';

const CreateIntervention = () => {
  const [toggle, setToggle] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');

  const [openProject, setOpenProject] = useState(false);
  const [valueProject, setValueProject] = useState(null);
  const [itemsProject, setItemsProject] = useState([
    { label: 'yucatanRestoration', value: 'Yucatan Restoration' },
    { label: 'AAA', value: 'AAA' },
    { label: 'BBB', value: 'BBB' },
    { label: 'CCC', value: 'CCC' },
  ]);

  const [openSite, setOpenSite] = useState(false);
  const [valueSite, setValueSite] = useState(null);
  const [itemsSite, setItemsSite] = useState([
    { label: 'yucatanRestoration', value: 'Yucatan Restoration' },
  ]);

  const [openIntervention, setOpenIntervention] = useState(false);
  const [valueIntervention, setValueIntervention] = useState(null);
  const [itemsIntervention, setItemsIntervention] = useState([
    { label: 'yucatanRestoration', value: 'Yucatan Restoration' },
  ]);

  const insects = useSafeAreaInsets();

  const handleToggle = () => setToggle(!toggle);

  const onChangeDate = (selectedDate: any) => {
    setShowDate(false);
    setSelectedDate(selectedDate);
  };

  const onPressDate = () => {
    setShowDate(true);
  };

  const renderDatePicker = () => {
    const handleConfirm = (data: any) => onChangeDate(data);
    const hideDatePicker = () => setShowDate(false);
    return (
      showDate && (
        <DateTimePickerModal
          headerTextIOS={'select date'}
          cancelTextIOS={'cancel date'}
          confirmTextIOS={'confirm'}
          isVisible={showDate}
          maximumDate={new Date()}
          minimumDate={new Date(2006, 0, 1)}
          testID="dateTimePicker"
          timeZoneOffsetInMinutes={0}
          date={new Date()}
          mode={'date'}
          is24Hour={true}
          display="default"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )
    );
  };

  const handleContinue = () => {};

  return (
    <View style={styles.container}>
      <HeaderV2
        headingText="Intervention"
        containerStyle={{
          paddingHorizontal: 16,
          paddingTop: IS_ANDROID ? insects.top + 20 : insects.top,
        }}
      />
      <View style={styles.subContainer}>
        <FloatingHeaderDropdown
          open={openProject}
          items={itemsProject}
          value={valueProject}
          setOpen={setOpenProject}
          setValue={setValueProject}
          placeholder={'Select Project'}
          pickerContainerStyle={{ zIndex: 2000 }}
        />
        <FloatingHeaderDropdown
          open={openSite}
          items={itemsSite}
          value={valueSite}
          setOpen={setOpenSite}
          setValue={setValueSite}
          placeholder={'Site'}
          pickerContainerStyle={{ zIndex: 1000 }}
        />
        <View style={styles.toggleCon}>
          <Text style={styles.toggleText}>Apply intervention to entire site</Text>
          <Switch value={toggle} onValueChange={handleToggle} />
        </View>
        <View style={styles.separator} />
        <FloatingHeaderDropdown
          open={openIntervention}
          items={itemsIntervention}
          value={valueIntervention}
          setOpen={setOpenIntervention}
          setValue={setValueIntervention}
          placeholder={'Intervention Type'}
          pickerContainerStyle={{ zIndex: 2000, marginTop: 24 }}
        />
        <View style={styles.datePickerCon}>
          <Text style={styles.dateLabel}>Intervention Date</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onPressDate} style={styles.datePicker}>
            <Text>{moment(selectedDate).format('DD MMM YYYY')}</Text>
          </TouchableOpacity>
        </View>
        {renderDatePicker()}
        <View style={styles.inputCon}>
          <Text style={styles.dateLabel}>
            Location Name <Text style={{ color: '#4D5153' }}>[ Optional ]</Text>
          </Text>
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            style={styles.input}
            placeholder={'Las Americas 7'}
          />
        </View>
        <View style={styles.inputCon}>
          <Text style={styles.dateLabel}>
            Further Information <Text style={{ color: '#4D5153' }}>[ Optional ]</Text>
          </Text>
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            style={styles.input}
            placeholder={'Group of 12 people worked 4 hrs.'}
          />
        </View>
        <PrimaryButton btnText="Continue" style={styles.btn} onPress={handleContinue} />
      </View>
    </View>
  );
};

export default CreateIntervention;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
  },
  subContainer: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  toggleCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '20',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  toggleText: {
    color: Colors.DARK_TEXT_COLOR,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.GRAY_LIGHT,
    marginTop: 24,
  },
  datePickerCon: {
    borderWidth: 1,
    borderColor: '#4D5153',
    borderRadius: 5,
  },
  datePicker: {
    height: 56,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dateLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#efefef',
    paddingHorizontal: 5,
  },
  inputCon: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#4D5153',
    borderRadius: 5,
  },
  input: {
    height: 56,
    paddingHorizontal: 12,
  },
  btn: {
    marginTop: 24,
  },
});
