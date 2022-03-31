import { CommonActions } from '@react-navigation/native';

export const callWatchPositionOnScreens = ['MainScreen'];

export const resetRouteStack = (navigation: any, stack: string[]) => {
  const routes = stack.map(route => ({ name: route }));
  navigation.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    }),
  );
};
