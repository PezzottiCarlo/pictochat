import 'react-native-gesture-handler';
import React, { ReactNode, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import IndexScreen from './screens/IndexScreen';
import ChatScreen from './screens/ChatScreen';
import ContactListScreen from './screens/ContactScreen';
import { Dialog, User } from './model/Types';
import * as Font from 'expo-font'
import { ViewStyle } from 'react-native';

export type RootStackParamList = {
  Index: undefined;
  ContactList: { contacts: Dialog[] };
  Chat: { friend: Dialog, me: User };
};



const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {

  //load ant design icons
  Font.loadAsync({
    'antoutline': require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    'antfill': require('@ant-design/icons-react-native/fonts/antfill.ttf')
  })

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Index" component={IndexScreen} />
        <Stack.Screen name="ContactList" component={ContactListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} options={
          {
            title: 'Chat'
          }
        } />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
