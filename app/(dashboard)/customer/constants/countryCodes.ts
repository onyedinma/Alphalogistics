export interface CountryCode {
  name: string;
  code: string;
  prefix: string;
  flag: string;
  format: string;
}

export const countryCodes: CountryCode[] = [
  {
    name: 'Nigeria',
    code: 'NG',
    prefix: '234',
    flag: '🇳🇬',
    format: 'XXX XXX XXXX'
  },
  {
    name: 'Ghana',
    code: 'GH',
    prefix: '233',
    flag: '🇬🇭',
    format: 'XXX XXX XXX'
  },
  // Add more countries as needed
];
