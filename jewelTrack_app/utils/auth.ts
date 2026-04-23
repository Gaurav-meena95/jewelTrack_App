
import AsyncStorage from '@react-native-async-storage/async-storage';
export const saveToken = async (accessToken: string | undefined, refreshToken: string | undefined) => {
    try {
        if (accessToken) await AsyncStorage.setItem('x-access-token', accessToken);
        if (refreshToken) await AsyncStorage.setItem('x-refresh-token', refreshToken);
        console.log("Tokens saved successfully");
    } catch (error) {
        console.log("Error saving tokens", error);
    }
}

export const getToken = async () => {
    try {
        const accessToken = await AsyncStorage.getItem('x-access-token');
        const refreshToken = await AsyncStorage.getItem('x-refresh-token');
        return { accessToken, refreshToken };
    } catch (error) {
        console.log("Error getting token",error);
        return {accessToken:null,refreshToken:null};
    }
}

export const clearTokens = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Error clearing storage', e);
  }
};

export const saveUser = async (user:any)=>{
    try {
        await AsyncStorage.setItem('user',JSON.stringify(user));
        console.log("User saved successfully");
    } catch (error) {
        console.log("Error saving user",error);
    }
}

