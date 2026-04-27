export type Vec3 = { x: number; y: number; z: number };

export type Waypoint = {
    id: number;
    tour_id: number;
    label: string;
    position: Vec3;
    look_at: Vec3;
    display_order: number;
    transition_ms: number;
    thumbnail_url: string | null;
};

export type HotspotMedia = {
    id: number;
    file_url: string;
    mime_type: string;
    alt_text: string | null;
    caption: string | null;
    display_order: number;
};

export type Hotspot = {
    id: number;
    tour_id: number;
    title: string;
    description: string | null;
    position: Vec3;
    normal: Vec3 | null;
    type: 'info' | 'product' | 'link';
    price_bdt: string | null;
    external_url: string | null;
    icon: string;
    color: string;
    display_order: number;
    is_visible: boolean;
    media: HotspotMedia[];
};

export type EditorMode = 'view' | 'addWaypoint' | 'addHotspot' | 'edit';

export type EditorTour = {
    id: number;
    name: string;
    public_slug: string;
    custom_slug: string | null;
    model_url: string | null;
    model_file_size: number | null;
    model_metadata: Record<string, unknown> | null;
    default_camera: { position: Vec3; target: Vec3 } | null;
    waypoints: Waypoint[];
    hotspots: Hotspot[];
};
