import { storage } from "../Container";
import { Dialog } from "telegram/tl/custom/dialog";
import { Api } from "telegram";

export class DialogService {
    static async getDialog(id: any): Promise<Dialog | null> {
        let dialog = await storage.getDialog(id.toString());
        return dialog;
    }

    static async getDialogs(onUpdate: (dialogs: Dialog[]) => void): Promise<Dialog[]> {
        let storedDialogs = await storage.getDialogs();

        if (storedDialogs.length === 0) {
            // @ts-ignore
            storedDialogs = await (await import('../TgApi')).TgApi.prototype.getDialogs.call();
            for (const dialog of storedDialogs) {
                await storage.addDialog(dialog);
            }
        }

        // background refresh - delegate to TgApi directly (avoid circular import by dynamic import)
        (async () => {
            try {
                // @ts-ignore
                const tgApi = (await import('../Container')).tgApi;
                // @ts-ignore
                const dialogs = await tgApi.getDialogs();
                for (const dialog of dialogs) {
                    if (storedDialogs.find((d) => d.id?.equals(dialog.id as any))) {
                        storage.updateDialog(dialog);
                    } else {
                        storage.addDialog(dialog);
                    }
                }
                onUpdate(dialogs);
            } catch (e) { }
        })();

        return storedDialogs;
    }

    static async markAsReadLocal(id: any): Promise<void> {
        await storage.markAsRead(id.toString());
    }

    static async dropDatabase(): Promise<void> {
        await storage.dropDatabase();
    }

    static handleContactUpdate(update: any, type: number, contactsData: Dialog[], setContactsData: any, callback: (dialog: any, message: string) => void) {
        if (type === 0) {
            let shortMess = update.originalUpdate as Api.UpdateShortMessage;
            let fromID = shortMess.userId;
            if (!fromID) {
                callback("Tu", (shortMess.message as any).message);
                let me = JSON.parse(localStorage.getItem('me') as string);
                contactsData.forEach((dialog) => {
                    if (dialog.id?.toString() === me.id.toString()) {
                        dialog.message = shortMess.message as any as Api.Message;
                        dialog.unreadCount++;
                        contactsData.splice(contactsData.indexOf(dialog), 1);
                        contactsData.unshift(dialog);
                        setContactsData([...contactsData]);
                    }
                });
            }

            for (let dialog of contactsData) {
                if (dialog.id?.toString() === fromID.toString()) {
                    dialog.message = shortMess as any as Api.Message;
                    dialog.unreadCount++;
                    contactsData.splice(contactsData.indexOf(dialog), 1);
                    contactsData.unshift(dialog);
                    setContactsData([...contactsData]);
                    callback(dialog.name, dialog.message.message);
                    break;
                }
            }
        } else if (type === 1) {
            let userStatus = update as Api.UpdateUserStatus;
            let fromID = userStatus.userId;
            for (let dialog of contactsData) {
                if (dialog.id?.toString() === fromID.toString()) {
                    if (dialog.entity) {
                        (dialog.entity as any).status = userStatus.status.className;
                    }
                    setContactsData([...contactsData]);
                }
            }
        }
    }
}
