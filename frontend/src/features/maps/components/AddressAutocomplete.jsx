import { useCallback, useEffect, useRef } from 'react';
import { TextField } from '@mui/material';
import { useGoogleMaps } from '../../../contexts/GoogleMapsProvider';

const parseAddressComponents = (components = []) =>
  (components || []).reduce((acc, component) => {
    if (component.types.includes('locality')) acc.city = component.long_name;
    if (component.types.includes('administrative_area_level_1')) acc.state = component.short_name;
    if (component.types.includes('postal_code')) acc.zipCode = component.long_name;
    return acc;
  }, {});

const AddressAutocomplete = ({
  label = 'Address',
  value = '',
  onChange,
  onPlaceSelect,
  disabled = false,
  fullWidth = true,
  size = 'small',
  helperText,
  inputKey,
}) => {
  const { isLoaded, hasApiKey, loadError } = useGoogleMaps();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    const address = place.formatted_address || place.name || value;
    onChange?.(address);
    onPlaceSelect?.({
      address,
      name: place.name || '',
      placeId: place.place_id,
      location,
      addressComponents: parseAddressComponents(place.address_components),
    });
  }, [onChange, onPlaceSelect, value]);

  useEffect(() => {
    if (!isLoaded || !hasApiKey || !inputRef.current) return undefined;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id', 'name', 'address_components'],
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, hasApiKey, handlePlaceChanged, inputKey]);

  if (!hasApiKey) {
    return (
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        helperText={helperText || 'Enter address manually (Google Maps key not configured)'}
      />
    );
  }

  if (loadError) {
    return (
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        helperText={helperText || 'Google Maps failed to load — enter address manually'}
        error
      />
    );
  }

  if (!isLoaded) {
    return (
      <TextField
        label={label}
        value={value}
        disabled
        fullWidth={fullWidth}
        size={size}
        helperText={helperText || 'Loading Google Maps…'}
      />
    );
  }

  return (
    <TextField
      key={inputKey}
      inputRef={inputRef}
      label={label}
      value={value}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      helperText={helperText || 'Start typing to search and select an address'}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
};

export default AddressAutocomplete;
