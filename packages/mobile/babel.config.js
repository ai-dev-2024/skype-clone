module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.json'],
        alias: {
          '@': './src',
          '@skype-clone/shared': '../../packages/shared/src',
        },
      },
    ],
  ],
};
