<script lang="ts">
	//export let crs:string;
	export let map: 'maplibjre' | 'leaflet' = 'maplibre';
	import Maplibre from '../maplibre/Maplibre.svelte';
	import Leaflet from '../leaflet/Leaflet.svelte';
	export let data: GeoJSON.Feature | GeoJSON.FeatureCollection;
</script>

{#if map === 'maplibre'}
	<Maplibre {data} />
{:else}
	<Leaflet {data} />
{/if}
