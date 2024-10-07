// Database.ts
import { stringify, parse } from 'flatted';
import { SerializableDialog } from './Store';

export class Database {
    private dbName: string;
    private version: number;

    constructor(dbName: string, version: number) {
        this.dbName = dbName;
        this.version = version;
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = request.result;

                if (event.oldVersion < 1) {
                    db.createObjectStore('dialogs', { keyPath: 'id' });
                    db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    db.createObjectStore('images', { keyPath: 'dialogId' });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    private serialize(object: any): string {
        return stringify(object);
    }

    private deserialize<T>(serializedObject: string): T {
        return parse(serializedObject);
    }

    public async addObject<T>(storeName: string, object: any): Promise<void> {
        if (!object.id && storeName !== 'images') {
            throw new Error("Object must have an 'id' property.");
        }
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            let obj = this.deserialize<T>(this.serialize(object));
            const request = store.add(obj);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                if (request.error) {
                    if (request.error.name === 'ConstraintError') {
                        resolve();
                    } else {
                        reject(request.error);
                    }
                }
            };
        });
    }

    public async getObject<T>(storeName: string, key: any): Promise<T> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve(result);
                } else {
                    resolve(null as unknown as T);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    public async getAllObjects<T>(storeName: string): Promise<T[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result;
                resolve(results as T[]);
            };
            request.onerror = () => reject(request.error);
        });
    }

    public async updateObject<T>(storeName: string, object: any): Promise<void> {
        if (!object.id && storeName !== 'images') {
            throw new Error("Object must have an 'id' property.");
        }
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            let obj = this.deserialize<T>(this.serialize(object));
            const request = store.put(obj);

            request.onsuccess = () => resolve();

            request.onerror = () => reject(request.error);
        });
    }

    public async dropDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
