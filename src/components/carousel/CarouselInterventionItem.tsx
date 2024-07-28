import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InterventionData } from 'src/types/interface/slice.interface';
import { scaleFont } from 'src/utils/constants/mixins';
import { Colors, Typography } from 'src/utils/constants';
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import InterventionIconSwitch from '../intervention/InterventionIconSwitch';
import { INTERVENTION_TYPE } from 'src/types/type/app.type';
import i18next from 'src/locales/index';

interface Props {
  data: InterventionData;
  onPress: (id: string) => void;
}

const InterventionItemContent: React.FC<{
  icon: INTERVENTION_TYPE;
  title: string;
  date: string;
  sampleTreesLength: number;
  onPress: () => void;
  showMoreText: string;
}> = ({ icon, title, date, sampleTreesLength, onPress, showMoreText }) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    <View style={styles.imageWrapper}>
      <InterventionIconSwitch icon={icon} dimension={true} />
    </View>
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>{i18next.t("label.intervention")}</Text>
      <Text style={styles.speciesName} ellipsizeMode="tail">
        {title}
      </Text>
      <Text style={styles.sectionLabel}>{i18next.t('label.intervention_date')}</Text>
      <Text style={styles.valueLabel}>
        {date}
      </Text>
      {sampleTreesLength > 0 && <Text style={styles.sampleLabel}>{showMoreText}</Text>}
    </View>
  </TouchableOpacity>
);

const CarouselInterventionItem: React.FC<Props> = ({ data, onPress }) => {
  const showMoreText = data.sample_trees.length > 0 ? i18next.t("label.show_tree_details") : i18next.t("label.show_more_details");
  return (
    <InterventionItemContent
      icon={data.intervention_key}
      title={data.intervention_title}
      date={timestampToBasicDate(data.intervention_date)}
      sampleTreesLength={data.sample_trees.length}
      onPress={() => onPress(data.intervention_id)}
      showMoreText={showMoreText}
    />
  );
};

export default CarouselInterventionItem;

const styles = StyleSheet.create({
  container: {
    width: '95%',
    height: 150,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  imageWrapper: {
    width: '35%',
    height: '80%',
    marginLeft: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionWrapper: {
    marginLeft: '5%',
    justifyContent: 'center',
  },
  speciesName: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
  valueLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  sampleLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
  }
});
