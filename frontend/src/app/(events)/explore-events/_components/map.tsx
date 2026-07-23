import { Loader } from "@googlemaps/js-api-loader";

export default async function Map() {
  const loader = new Loader({
    apiKey: "YOUR_API_KEY",
    version: "weekly",
    // ...additionalOptions,
  });

  const { Map } = await loader.importLibrary("maps");
  // .then(async () => {
  //   const { Map } = (await google.maps.importLibrary(
  //     "maps"
  //   )) as google.maps.MapsLibrary;

  const map = new Map(document.getElementById("map") as HTMLElement, {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });

  return (
    <div id="map" className="h-52 sm:h-60 md:h-96 w-full rounded-xl"></div>
  );
}
