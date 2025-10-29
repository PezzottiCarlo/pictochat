import { tgApi, storage } from "../Container";
import { Api } from "telegram";

export class ProfileService {
    static async getMe(): Promise<Api.User> {
        let tmp = localStorage.getItem('me') as string;
        return JSON.parse(tmp) as Api.User;
    }

    static async getProfilePic(id: any): Promise<Buffer> {
        let photo = await storage.getImageByDialogId(id.toString());

        (async () => {
            try {
                // @ts-ignore
                const latest = (await tgApi.getProfilePhotos(id)) as Buffer | string | undefined;
                if (!latest) return;
                let ab: ArrayBuffer | undefined;
                if (typeof (latest as any).byteLength === 'number' && (latest as any).slice) {
                    const buf = latest as unknown as Buffer;
                    const slice = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                    ab = slice instanceof ArrayBuffer ? slice : new Uint8Array(buf).slice().buffer as ArrayBuffer;
                } else if (latest instanceof ArrayBuffer) {
                    ab = latest;
                } else if (typeof latest === 'string') {
                    // skip
                }
                if (ab) {
                    await storage.updateImage(id.toString(), Buffer.from(ab) as any);
                }
            } catch { }
        })();

        if (!photo) {
            try {
                // @ts-ignore
                const latest = (await tgApi.getProfilePhotos(id)) as Buffer | string | undefined;
                if (latest) {
                    if (typeof (latest as any).byteLength === 'number') {
                        const buf = latest as unknown as Buffer;
                        const slice = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                        const ab = slice instanceof ArrayBuffer ? slice : new Uint8Array(buf).slice().buffer as ArrayBuffer;
                        await storage.addImage(id, ab);
                        photo = ab;
                    }
                }
            } catch { }
        }

        if (photo instanceof ArrayBuffer) return Buffer.from(photo);
        return photo as Buffer;
    }

    static async getProfilePicHQ(id: any): Promise<Buffer | undefined> {
        try {
            // @ts-ignore
            const latest = (await tgApi.getProfilePhotosBig(id)) as Buffer | string | undefined;
            if (!latest) return undefined;
            if (typeof (latest as any).byteLength === 'number') return latest as Buffer;
            return undefined;
        } catch {
            return undefined;
        }
    }
}
