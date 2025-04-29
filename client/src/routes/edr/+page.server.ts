import { goto } from '$app/navigation';
import { redirect, type Load } from '@sveltejs/kit';
const edrUrl = `http://localhost:80/edr`;

export const load: Load = ({ route, url }) => {
	var f = url.searchParams.get('f') || 'html';
	if (f !== 'html') {
		redirect(302, edrUrl);
	}
};
