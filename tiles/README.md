# Tiles offline (Antananarivo)

Place an MBTiles file in this folder, e.g.:

- antananarivo.mbtiles

Then use this tile URL in the web app:

VITE_TILE_URL=http://localhost:8081/data/antananarivo/{z}/{x}/{y}.png

Tips:
- Download an Antananarivo extract from a provider that can export MBTiles.
- The container will serve tiles at /data/<filename> without extension.
