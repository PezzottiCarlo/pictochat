export interface UserStatusOffline {
    _: string;
    was_online: string;
}

export interface UserStatus {
    _: string;
    was_online: string | null;
    expires?: number | null; // Define appropriate type if available
}

export interface User {
    _: string;
    access_hash: number;
    apply_min_photo: boolean;
    attach_menu_enabled: boolean;
    bot: boolean;
    bot_attach_menu: boolean;
    bot_can_edit: boolean;
    bot_chat_history: boolean;
    bot_info_version: any; // Define appropriate type if available
    bot_inline_geo: boolean;
    bot_inline_placeholder: any; // Define appropriate type if available
    bot_nochats: boolean;
    close_friend: boolean;
    color: any; // Define appropriate type if available
    contact: boolean;
    contact_require_premium: boolean;
    deleted: boolean;
    emoji_status: any; // Define appropriate type if available
    fake: boolean;
    first_name: string;
    id: number;
    is_self: boolean;
    lang_code: any; // Define appropriate type if available
    last_name: string | null;
    min: boolean;
    mutual_contact: boolean;
    phone: string;
    photo: any; // Define appropriate type if available
    premium: boolean;
    profile_color: any; // Define appropriate type if available
    restricted: boolean;
    restriction_reason: any[]; // Define appropriate type if available
    scam: boolean;
    status: UserStatus;
    stories_hidden: boolean;
    stories_max_id: any; // Define appropriate type if available
    stories_unavailable: boolean;
    support: boolean;
    username: string;
    usernames: any[]; // Define appropriate type if available
    verified: boolean;
}

export interface PeerUser {
    _: string;
    user_id: number;
}

export interface PhotoSize {
    _: string;
    h: number;
    size: number;
    type: string;
    w: number;
}

export interface PhotoSizeProgressive {
    _: string;
    h: number;
    sizes: number[];
    type: string;
    w: number;
}

export interface PhotoStrippedSize {
    _: string;
    bytes: string;
    type: string;
}

export interface Photo {
    _: string;
    access_hash: number;
    date: string;
    dc_id: number;
    file_reference: string;
    has_stickers: boolean;
    id: number;
    sizes: (PhotoSize | PhotoSizeProgressive | PhotoStrippedSize)[];
    video_sizes: any[]; // Define appropriate type if available
}

export interface MessageMediaPhoto {
    _: string;
    photo: Photo;
    spoiler: boolean;
    ttl_seconds: number | null;
}

export interface Message {
    _: string;
    date: string;
    edit_date: string | null;
    edit_hide: boolean;
    entities: any[]; // Define appropriate type if available
    forwards: any[] | null; // Define appropriate type if available
    from_id: PeerUser;
    from_scheduled: boolean;
    fwd_from: any; // Define appropriate type if available
    grouped_id: any; // Define appropriate type if available
    id: number;
    invert_media: boolean;
    legacy: boolean;
    media: MessageMediaPhoto;
    media_unread: boolean;
    mentioned: boolean;
    message: string;
    noforwards: boolean;
    out: boolean;
    peer_id: PeerUser;
    pinned: boolean;
    post: boolean;
    post_author: any; // Define appropriate type if available
    reactions: any[] | null; // Define appropriate type if available
    replies: any[] | null; // Define appropriate type if available
    reply_markup: any; // Define appropriate type if available
    reply_to: any; // Define appropriate type if available
    restriction_reason: any[]; // Define appropriate type if available
    saved_peer_id: any; // Define appropriate type if available
    silent: boolean;
    ttl_period: any; // Define appropriate type if available
    via_bot_id: any; // Define appropriate type if available
    views: any; // Define appropriate type if available
    media_extra: string | null;
}

export interface Dialog {
    date: string;
    entity: User;
    message: Message;
    name: string;
    image?: string | null;
}


export enum Gender{
    MALE,
    FEMALE
}

export enum HairColor{
    BLONDE = "blonde",
    BROWN = "brown",
    DARK_BROWN = "darkBrown",
    GRAY = "gray",
    DARK_DRAY = "darkGray",
    RED = "red",
    BLACK = "black",
}

export enum SkinColor{
    WHITE = "white",
    BLACK = "black",
    ASSIAN = "assian",
    MULATTO = "mulatto",
    AZTEC = "aztec",
}

export type Person = {
    name: string;
    surname: string;
    username: string;

    age: number;
    gender: Gender;
    hairColor: HairColor;
    skinColor: SkinColor;
};

export interface Friend extends Person {
    avatar_url: string;
    tg_username: string;
}