export type Vec3 = { x: number; y: number; z: number };

export type ViewerWaypoint = {
    id: number;
    label: string;
    position: Vec3;
    look_at: Vec3;
    display_order: number;
    transition_ms: number;
    thumbnail_url: string | null;
};

export type ViewerHotspotMedia = {
    id: number;
    file_url: string;
    alt_text: string | null;
    caption: string | null;
};

export type ViewerHotspot = {
    id: number;
    title: string;
    description: string | null;
    position: Vec3;
    normal: Vec3 | null;
    type: 'info' | 'product' | 'link';
    price_bdt: string | null;
    external_url: string | null;
    color: string;
    display_order: number;
    media: ViewerHotspotMedia[];
};

export type ViewerTour = {
    id: number;
    name: string;
    description: string | null;
    client_name: string | null;
    thumbnail_url: string | null;
    model_url: string;
    default_camera: { position: Vec3; target: Vec3 } | null;
    public_slug: string;
    custom_slug: string | null;
    visibility: 'private' | 'unlisted' | 'public';
    og_title: string;
    og_description: string | null;
    og_image_url: string | null;
    allow_embed: boolean;
    waypoints: ViewerWaypoint[];
    hotspots: ViewerHotspot[];
    branding: {
        company_name: string;
        logo_url: string | null;
    };
};
