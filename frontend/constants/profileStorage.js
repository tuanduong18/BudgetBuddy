import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCurrency = async (cur) => { 
    return await AsyncStorage.setItem('currency', cur);
}

export const getCurrency = async () => {
    return await AsyncStorage.getItem('currency');
    // return null if there isn't any
}