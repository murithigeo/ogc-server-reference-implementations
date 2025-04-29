//import { Unit } from "../../types/coveragejson.js";

const units: { [key: string]: CoverageJSON.Unit } = {
	windDirection: {
		label: { en: 'Angular Degrees' },
		symbol: '\u00B0'
	},
	temperature: {
		label: { en: 'Kelvin' },
		symbol: '\u00B0C'
	},
	windSpeed: {
		label: { en: 'Speed Rate' },
		symbol: 'm/s'
	},
	pressure: {
		label: { en: 'hectoPascals' },
		symbol: 'hPa'
	},
	windType: {
		label: { en: 'Wind Type' },
		symbol: ''
	}
};

export default units;
