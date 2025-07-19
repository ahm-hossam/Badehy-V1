// Country detection utilities
export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
}

// Common countries with their dial codes
const countries: CountryInfo[] = [
  { code: 'US', name: 'United States', dialCode: '1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44' },
  { code: 'CA', name: 'Canada', dialCode: '1' },
  { code: 'AU', name: 'Australia', dialCode: '61' },
  { code: 'DE', name: 'Germany', dialCode: '49' },
  { code: 'FR', name: 'France', dialCode: '33' },
  { code: 'IT', name: 'Italy', dialCode: '39' },
  { code: 'ES', name: 'Spain', dialCode: '34' },
  { code: 'NL', name: 'Netherlands', dialCode: '31' },
  { code: 'SE', name: 'Sweden', dialCode: '46' },
  { code: 'NO', name: 'Norway', dialCode: '47' },
  { code: 'DK', name: 'Denmark', dialCode: '45' },
  { code: 'FI', name: 'Finland', dialCode: '358' },
  { code: 'CH', name: 'Switzerland', dialCode: '41' },
  { code: 'AT', name: 'Austria', dialCode: '43' },
  { code: 'BE', name: 'Belgium', dialCode: '32' },
  { code: 'IE', name: 'Ireland', dialCode: '353' },
  { code: 'NZ', name: 'New Zealand', dialCode: '64' },
  { code: 'JP', name: 'Japan', dialCode: '81' },
  { code: 'KR', name: 'South Korea', dialCode: '82' },
  { code: 'SG', name: 'Singapore', dialCode: '65' },
  { code: 'HK', name: 'Hong Kong', dialCode: '852' },
  { code: 'TW', name: 'Taiwan', dialCode: '886' },
  { code: 'IN', name: 'India', dialCode: '91' },
  { code: 'BR', name: 'Brazil', dialCode: '55' },
  { code: 'MX', name: 'Mexico', dialCode: '52' },
  { code: 'AR', name: 'Argentina', dialCode: '54' },
  { code: 'CL', name: 'Chile', dialCode: '56' },
  { code: 'CO', name: 'Colombia', dialCode: '57' },
  { code: 'PE', name: 'Peru', dialCode: '51' },
  { code: 'VE', name: 'Venezuela', dialCode: '58' },
  { code: 'ZA', name: 'South Africa', dialCode: '27' },
  { code: 'EG', name: 'Egypt', dialCode: '20' },
  { code: 'NG', name: 'Nigeria', dialCode: '234' },
  { code: 'KE', name: 'Kenya', dialCode: '254' },
  { code: 'GH', name: 'Ghana', dialCode: '233' },
  { code: 'MA', name: 'Morocco', dialCode: '212' },
  { code: 'TN', name: 'Tunisia', dialCode: '216' },
  { code: 'DZ', name: 'Algeria', dialCode: '213' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '966' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '971' },
  { code: 'QA', name: 'Qatar', dialCode: '974' },
  { code: 'KW', name: 'Kuwait', dialCode: '965' },
  { code: 'BH', name: 'Bahrain', dialCode: '973' },
  { code: 'OM', name: 'Oman', dialCode: '968' },
  { code: 'JO', name: 'Jordan', dialCode: '962' },
  { code: 'LB', name: 'Lebanon', dialCode: '961' },
  { code: 'IL', name: 'Israel', dialCode: '972' },
  { code: 'TR', name: 'Turkey', dialCode: '90' },
  { code: 'RU', name: 'Russia', dialCode: '7' },
  { code: 'UA', name: 'Ukraine', dialCode: '380' },
  { code: 'PL', name: 'Poland', dialCode: '48' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '420' },
  { code: 'HU', name: 'Hungary', dialCode: '36' },
  { code: 'RO', name: 'Romania', dialCode: '40' },
  { code: 'BG', name: 'Bulgaria', dialCode: '359' },
  { code: 'HR', name: 'Croatia', dialCode: '385' },
  { code: 'SI', name: 'Slovenia', dialCode: '386' },
  { code: 'SK', name: 'Slovakia', dialCode: '421' },
  { code: 'LT', name: 'Lithuania', dialCode: '370' },
  { code: 'LV', name: 'Latvia', dialCode: '371' },
  { code: 'EE', name: 'Estonia', dialCode: '372' },
  { code: 'MT', name: 'Malta', dialCode: '356' },
  { code: 'CY', name: 'Cyprus', dialCode: '357' },
  { code: 'GR', name: 'Greece', dialCode: '30' },
  { code: 'PT', name: 'Portugal', dialCode: '351' },
  { code: 'IS', name: 'Iceland', dialCode: '354' },
  { code: 'LU', name: 'Luxembourg', dialCode: '352' },
  { code: 'MC', name: 'Monaco', dialCode: '377' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '423' },
  { code: 'AD', name: 'Andorra', dialCode: '376' },
  { code: 'SM', name: 'San Marino', dialCode: '378' },
  { code: 'VA', name: 'Vatican City', dialCode: '379' },
  { code: 'TH', name: 'Thailand', dialCode: '66' },
  { code: 'MY', name: 'Malaysia', dialCode: '60' },
  { code: 'ID', name: 'Indonesia', dialCode: '62' },
  { code: 'PH', name: 'Philippines', dialCode: '63' },
  { code: 'VN', name: 'Vietnam', dialCode: '84' },
  { code: 'MM', name: 'Myanmar', dialCode: '95' },
  { code: 'KH', name: 'Cambodia', dialCode: '855' },
  { code: 'LA', name: 'Laos', dialCode: '856' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880' },
  { code: 'PK', name: 'Pakistan', dialCode: '92' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '94' },
  { code: 'NP', name: 'Nepal', dialCode: '977' },
  { code: 'BT', name: 'Bhutan', dialCode: '975' },
  { code: 'MV', name: 'Maldives', dialCode: '960' },
  { code: 'AF', name: 'Afghanistan', dialCode: '93' },
  { code: 'IR', name: 'Iran', dialCode: '98' },
  { code: 'IQ', name: 'Iraq', dialCode: '964' },
  { code: 'SY', name: 'Syria', dialCode: '963' },
  { code: 'YE', name: 'Yemen', dialCode: '967' },
  { code: 'PS', name: 'Palestine', dialCode: '970' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '7' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '998' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '996' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '992' },
  { code: 'TM', name: 'Turkmenistan', dialCode: '993' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '994' },
  { code: 'GE', name: 'Georgia', dialCode: '995' },
  { code: 'AM', name: 'Armenia', dialCode: '374' },
  { code: 'BY', name: 'Belarus', dialCode: '375' },
  { code: 'MD', name: 'Moldova', dialCode: '373' },
  { code: 'AL', name: 'Albania', dialCode: '355' },
  { code: 'MK', name: 'North Macedonia', dialCode: '389' },
  { code: 'ME', name: 'Montenegro', dialCode: '382' },
  { code: 'RS', name: 'Serbia', dialCode: '381' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '387' },
  { code: 'XK', name: 'Kosovo', dialCode: '383' },
];

// Get country by code
export const getCountryByCode = (code: string): CountryInfo | undefined => {
  return countries.find(country => country.code === code.toUpperCase());
};

// Get country by dial code
export const getCountryByDialCode = (dialCode: string): CountryInfo | undefined => {
  return countries.find(country => country.dialCode === dialCode);
};

// Test function to manually set Egypt (for testing)
export const getTestCountry = (): CountryInfo => {
  console.log('Using test country: Egypt');
  const egypt = getCountryByCode('EG');
  if (!egypt) {
    throw new Error('Egypt country not found in the list');
  }
  return egypt;
};

// Detect user's country using multiple methods
export const detectUserCountry = async (): Promise<CountryInfo> => {
  console.log('Starting country detection...');
  
  // For testing - uncomment the line below to force Egypt detection
  return getTestCountry();
  
  // Try multiple IP geolocation services
  const geolocationServices = [
    'https://ipapi.co/json/',
    'https://ipinfo.io/json',
    'https://api.ipify.org?format=json'
  ];

  for (const service of geolocationServices) {
    try {
      console.log(`Trying geolocation service: ${service}`);
      const response = await fetch(service, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Geolocation response:', data);
        
        let countryCode: string | undefined;
        
        // Handle different response formats
        if (data.country_code) {
          countryCode = data.country_code;
        } else if (data.country) {
          countryCode = data.country;
        } else if (data.countryCode) {
          countryCode = data.countryCode;
        }
        
        if (countryCode && typeof countryCode === 'string') {
          const detectedCountry = getCountryByCode(countryCode);
          if (detectedCountry) {
            console.log('Country detected via IP geolocation:', detectedCountry);
            return detectedCountry;
          } else {
            console.log('Country code not found in our list:', countryCode);
          }
        }
      }
    } catch (error) {
      console.log(`Geolocation service ${service} failed:`, error);
    }
  }

  // Fallback to browser locale
  try {
    console.log('Trying browser locale detection...');
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    console.log('Browser locale:', locale);
    
    const countryCode = locale.split('-')[1] || 'US';
    console.log('Extracted country code from locale:', countryCode);
    
    const detectedCountry = getCountryByCode(countryCode);
    if (detectedCountry) {
      console.log('Country detected via browser locale:', detectedCountry);
      return detectedCountry;
    }
  } catch (error) {
    console.log('Browser locale detection failed:', error);
  }

  // Final fallback to US
  console.log('Using default country: US');
  const us = getCountryByCode('US');
  if (!us) {
    throw new Error('US country not found in the list');
  }
  return us;
};

// Get all countries for the phone input
export const getAllCountries = (): CountryInfo[] => {
  return countries;
}; 