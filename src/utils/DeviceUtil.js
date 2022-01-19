import { Dimensions, PixelRatio, Platform } from 'react-native';

export const IS_ANDROID = Platform.OS === 'android';

const { width, height } = Dimensions.get('screen');
export const widthDevice = width < height ? width : height;
export const heightDevice = width > height ? width : height;

const width_window = Dimensions.get('window').width;
const height_window = Dimensions.get('window').height;
export const widthWindow =
  width_window < height_window ? width_window : height_window;
export const heightWindow =
  width_window > height_window ? width_window : height_window;
export const pixel = (dp) => dp / PixelRatio.get()