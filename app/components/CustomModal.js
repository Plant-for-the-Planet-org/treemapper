import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';

export default React.forwardRef((props, ref) => {
  let ScreenHeight = Dimensions.get('window').height;
  let ScreenWidth = Dimensions.get('window').width;

  React.useImperativeHandle(
    ref,
    () => ({
      show,
      hide,
    }),
    [showModal],
  );

  const [showModal, setShowModal] = React.useState(false);
  const [isShowAnimation, setIsShowAnima] = React.useState(true);

  const show = () => {
    setIsShowAnima(true);
    setShowModal(true);
  };

  const hide = () => {
    setIsShowAnima(false);
    var timeout = setTimeout(() => {
      setShowModal(false);
      setIsShowAnima(true);
      clearTimeout(timeout);
    }, 400);
  };

  return (
    <Modal
      visible={showModal}
      animationType={'none'}
      onRequestClose={props?.restrictClose ? () => {} : hide}
      transparent
      statusBarTranslucent={true}>
      {props.withOutTouch ? (
        <View style={[styles.container, props?.containerStyle]}>
          <MotiView
            style={styles.backdrop}
            from={{ opacity: isShowAnimation ? 0 : 1 }}
            animate={{ opacity: isShowAnimation ? 1 : 0 }}
            transition={{ type: 'timing', duration: 400 }}
          />
          <MotiView
            style={styles.cardWrapper}
            animate={{
              transform: [
                {
                  translateY: 0,
                },
              ],
            }}
            from={{
              transform: [
                {
                  translateY: ScreenHeight,
                },
              ],
            }}
            transition={{ type: 'spring', duration: 1000, damping: 15, mass: 1.2, stiffness: 120 }}>
            {props.children}
          </MotiView>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={hide} accessible={false}>
          <View style={[styles.container, props?.containerStyle]}>
            <MotiView
              style={styles.backdrop}
              from={{ opacity: isShowAnimation ? 0 : 1 }}
              animate={{ opacity: isShowAnimation ? 1 : 0 }}
              transition={{ type: 'timing', duration: 400 }}
            />
            <MotiView
              style={styles.cardWrapper}
              animate={{
                transform: [
                  {
                    translateY: isShowAnimation ? 0 : ScreenHeight,
                  },
                ],
              }}
              from={{
                transform: [
                  {
                    translateY: isShowAnimation ? ScreenHeight : 0,
                  },
                ],
              }}
              transition={{
                type: 'spring',
                duration: 1000,
                damping: 15,
                mass: 1.2,
                stiffness: 120,
              }}>
              {props.children}
            </MotiView>
          </View>
        </TouchableWithoutFeedback>
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFill,
  },
  cardWrapper: {
    width: '100%',
  },
});
