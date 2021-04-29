import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import i18next from 'i18next';
import { Colors, Typography } from '../../styles';

interface ITypeSelectionProps {
  setSelectedTreeType: any;
  setSelectedRegistrationType: any;
}

const treeTypesInitialState = {
  single: {
    isSelected: false,
    isDisabled: false,
    name: i18next.t('label.single'),
  },
  sample: {
    isSelected: false,
    isDisabled: false,
    name: i18next.t('label.sample'),
  },
  multiple: {
    isSelected: false,
    isDisabled: false,
    name: i18next.t('label.multiple'),
  },
};

export default function TypeSelection({
  setSelectedTreeType,
  setSelectedRegistrationType,
}: ITypeSelectionProps) {
  const [registrationTypeCheckBoxes, setRegistrationTypeCheckBoxes] = useState<any>({
    onsite: {
      isSelected: false,
      isDisabled: false,
      name: i18next.t('label.on_site'),
    },
    offsite: {
      isSelected: false,
      isDisabled: false,
      name: i18next.t('label.off_site'),
    },
    review: {
      isSelected: false,
      isDisabled: false,
      name: i18next.t('label.review'),
    },
  });

  const [treeTypeCheckBoxes, setTreeTypeCheckBoxes] = useState<any>(treeTypesInitialState);

  useEffect(() => {
    let { single, sample, multiple } = treeTypesInitialState;
    const { review, offsite, onsite } = registrationTypeCheckBoxes;

    sample.isSelected = onsite.isSelected ? sample.isSelected : false;
    sample.isDisabled = !onsite.isSelected;

    multiple.isSelected = offsite.isSelected || onsite.isSelected ? multiple.isSelected : false;
    multiple.isDisabled = !offsite.isSelected && !onsite.isSelected && review.isSelected;

    single.isDisabled = !offsite.isSelected && !onsite.isSelected && review.isSelected;
    if (!offsite.isSelected && !onsite.isSelected && review.isSelected) {
      single.isSelected = true;
    } else if (!offsite.isSelected && !onsite.isSelected && !review.isSelected) {
      single.isSelected = false;
    }

    setTreeTypeCheckBoxes({
      single,
      sample,
      multiple,
    });
  }, [registrationTypeCheckBoxes]);

  const toggleTreeTypeCheckBox = (treeTypeKey: string, value: boolean) => {
    setTreeTypeCheckBoxes((treeTypeBoxes: any) => {
      return {
        ...treeTypeBoxes,
        [treeTypeKey]: {
          isSelected: value,
          isDisabled: treeTypeBoxes[treeTypeKey].isDisabled,
        },
      };
    });

    setSelectedTreeType(treeTypeCheckBoxes.filter((treeType: any) => treeType.isSelected));
  };

  const toggleRegistrationTypeCheckBox = (registrationTypeKey: string, value: boolean) => {
    setRegistrationTypeCheckBoxes((registrationTypeBoxes: any) => {
      return {
        ...registrationTypeBoxes,
        [registrationTypeKey]: {
          isSelected: value,
          isDisabled: registrationTypeBoxes[registrationTypeKey].isDisabled,
        },
      };
    });
    setSelectedRegistrationType(
      registrationTypeCheckBoxes.filter((registrationType: any) => registrationType.isSelected),
    );
  };

  const checkGroupBoxes: any = [
    {
      title: i18next.t('label.registrationType'),
      checkBoxes: registrationTypeCheckBoxes,
      toggleCheckBox: toggleTreeTypeCheckBox,
    },
    {
      title: i18next.t('label.treeType'),
      checkBoxes: treeTypeCheckBoxes,
      toggleCheckBox: toggleRegistrationTypeCheckBox,
    },
  ];

  return (
    <>
      {checkGroupBoxes.map(({ title, checkBoxes, toggleCheckBox }: any, index: number) => (
        <CheckBoxGroup
          title={title}
          checkBoxes={checkBoxes}
          toggleCheckBox={toggleCheckBox}
          key={`check-box-${index}`}
        />
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
      <Text style={styles.selectionTypeText}>{title}</Text>
      <View style={styles.checkBoxParent}>
        {Object.keys(checkBoxes).map((key: string, index: number) => (
          <View style={styles.checkBoxContainer} key={`tree-type-${index}`}>
            <CheckBox
              disabled={checkBoxes[key].isDisabled}
              value={checkBoxes[key].isSelected}
              onValueChange={(newValue) => toggleCheckBox(key, newValue)}
            />
            <Text style={styles.checkboxText}>{checkBoxes[key].name}</Text>
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
});
