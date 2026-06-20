import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { haptics } from '@/lib/haptics';

type Props = {
  onAddressSelected: (address: string) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

export function MapPicker({ onAddressSelected, onDragStateChange }: Props) {
  const colors = useColors();
  const [activeAddress, setActiveAddress] = useState('Loading map...');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  // Reverse geocoding using OSM Nominatim API
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
        {
          headers: {
            'User-Agent': 'FoodRush-App',
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const cleanAddress = parts.slice(0, 3).join(',').trim();
        setActiveAddress(cleanAddress);
        onAddressSelected(cleanAddress);
      } else {
        const fallback = `Coord: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setActiveAddress(fallback);
        onAddressSelected(fallback);
      }
    } catch (e) {
      console.warn('Geocoding error:', e);
      const fallback = `Coord: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      setActiveAddress(fallback);
      onAddressSelected(fallback);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let mapInstance: any = null;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      setLoading(false);

      // Start at Pristina center
      const startLat = 42.6629;
      const startLon = 21.1655;

      reverseGeocode(startLat, startLon);

      mapInstance = L.map(containerRef.current, {
        zoomControl: false,
      }).setView([startLat, startLon], 15);

      mapRef.current = mapInstance;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstance);

      mapInstance.on('movestart', () => {
        if (onDragStateChange) onDragStateChange(true);
      });

      mapInstance.on('moveend', () => {
        if (onDragStateChange) onDragStateChange(false);
        haptics.light();
        const center = mapInstance.getCenter();
        reverseGeocode(center.lat, center.lng);
      });
    };

    const loadAssetsAndInit = () => {
      const L = (window as any).L;
      if (L) {
        initMap();
        return;
      }

      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadAssetsAndInit();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.mapViewport}>
        {/* Leaflet DOM container */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', outline: 'none' }}
        />

        {loading && (
          <View style={StyleSheet.absoluteFill}>
            <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
          </View>
        )}

        {/* Central Overlay Pin (fixed in middle of map viewport) */}
        {!loading && (
          <View style={styles.pinWrapper} pointerEvents="none">
            <View style={[styles.pinCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
            <View style={[styles.pinLine, { backgroundColor: colors.primary }]} />
            <View style={styles.pinShadow} />
          </View>
        )}
      </View>

      {/* Floating address details banner */}
      <View style={[styles.addressBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Ionicons name="map" size={16} color={colors.primary} />
        <Text style={[styles.addressText, { color: colors.foreground }]} numberOfLines={1}>
          {activeAddress}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewport: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    transform: [{ translateY: -14 }],
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinLine: {
    width: 3,
    height: 12,
  },
  pinShadow: {
    width: 6,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
  },
  addressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    zIndex: 1000,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
});
