import { StringSession } from "telegram/sessions";
import { AAC } from "./AAC";
import { Store } from "./Store";
import { TgApi } from "./TgApi";

// Centralized shared singletons to avoid circular imports when refactoring Controller
export const tgApi = new TgApi(localStorage.getItem('stringSession') ? new StringSession(localStorage.getItem('stringSession') as string) : new StringSession(''));
export const aac = new AAC("it");
export const storage = new Store('pictochat-storage', 3);
