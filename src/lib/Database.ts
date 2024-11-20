import { stringify, parse } from 'flatted';

export class Database {
    private dbName: string;
    private version: number;

    constructor(dbName: string, version: number) {
        this.dbName = dbName;
        this.version = version;
    }

    /**
     * Opens a connection to the IndexedDB database.
     * @returns {Promise<IDBDatabase>} A promise that resolves to the database instance.
     */
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

    /**
     * Serializes an object to a string.
     * @param {any} object - The object to serialize.
     * @returns {string} The serialized object.
     */
    private serialize(object: any): string {
        return stringify(object);
    }

    /**
     * Deserializes a string to an object.
     * @param {string} serializedObject - The string to deserialize.
     * @returns {T} The deserialized object.
     */
    private deserialize<T>(serializedObject: string): T {
        return parse(serializedObject);
    }

    /**
     * Adds an object to the specified object store.
     * @param {string} storeName - The name of the object store.
     * @param {any} object - The object to add.
     * @returns {Promise<void>} A promise that resolves when the object is added.
     * @throws {Error} If the object does not have an 'id' property and the store is not 'images'.
     */
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

    /**
     * Retrieves an object from the specified object store.
     * @param {string} storeName - The name of the object store.
     * @param {any} key - The key of the object to retrieve.
     * @returns {Promise<T>} A promise that resolves to the retrieved object.
     */
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

    /**
     * Retrieves all objects from the specified object store.
     * @param {string} storeName - The name of the object store.
     * @returns {Promise<T[]>} A promise that resolves to an array of all objects in the store.
     */
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

    /**
     * Updates an object in the specified object store.
     * @param {string} storeName - The name of the object store.
     * @param {any} object - The object to update.
     * @returns {Promise<void>} A promise that resolves when the object is updated.
     * @throws {Error} If the object does not have an 'id' property and the store is not 'images'.
     */
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

    /**
     * Deletes the IndexedDB database.
     * @returns {Promise<void>} A promise that resolves when the database is deleted.
     */
    public async dropDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
