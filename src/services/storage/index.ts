/** IndexedDB cache for the messaging layer. Plain data only (no GramJS objects). */
export { clearMessagingStorage, migrateFromV1, type PeerRef, type AvatarRecord } from './db';
export { loadChats, saveChats } from './chats';
export {
  getCachedPage,
  putMessages,
  updateCachedMessage,
  deleteCachedMessages,
  deleteCachedBelow,
} from './messages';
export { loadPeerRefs, savePeerRefs } from './peers';
export {
  getAvatarRecord,
  putAvatarRecord,
  getMediaBlob,
  putMediaBlob,
  evictMedia,
  MEDIA_CACHE_LIMIT,
} from './blobs';
