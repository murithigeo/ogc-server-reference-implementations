## Features

## Environmental Data Retrieval

### Sample Queries

- Instances
    - https://server-implementations.vercel.app/edr/collections/isd-2025/instances?bbox=-180,-90,180,90&datetime=2025-01-01T13:00:00Z/..
    
- Position
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/position?coords=POINT(36 1)&f=coveragejson&parameter-name=temperature,dewpointTemperature,pressure>

    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/position?coords=POINT(36 1)&f=coveragejson>

- Trajectory
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/trajectory?coords=LINESTRING(40 1,39 1, 38 1,37 1, 36 1)&f=coveragejson>
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/trajectory?coords=LINESTRING(40 1,39 1, 38 1,37 1, 36 1)&f=coveragejson>

- Corridor
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/corridor?coords=LINESTRING(40 1,39 1, 38 1,37 1, 36 1)&corridor-width=1000&width-units=m&corridor-height=1000&height-units=m&f=coveragejson>

    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/corridor?coords=LINESTRING(40 1,39 1, 38 1,37 1, 36 1)&corridor-width=1000&width-units=m&corridor-height=1000&height-units=m&f=coveragejson>

- Area
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/area?coords=LINESTRING(40 1,39 1, 38 1,37 1, 36 1)&corridor-width=1000&width-units=m&corridor-height=1000&height-units=m&f=coveragejson>

- Locations
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/locations>
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/locations>
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/locations/Central%20African%20Republic,Namibia,South%20Sudan?f=coveragejson>
    - https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/locations/Kenya?f=coveragejson

- Radius
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/radius?coords=MULTIPOINT(36 1, 40 1)&within=1000&within-units=m&f=coveragejson>
    
    - <https://server-implementations.vercel.app/edr/collections/isd-2025/radius?coords=MULTIPOINT(36 1, 40 1)&within=1000&within-units=m&f=coveragejson>
    
- Items
    - https://server-implementations.vercel.app/edr/collections/isd-2025/items
    - https://server-implementations.vercel.app/edr/collections/isd-2025/instances/2025-01-01/items
    
