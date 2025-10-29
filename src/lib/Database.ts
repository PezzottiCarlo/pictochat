import { stringify, parse } from 'flatted';

type StoreName = 'dialogs' | 'messages' | 'images' | 'media';
type TransactionMode = 'readonly' | 'readwrite';
type SerializableStore = 'dialogs' | 'messages';
type BinaryStore = 'images' | 'media';

interface StoreConfig {
    keyPath: string | null;
    autoIncrement?: boolean;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
    }>;
}

export class Database {
    private readonly dbName: string;
    private readonly version: number;
    private dbPromise?: Promise<IDBDatabase>;
    private readonly storeConfigs: Map<StoreName, StoreConfig>;
    private readonly binaryStores: Set<BinaryStore>;
    private readonly serializableStores: Set<SerializableStore>;

    constructor(dbName: string, version: number = 3) {
        this.dbName = dbName;
        this.version = version;
        
        this.storeConfigs = new Map([
            ['dialogs', { keyPath: 'id' }],
            ['messages', { 
                keyPath: 'id', 
                autoIncrement: true,
                indexes: [
                    { name: 'byDialogId', keyPath: 'dialogId', options: { unique: false } }
                ]
            }],
            ['images', { keyPath: 'dialogId' }],
            ['media', { keyPath: 'id' }]
        ]);

        this.binaryStores = new Set<BinaryStore>(['images', 'media']);
        this.serializableStores = new Set<SerializableStore>(['dialogs', 'messages']);
    }

    private async openDB(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise;
        
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = request.result;
                const transaction = request.transaction as IDBTransaction;
                
                this.performMigrations(db, transaction, event.oldVersion, event.newVersion ?? this.version);
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to open database: ${request.error?.message}`));
            request.onblocked = () => reject(new Error('Database opening blocked by another connection'));
        });
        
        return this.dbPromise;
    }

    private performMigrations(
        db: IDBDatabase, 
        transaction: IDBTransaction, 
        oldVersion: number, 
        newVersion: number
    ): void {
        const migrations = [
            () => this.migrateToV1(db),
            () => this.migrateToV2(transaction),
            () => this.migrateToV3(db)
        ];

        for (let version = oldVersion; version < newVersion && version < migrations.length; version++) {
            try {
                migrations[version]();
            } catch (error) {
                console.error(`Migration to version ${version + 1} failed:`, error);
            }
        }
    }

    private migrateToV1(db: IDBDatabase): void {
        const stores: Array<[StoreName, StoreConfig]> = [
            ['dialogs', { keyPath: 'id' }],
            ['messages', { keyPath: 'id', autoIncrement: true }],
            ['images', { keyPath: 'dialogId' }]
        ];

        stores.forEach(([name, config]) => {
            if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, config);
            }
        });
    }

    private migrateToV2(transaction: IDBTransaction): void {
        try {
            const messagesStore = transaction.objectStore('messages');
            if (!messagesStore.indexNames.contains('byDialogId')) {
                messagesStore.createIndex('byDialogId', 'dialogId', { unique: false });
            }
        } catch (error) {
            console.error('Failed to create index:', error);
        }
    }

    private migrateToV3(db: IDBDatabase): void {
        if (!db.objectStoreNames.contains('media')) {
            db.createObjectStore('media', { keyPath: 'id' });
        }
    }

    private serialize<T>(object: T): string {
        return stringify(object);
    }

    private deserialize<T>(serializedObject: string): T {
        return parse(serializedObject);
    }

    private isBinaryStore(storeName: string): storeName is BinaryStore {
        return this.binaryStores.has(storeName as BinaryStore);
    }

    private isSerializableStore(storeName: string): storeName is SerializableStore {
        return this.serializableStores.has(storeName as SerializableStore);
    }

    private preparePayload<T>(storeName: string, object: T): T {
        if (this.isBinaryStore(storeName)) {
            return object;
        }
        if (this.isSerializableStore(storeName)) {
            return this.deserialize<T>(this.serialize(object));
        }
        return object;
    }

    private validateObject(storeName: string, object: any): void {
        const config = this.storeConfigs.get(storeName as StoreName);
        
        if (!config) {
            throw new Error(`Unknown store: ${storeName}`);
        }
        
        if (config.keyPath && !config.autoIncrement) {
            const keyPath = config.keyPath as string;
            if (!(keyPath in object)) {
                throw new Error(`Object must have '${keyPath}' property for store '${storeName}'`);
            }
        }
    }

    private async executeTransaction<T>(
        storeName: string,
        mode: TransactionMode,
        operation: (store: IDBObjectStore) => IDBRequest
    ): Promise<T> {
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = operation(store);

            transaction.oncomplete = () => {
                if (request.result !== undefined) {
                    resolve(request.result);
                } else {
                    resolve(null as unknown as T);
                }
            };

            transaction.onerror = () => reject(new Error(`Transaction failed: ${transaction.error?.message}`));
            transaction.onabort = () => reject(new Error('Transaction aborted'));
            
            request.onerror = () => {
                if (request.error?.name === 'ConstraintError') {
                    resolve(null as unknown as T);
                } else {
                    reject(new Error(`Request failed: ${request.error?.message}`));
                }
            };
        });
    }

    public async addObject<T extends Record<string, any>>(
        storeName: string, 
        object: T
    ): Promise<void> {
        this.validateObject(storeName, object);
        const payload = this.preparePayload(storeName, object);
        
        await this.executeTransaction<void>(
            storeName,
            'readwrite',
            (store) => store.add(payload)
        );
    }

    public async getObject<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
        return this.executeTransaction<T>(
            storeName,
            'readonly',
            (store) => store.get(key)
        );
    }

    public async getAllObjects<T>(storeName: string): Promise<T[]> {
        const results = await this.executeTransaction<T[]>(
            storeName,
            'readonly',
            (store) => store.getAll()
        );
        return results || [];
    }

    public async getObjectsByIndex<T>(
        storeName: string,
        indexName: string,
        key: IDBValidKey | IDBKeyRange
    ): Promise<T[]> {
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            
            if (!store.indexNames.contains(indexName)) {
                reject(new Error(`Index '${indexName}' not found in store '${storeName}'`));
                return;
            }
            
            const index = store.index(indexName);
            const request = index.getAll(key);
            
            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(new Error(`Failed to get objects by index: ${request.error?.message}`));
        });
    }

    public async updateObject<T extends Record<string, any>>(
        storeName: string, 
        object: T
    ): Promise<void> {
        this.validateObject(storeName, object);
        const payload = this.preparePayload(storeName, object);
        
        await this.executeTransaction<void>(
            storeName,
            'readwrite',
            (store) => store.put(payload)
        );
    }

    public async deleteObject(storeName: string, key: IDBValidKey): Promise<void> {
        await this.executeTransaction<void>(
            storeName,
            'readwrite',
            (store) => store.delete(key)
        );
    }

    public async clearStore(storeName: string): Promise<void> {
        await this.executeTransaction<void>(
            storeName,
            'readwrite',
            (store) => store.clear()
        );
    }

    public async countObjects(storeName: string): Promise<number> {
        return this.executeTransaction<number>(
            storeName,
            'readonly',
            (store) => store.count()
        );
    }

    public async objectExists(storeName: string, key: IDBValidKey): Promise<boolean> {
        const count = await this.executeTransaction<number>(
            storeName,
            'readonly',
            (store) => store.count(key)
        );
        return count > 0;
    }

    public async bulkAdd<T extends Record<string, any>>(
        storeName: string, 
        objects: T[]
    ): Promise<void> {
        if (objects.length === 0) return;
        
        const db = await this.openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let addedCount = 0;
            let errorCount = 0;
            
            for (const object of objects) {
                try {
                    this.validateObject(storeName, object);
                    const payload = this.preparePayload(storeName, object);
                    const request = store.add(payload);
                    
                    request.onsuccess = () => {
                        addedCount++;
                        if (addedCount + errorCount === objects.length) {
                            resolve();
                        }
                    };
                    
                    request.onerror = () => {
                        errorCount++;
                        if (request.error?.name !== 'ConstraintError') {
                            console.error(`Failed to add object: ${request.error?.message}`);
                        }
                        if (addedCount + errorCount === objects.length) {
                            resolve();
                        }
                    };
                } catch (error) {
                    errorCount++;
                    console.error(`Validation failed for object:`, error);
                    if (addedCount + errorCount === objects.length) {
                        resolve();
                    }
                }
            }
            
            transaction.onerror = () => reject(new Error(`Bulk add transaction failed: ${transaction.error?.message}`));
        });
    }

    public async close(): Promise<void> {
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = undefined;
        }
    }

    public async dropDB(): Promise<void> {
        await this.close();
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message}`));
            request.onblocked = () => reject(new Error('Database deletion blocked by open connections'));
        });
    }

    public async exportStore<T>(storeName: string): Promise<T[]> {
        return this.getAllObjects<T>(storeName);
    }

    public async importStore<T extends Record<string, any>>(
        storeName: string, 
        data: T[], 
        clearFirst: boolean = true
    ): Promise<void> {
        if (clearFirst) {
            await this.clearStore(storeName);
        }
        await this.bulkAdd(storeName, data);
    }

    public async getDatabaseInfo(): Promise<{
        name: string;
        version: number;
        stores: string[];
        storeSizes: Record<string, number>;
    }> {
        const db = await this.openDB();
        const stores = Array.from(db.objectStoreNames);
        const storeSizes: Record<string, number> = {};
        
        for (const storeName of stores) {
            storeSizes[storeName] = await this.countObjects(storeName);
        }
        
        return {
            name: this.dbName,
            version: this.version,
            stores,
            storeSizes
        };
    }
}