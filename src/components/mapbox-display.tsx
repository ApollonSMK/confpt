
'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface MapboxDisplayProps {
  apiKey: string;
  address: string;
  title: string;
}

export function MapboxDisplay({ apiKey, address, title }: MapboxDisplayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      setError('A chave de API do Mapbox não está configurada.');
      setLoading(false);
      return;
    }
    if (!address) {
      setError('Não foi fornecida uma morada para esta descoberta.');
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = apiKey;

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}&limit=1`;

    fetch(geocodeUrl)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          if (map.current) return; // initialize map only once
          if (!mapContainer.current) return;

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 15,
          });

          map.current.on('load', () => {
             new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup().setText(title))
                .addTo(map.current!);
            setLoading(false);
          });

        } else {
          setError(`Não foi possível encontrar a localização para: ${address}`);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Mapbox geocoding error:", err);
        setError('Ocorreu um erro ao carregar o mapa.');
        setLoading(false);
      });
      
      // Cleanup on unmount
      return () => {
        map.current?.remove();
        map.current = null;
      }

  }, [apiKey, address, title]);

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Mapa</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
        {loading && <Skeleton className="absolute inset-0" />}
        <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
