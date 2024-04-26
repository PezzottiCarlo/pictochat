import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Image, ScrollView, Clipboard, TouchableHighlight, Alert, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { TextInput } from 'react-native-gesture-handler';
import { AAC, Category, Keyword, Pictogram } from '../lib/AAC';
import { TelegramAPI } from '../lib/TgAPI';
import { Dialog, Gender, HairColor, SkinColor } from '../model/Types';
import storage from '../lib/storage';
import { LogBox } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';



type IndexScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Index'>;
interface IndexScreenProps {
  navigation: IndexScreenNavigationProp;
}


const IndexScreen: React.FC<IndexScreenProps> = ({ navigation }) => {

  const aac = new AAC('it');

  const [token, setToken] = useState<string>();
  const [contacts, setContacts] = useState<Dialog[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const [phoneHash, setPhoneHash] = useState<string>('');
  const [loading, setLoading] = useState(true);

  //TelegramAPI.token = token;
  TelegramAPI.url = 'http://127.0.0.1:5000'

  const saveContacts = (dialogs: Dialog[]) => {
    storage.clearMapForKey('contacts');
    storage.save({
      key: 'contacts',
      data: dialogs,
    });
  }

  const getContacts = async (load = false) => {
    if (load) {
      storage.load({
        key: 'contacts',
      }).then((data: Dialog[]) => {
        if (data && data.length > 0) {
          setContacts(data);
          navigation.navigate('ContactList', {
            contacts: data
          });
        }
      })
    }
    TelegramAPI.getContacts().then((data: Dialog[]) => {
      saveContacts(data);
      setContacts(data);
      navigation.navigate('ContactList', {
        contacts: data
      });
    })
  }

  const loadIfExist = () => {
    storage.load({ key: "token" }).then((value) => {
      if (value) {
        console.log(value);
        TelegramAPI.token = value;
        getContacts(false);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      setLoading(false);
    });
  }

  useEffect(() => {

    storage.save({
      key: 'token',
      data: "uJzqxP7mpbbHTrN6LCJ7JlNnq8iysmkm",
    }).then(() => {
      loadIfExist();
    });

    navigation.setOptions({
      headerTransparent: true,
      headerBackTitleVisible: false,
      headerBackground: () => (
        <BlurView intensity={100} />
      ),
      headerTitle: () => (
        <Text style={{ color: 'rgba(255, 255, 255, .9)', fontSize: 30 }}>Benvenuto</Text>
      ),
    });

  }, []);


  const handlePhoneNumberSubmit = () => {
    TelegramAPI.sendCode(phoneNumber).then((data) => {
      if (data.status === "success") {
        setShowVerification(true);
        setToken(data.token);
        setPhoneHash(data.phone_hash);
      }
    });
  };

  const handleVerificationCodeSubmit = () => {
    TelegramAPI.singIn(token as string, phoneNumber, verificationCode, phoneHash).then((data) => {
      if (data.status === "success") {
        storage.save({
          key: 'token',
          data: token
        });
        TelegramAPI.token = token as string;
        getContacts(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={50}
      >
        {loading && <ActivityIndicator size="large" color="#fff" />}
        {!loading && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Inserisci il numero di telefono"
              value={phoneNumber}
              onChangeText={text => setPhoneNumber(text)}
            />
            {showVerification && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Inserisci il codice di verifica"
                  value={verificationCode}
                  onChangeText={text => setVerificationCode(text)}
                />
              </>
            )}
            <Button title={!showVerification ? "Invia" : "Verifica"} onPress={!showVerification ? handlePhoneNumberSubmit : handleVerificationCodeSubmit} />
          </View>
        )}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Trasparenza bianca per il form
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  input: {
    height: 40,
    width: 300,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});

export default IndexScreen;