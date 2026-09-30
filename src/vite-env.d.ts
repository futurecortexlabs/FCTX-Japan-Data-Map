/// <reference types="vite/client" />

declare module "*.geojson" {
  const value: GeoJSON.FeatureCollection;
  export default value;
}

declare module "*.csv" {
  const value: string;
  export default value;
}

declare module "*?url" {
  const value: string;
  export default value;
}
