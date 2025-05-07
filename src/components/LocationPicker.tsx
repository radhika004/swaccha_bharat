
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, X } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onCancel: () => void;
}

// Simplified mock map interaction
export function LocationPicker({ onLocationSelect, onCancel }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('Drag marker or search for address');
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulate map initialization and click handling
  useEffect(() => {
    // In a real app, initialize a map library here (e.g., Google Maps, Leaflet, Mapbox)
    // For this mock, we'll just set a default center
    if (!markerPosition) {
        // Default to a central India location for mock
      setMarkerPosition({ lat: 20.5937, lng: 78.9629 }); 
      setCurrentAddress('Central India (Mock Start)');
    }
  }, [markerPosition]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Simulate getting lat/lng from map click event (highly simplified)
    if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        // These are NOT real lat/lng, just relative positions for demo
        const pseudoLat = (e.clientY - rect.top) / rect.height * 180 - 90; 
        const pseudoLng = (e.clientX - rect.left) / rect.width * 360 - 180;
        
        setMarkerPosition({ lat: pseudoLat, lng: pseudoLng });
        // Mock address update
        setCurrentAddress(`Mock Address at pseudo-coords: ${pseudoLat.toFixed(4)}, ${pseudoLng.toFixed(4)}`);
    }
  };

  const handleSearch = () => {
    // Mock search functionality
    if (searchTerm) {
      // Simulate finding a location based on search term
      const randomLat = Math.random() * 180 - 90;
      const randomLng = Math.random() * 360 - 180;
      setMarkerPosition({ lat: randomLat, lng: randomLng });
      setCurrentAddress(`Mock Search Result for "${searchTerm}": ${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`);
    }
  };

  const handleConfirmLocation = () => {
    if (markerPosition) {
      onLocationSelect({
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        address: currentAddress || `Coordinates: ${markerPosition.lat.toFixed(4)}, ${markerPosition.lng.toFixed(4)}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          aria-label="Close location picker"
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold mb-4 text-primary">Pick Location</h2>
        
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search for address or place..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleSearch} variant="outline" className="border-primary text-primary">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>

        {/* Mock Map Area */}
        <div 
          ref={mapRef}
          className="w-full h-64 bg-muted border border-dashed border-border rounded-md flex items-center justify-center relative cursor-pointer mb-2"
          onClick={handleMapClick}
          title="Click to set marker (Mock Map)"
        >
          {markerPosition && (
            <MapPin className="h-8 w-8 text-red-500 absolute" style={{ 
                // Extremely simplified marker positioning
                left: `calc(50% + ${(markerPosition.lng / 360 * 50).toFixed(0)}%)`, 
                top: `calc(50% - ${(markerPosition.lat / 180 * 50).toFixed(0)}%)`,
                transform: 'translate(-50%, -50%)'
            }} />
          )}
          <p className="text-sm text-muted-foreground p-2 text-center">
            {/* This is a MOCK map. Click to place a marker. <br/> In a real app, this would be an interactive map. */}
            {currentAddress}
          </p>
        </div>
         <p className="text-xs text-muted-foreground mb-4 text-center italic">Mock Map: Click on the area above to set a marker.</p>


        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirmLocation} disabled={!markerPosition} className="bg-primary hover:bg-primary/90">
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
