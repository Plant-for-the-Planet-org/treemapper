import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

import { Colors, Typography } from '../../styles';
import { MULTI, OFF_SITE, ON_SITE, REVIEW, SAMPLE, SINGLE } from '../../utils/inventoryConstants';

interface ITypeSelectionProps {
  selectedTreeType: any;
  setSelectedTreeType: React.Dispatch<React.SetStateAction<any>>;
  treeTypeError: string;
  selectedRegistrationType: any;
  setSelectedRegistrationType: React.Dispatch<React.SetStateAction<any>>;
  registrationTypeError: string;
  shouldUpdateTypeSelection: boolean;
  setShouldUpdateTypeSelection: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TypeSelection({
  selectedTreeType,
  setSelectedTreeType,
  treeTypeError,
  selectedRegistrationType,
  setSelectedRegistrationType,
  registrationTypeError,
  shouldUpdateTypeSelection,
  setShouldUpdateTypeSelection,
}: ITypeSelectionProps) {
  const treeTypesInitialState = [
    { type: SINGLE, isSelected: false, isDisabled: true, name: i18next.t('label.single') },
    { type: SAMPLE, isSelected: false, isDisabled: true, name: i18next.t('label.sample') },
    { type: MULTI, isSelected: false, isDisabled: true, name: i18next.t('label.multiple') },
  ];

  const registrationTypesInitialState = [
    { type: ON_SITE, isSelected: false, isDisabled: false, name: i18next.t('label.on_site') },
    { type: OFF_SITE, isSelected: false, isDisabled: false, name: i18next.t('label.off_site') },
    // { type: 'REVIEW', isSelected: false, isDisabled: false, name: i18next.t('label.review') },
  ];

  const [registrationTypeCheckBoxes, setRegistrationTypeCheckBoxes] = useState<any>(
    registrationTypesInitialState,
  );

  const [treeTypeCheckBoxes, setTreeTypeCheckBoxes] = useState<any>(treeTypesInitialState);

  useEffect(() => {
    checkSelectedAndUpdate();
  }, []);

  useEffect(() => {
    if (shouldUpdateTypeSelection) {
      checkSelectedAndUpdate();
      setShouldUpdateTypeSelection(false);
    }
  }, [shouldUpdateTypeSelection]);

  const checkSelectedAndUpdate = () => {
    let registrationBoxes = [...registrationTypesInitialState];
    let treeBoxes = [...treeTypesInitialState];
    for (const i in registrationBoxes) {
      if (selectedRegistrationType.includes(registrationBoxes[i].type)) {
        registrationBoxes[i].isSelected = true;
      }
    }
    for (const i in treeBoxes) {
      if (selectedTreeType.includes(treeBoxes[i].type)) {
        treeBoxes[i].isSelected = true;
      }
    }
    setRegistrationTypeCheckBoxes(registrationBoxes);
    updateTreeTypeBoxes(selectedRegistrationType, treeBoxes);
  };

  const toggleTreeTypeCheckBox = (treeType: string, value: boolean) => {
    const updatedCheckBoxes = treeTypeCheckBoxes.map((tree: any) => {
      if (tree.type === treeType) {
        return {
          ...tree,
          isSelected: value,
        };
      }
      return tree;
    });
    setTreeTypeCheckBoxes(updatedCheckBoxes);

    let treeTypes: any = [];
    for (const tree of updatedCheckBoxes) {
      if (tree.isSelected) {
        treeTypes.push(tree.type);
      }
    }
    setSelectedTreeType(treeTypes);
  };

  const toggleRegistrationTypeCheckBox = (registrationType: string, value: boolean) => {
    const updatedCheckBoxes = registrationTypeCheckBoxes.map((registration: any) => {
      if (registration.type === registrationType) {
        return {
          ...registration,
          isSelected: value,
        };
      }
      return registration;
    });

    setRegistrationTypeCheckBoxes(updatedCheckBoxes);

    let registrationTypes: any = [];
    for (const registration of updatedCheckBoxes) {
      if (registration.isSelected) {
        registrationTypes.push(registration.type);
      }
    }
    setSelectedRegistrationType(registrationTypes);

    updateTreeTypeBoxes(registrationTypes);
  };

  const updateTreeTypeBoxes = (registrationTypes: any, treeCheckBoxes: any = null) => {
    if (!treeCheckBoxes) {
      treeCheckBoxes = treeTypeCheckBoxes;
    }
    if (registrationTypes.length === 0) {
      setTreeTypeCheckBoxes(treeTypesInitialState);
      setSelectedTreeType([]);
    } else {
      let updatedTreeBoxes = [...treeTypesInitialState];
      let treeTypes = [];
      for (const i in updatedTreeBoxes) {
        switch (updatedTreeBoxes[i].type) {
          case SAMPLE:
            updatedTreeBoxes[i].isSelected = registrationTypes.includes(ON_SITE)
              ? treeCheckBoxes[i].isSelected
              : false;

            updatedTreeBoxes[i].isDisabled = !registrationTypes.includes(ON_SITE);
            break;
          case MULTI:
            updatedTreeBoxes[i].isSelected =
              registrationTypes.includes(ON_SITE) || registrationTypes.includes(OFF_SITE)
                ? treeCheckBoxes[i].isSelected
                : false;

            updatedTreeBoxes[i].isDisabled =
              !registrationTypes.includes(ON_SITE) &&
              !registrationTypes.includes(OFF_SITE) &&
              registrationTypes.includes(REVIEW);
            break;
          case SINGLE:
            updatedTreeBoxes[i].isSelected =
              !registrationTypes.includes(ON_SITE) &&
              !registrationTypes.includes(OFF_SITE) &&
              registrationTypes.includes(REVIEW)
                ? true
                : treeCheckBoxes[i].isSelected;

            updatedTreeBoxes[i].isDisabled =
              !registrationTypes.includes(ON_SITE) &&
              !registrationTypes.includes(OFF_SITE) &&
              registrationTypes.includes(REVIEW);
            break;
        }

        if (updatedTreeBoxes[i].isSelected) {
          treeTypes.push(updatedTreeBoxes[i].type);
        }
      }
      setTreeTypeCheckBoxes(updatedTreeBoxes);
      setSelectedTreeType(treeTypes);
    }
  };

  const checkGroupBoxes: any = [
    {
      title: 'registrationType',
      checkBoxes: registrationTypeCheckBoxes,
      toggleCheckBox: toggleRegistrationTypeCheckBox,
    },
    {
      title: 'treeType',
      checkBoxes: treeTypeCheckBoxes,
      toggleCheckBox: toggleTreeTypeCheckBox,
    },
  ];

  return (
    <>
      {checkGroupBoxes.map(({ title, checkBoxes, toggleCheckBox }: any, index: number) => (
        <View key={`check-box-${index}`}>
          <CheckBoxGroup title={title} checkBoxes={checkBoxes} toggleCheckBox={toggleCheckBox} />
          {title === 'registrationType' && registrationTypeError ? (
            <Text style={styles.errorText}>{registrationTypeError}</Text>
          ) : (
            []
          )}
          {title === 'treeType' && treeTypeError ? (
            <Text style={styles.errorText}>{treeTypeError}</Text>
          ) : (
            []
          )}
        </View>
      ))}
    </>
  );
}

interface ICheckBoxGroupProps {
  title: string;
  checkBoxes: any;
  toggleCheckBox: Function;
}

const CheckBoxGroup = ({ title, checkBoxes, toggleCheckBox }: ICheckBoxGroupProps) => {
  return (
    <>
      <Text style={styles.selectionTypeText}>{i18next.t(`label.${title}`)}</Text>
      <View style={styles.checkBoxParent}>
        {checkBoxes.map((checkBox: any, index: number) => (
          <View style={styles.checkBoxContainer} key={`${checkBox.type}-${index}`}>
            <CheckBox
              tintColors={{
                true: Colors.PRIMARY,
              }}
              disabled={checkBox.isDisabled}
              value={checkBox.isSelected}
              onValueChange={newValue => toggleCheckBox(checkBox.type, newValue)}
            />
            <Text style={styles.checkboxText}>{checkBox.name}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  selectionTypeText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    marginBottom: 16,
    marginTop: 20,
  },
  checkBoxParent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  checkboxText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    marginLeft: 6,
  },
  errorText: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    marginTop: 8,
  },
});
