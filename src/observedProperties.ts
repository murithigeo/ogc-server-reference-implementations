const observedproperties: {
	[key in
		| 'temperature'
		| 'windSpeed'
		| 'windDirection'
		| 'dewPointTemp'
		| 'pressure'
		| 'windType'
		| 'cloudBase']: CoverageJSON.ObservedProperty;
} = {
	windSpeed: {
		description: { en: 'Wind speed rate in m/s' },
		label: { en: 'Wind speed' },
		id: 'https://codes.wmo.int/grib2/codeflag/4.2/_3-1-19'
	},
	windDirection: {
		description: { en: 'Wind direction in angular degrees' },
		label: { en: 'Wind Direction' },
		id: 'http://codes.wmo.int/grib2/codeflag/4.2/10-0-4'
	},
	temperature: {
		id: 'https://codes.wmo.int/grib2/codeflag/4.2/_0-0-0',
		label: { en: 'Air Temperature' },
		description: { en: 'temperature in Kelvin/Celsius' }
	},
	dewPointTemp: {
		label: { en: 'Dew Point Temperature' },
		description: { en: 'Dew point temperature in Kelvin/Celsius' },
		id: 'http://codes.wmo.int/grib2/codeflag/4.2/0-0-6'
	},
	pressure: {
		label: { en: 'Atmospheric Pressure ' },
		description: {
			en: "Atmos pressure (Corrected to M.S.L. if station's elevation !==0)"
		},
		id: 'http://codes.wmo.int/grib2/codeflag/4.2/0-3-1'
	},
	windType: {
		label: { en: 'Wind Type' },
		description: {
			en: 'The type of wind observation. Possible values:\n  A = Abridged Beaufort\n  B = Beaufort\n  C = Calm\n  H = 5-Minute Average Speed\n  N = Normal\n  R = 60-Minute Average Speed\n  Q = Squall\n  T = 180 Minute Average Speed\n  V = Variable\n '
		},
		id: ''
	},
	cloudBase: {
		label: { en: 'CloudBase' },
		description: {
			en: 'Height of the base of the cloud'
		},
		id: 'https://codes.wmo.int/grib2/codeflag/4.2/_0-6-11'
	}
};

export default observedproperties;
