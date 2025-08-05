import React from 'react';
import { Alert, Button } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAccessToken } from '@/constants/authStorage';
import { useRefreshToken } from './auth';
import { API_BASE } from '@/constants/api';

export const useDownload = () => {
  const refreshToken = useRefreshToken();

  const downloadCSV = async () => {
    try {
      await refreshToken();
      const token = await getAccessToken();

      if (!token) {
        Alert.alert('Error', 'No access token found.');
        return;
      }

      const downloadUri = FileSystem.documentDirectory + 'expenses.csv';

      const response = await fetch(`${API_BASE}/expenses/data/export_csv_file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const csvText = await response.text();
      await FileSystem.writeAsStringAsync(downloadUri, csvText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadUri);
      } else {
        Alert.alert('Download complete', 'CSV saved at: ' + downloadUri);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      Alert.alert('Download failed', error.message);
    }
  };

  return downloadCSV;
}
