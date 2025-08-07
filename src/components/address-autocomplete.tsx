
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

interface AddressAutocompleteProps {
  apiKey: string;
  onSelect: (address: string) => void;
  initialValue?: string | null;
}

interface Suggestion {
  id: string;
  place_name: string;
}

export function AddressAutocomplete({ apiKey, onSelect, initialValue }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 500); // 500ms debounce
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Update query if initialValue changes from parent form reset
    setQuery(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    
    if (!apiKey) {
      console.warn("Mapbox API Key is missing for AddressAutocomplete.");
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedQuery)}.json?access_token=${apiKey}&country=PT&autocomplete=true`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error('Error fetching Mapbox suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, apiKey]);

  // Handle clicks outside the component to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);


  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.place_name);
    onSelect(suggestion.place_name);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Comece a digitar uma morada..."
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {isFocused && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 cursor-pointer hover:bg-accent"
            >
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// You might need to install use-debounce: npm install use-debounce
