export interface City {
  city: string;
  country: string;
  pop2025: number;
  latitude: number;
  longitude: number;
}

export interface DiagnosticCenter {
  name: string;
  address: string;
  pinCode: string;
  contactNumber: string;
  googleRating: number;
  ctAvailable: boolean;
  mapLink: string;
  website: string;
  latitude?: number;
  longitude?: number;
}

export interface CityData {
  cityInfo: City;
  centers: DiagnosticCenter[];
  status: 'pending' | 'finding-pincodes' | 'scanning-centers' | 'completed' | 'error';
  pinCodes: string[];
  processedPinCodeCount: number;
}
