
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";
import type { Discovery } from '@/lib/data';
import Link from 'next/link';
import { Button } from './ui/button';

interface InteractiveMapProps {
  discoveries: Pick<Discovery, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[];
}

export default function InteractiveMap({ discoveries }: InteractiveMapProps) {
  // Default center of the map (Portugal)
  const position: [number, number] = [39.557191, -8.5253693];

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {discoveries.map(discovery => (
        (discovery.latitude && discovery.longitude) && (
            <Marker key={discovery.id} position={[discovery.latitude, discovery.longitude]}>
            <Popup>
                <div className="font-bold mb-2">{discovery.title}</div>
                <Button asChild size="sm">
                    <Link href={`/discoveries/${discovery.slug}`}>
                        Ver Descoberta
                    </Link>
                </Button>
            </Popup>
            </Marker>
        )
      ))}
    </MapContainer>
  );
}
