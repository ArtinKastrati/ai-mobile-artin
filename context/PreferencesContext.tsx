import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@/constants/translations';

type Language = 'en' | 'sq';
type Theme = 'light' | 'dark' | 'system';

interface PreferencesContextType {
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('user_language');
        const storedTheme = await AsyncStorage.getItem('user_theme');
        if (storedLang === 'en' || storedLang === 'sq') {
          setLanguageState(storedLang);
        }
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeState(storedTheme);
        }
      } catch (e) {
        console.error('Error loading preferences', e);
      }
    };
    loadPreferences();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('user_language', lang);
    } catch (e) {
      console.error('Error saving language', e);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('user_theme', newTheme);
    } catch (e) {
      console.error('Error saving theme', e);
    }
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let translation: any = translations[language];
    
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Fallback to English
        let fallback: any = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // return key as fallback if not found anywhere
          }
        }
        translation = fallback;
        break;
      }
    }

    if (typeof translation !== 'string') {
      return key;
    }

    if (variables) {
      let result = translation;
      Object.entries(variables).forEach(([name, val]) => {
        result = result.replace(new RegExp(`{${name}}`, 'g'), String(val));
      });
      return result;
    }

    return translation;
  };

  return (
    <PreferencesContext.Provider value={{ language, theme, setLanguage, setTheme, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
