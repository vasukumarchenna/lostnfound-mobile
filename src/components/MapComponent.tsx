import React from 'react';
import MapView, { Marker, MapViewProps } from 'react-native-maps';

export interface MapComponentProps extends MapViewProps {
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    pinColor?: string;
  }>;
}

export default function MapComponent({ markers, ...props }: MapComponentProps) {
  return (
    <MapView {...props}>
      {markers?.map((marker, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.title}
          pinColor={marker.pinColor}
        />
      ))}
    </MapView>
  );
}
