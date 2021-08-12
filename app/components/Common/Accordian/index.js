import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';
import { Colors, CommonStyles, Typography } from '_styles';
import { PENDING_DATA_UPLOAD } from '../../../utils/inventoryConstants';

const Accordian = ({
  data,
  onChangeText,
  index,
  onPressDelete,
  onSubmitEditing,
  shouldExpand,
  status,
}) => {
  const treeCountInput = useRef();

  const [isOpen, setIsOpen] = useState(false);
  const [isNameOfTreesShow, setIsNameOfTreesShow] = useState(true);
  const [nameOfTree, setNameOfTree] = useState('');
  const [treeCount, setTreeCount] = useState('');

  useEffect(() => {
    if (shouldExpand) {
      setIsOpen(true);
    }
  }, []);
  const onPressAccordian = () => {
    setIsOpen(!isOpen);
    setIsNameOfTreesShow(true);
  };

  const label = data.nameOfTree ? data.nameOfTree : 'Species';

  const onSubmit = (action) => {
    if (action == 'treeCount') {
      setIsOpen(false);
      onChangeText(nameOfTree, 'nameOfTree', index);
      onChangeText(treeCount, 'treeCount', index);
      onSubmitEditing();
    } else {
      setIsNameOfTreesShow(false);
      setTimeout(() => treeCountInput.current.focus(), 100);
    }
  };

  const renderInputModal = () => {
    return (
      <Modal transparent={true} visible={isOpen}>
        <View style={styles.cont}>
          <View style={styles.cont}>
            <View style={styles.cont} />
            <KeyboardAvoidingView
              behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
              style={styles.bgWhite}>
              <View style={CommonStyles.bottomInputContainer}>
                <Text style={CommonStyles.bottomInputLabel}>
                  {isNameOfTreesShow ? 'Name of trees' : 'Tree Count'}
                </Text>
                {isNameOfTreesShow ? (
                  <TextInput
                    value={nameOfTree}
                    onChangeText={(txt) => setNameOfTree(txt)}
                    style={CommonStyles.bottomInputText}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    onSubmitEditing={() => onSubmit('nameOfTrees')}
                  />
                ) : (
                  <TextInput
                    value={treeCount}
                    onChangeText={(txt) => setTreeCount(txt)}
                    ref={treeCountInput}
                    style={CommonStyles.bottomInputText}
                    autoFocus
                    placeholderTextColor={Colors.TEXT_COLOR}
                    onSubmitEditing={() => onSubmit('treeCount')}
                    keyboardType={'numeric'}
                  />
                )}
                <MCIcon
                  onPress={() => onSubmit(isNameOfTreesShow ? 'nameOfTrees' : 'treeCount')}
                  name={'arrow-right'}
                  size={30}
                  color={Colors.PRIMARY}
                />
              </View>
              <SafeAreaView />
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ marginVertical: 10 }}>
      {renderInputModal()}
      <View style={styles.container}>
        <View style={styles.mainContainer}>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          {!isOpen && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 5 }}>
              <Text style={styles.treeCount}>{data.treeCount}</Text>
              <Text style={styles.trees}>Trees</Text>
            </View>
          )}
        </View>
        {status !== PENDING_DATA_UPLOAD && (
          <View style={styles.treeCountCont}>
            {!isOpen ? (
              <View style={{ flexDirection: 'row' }}>
                <Text onPress={() => onPressDelete(index)} style={styles.simpleText}>
                  Delete
                </Text>
                <Text onPress={onPressAccordian} style={[styles.simpleText, styles.primary]}>
                  Edit
                </Text>
              </View>
            ) : (
              <MIcon
                onPress={onPressAccordian}
                name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={30}
                style={styles.arrowIcon}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};
export default Accordian;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  cont: {
    flex: 1,
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
  treeCountCont: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    flex: 1,
  },
  treeCount: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.PRIMARY,
  },
  trees: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    lineHeight: Typography.LINE_HEIGHT_40,
    color: Colors.TEXT_COLOR,
    marginHorizontal: 5,
  },
  arrowIcon: {
    color: Colors.TEXT_COLOR,
    marginTop: 5,
  },
  simpleText: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_30,
    paddingHorizontal: 5,
  },
  primary: {
    color: Colors.PRIMARY,
  },
});
