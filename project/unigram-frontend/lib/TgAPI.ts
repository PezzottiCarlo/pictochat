import { Message, User } from "../model/Types";

export class TelegramAPI {
    static url: string;
    static token: string;



    static getMe: () => Promise<User> = async () => {
        const res = await fetch(`${this.url}/me`, {
            headers: {
                "Accept": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = await res.json();
        return data;
    }

    static getMessages: (identifier:string|number) => Promise<Message[]> = async (identifier:string|number) => {
        const res = await fetch(`${this.url}/messages/${identifier}`, {
            headers: {
                "Accept": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = (await res.json()) as Message[];
        return data.reverse();
    }

    static getMessagesLimited: (identifier:string|number,limit:number) => Promise<Message[]> = async (identifier:string|number,limit:number) => {
        const res = await fetch(`${this.url}/messages/${identifier}/${limit}`, {
            headers: {
                "Accept": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = (await res.json());
        return data.reverse();
    }

    static sendMessage: (identifier:string|number,message:string) => Promise<Message> = async (identifier:string|number,message:string) => {
        const res = await fetch(`${this.url}/messages/send/${identifier}`, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "token": this.token
            },
            method: "POST",
            body: JSON.stringify({message:message})
        });
        const data = await res.json();
        return data;
    }


    static sendImage: (identifier:string|number,image:any,caption:string) => Promise<Message> = async (identifier:string|number,image:string,caption:string) => {
        const res = await fetch(`${this.url}/messages/send/image/${identifier}`, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "token": this.token
            },
            method: "POST",
            body: JSON.stringify({image:image,caption:caption})
        });
        const data = await res.json();
        return data;
    }

    static getContacts: () => Promise<any> = async () => {
        const res = await fetch(`${this.url}/contacts`, {
            headers: {
                "Accept": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = (await res.json()) as {id:number,name:string}[];
        return data;
    }

    static getDialog: (identifier:string|number) => Promise<any> = async (identifier:string|number) => {
        const res = await fetch(`${this.url}/contacts/${identifier}`, {
            headers: {
                "Accept": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = await res.json();
        return data;
    }


    static sendCode: (phoneNumber:string) => Promise<{token:string,phone_hash:string,status:string}> = async (phoneNumber:string) => {
        const res = await fetch(`${this.url}/login/${phoneNumber}`, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "token": this.token
            },
            method: "GET"
        });
        const data = await res.json();
        return data;
    }

    static singIn: (token:string, phoneNumber:string,code:string,phoneHash:string) => Promise<{message:string,status:string}> = async (token:string,phoneNumber:string,code:string,phoneHash:string) => {
        
        console.log(token,phoneNumber,code,phoneHash);
        
        const res = await fetch(`${this.url}/login/confirm`, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "token": token
            },
            method: "POST",
            body: JSON.stringify({code:code,phone_hash:phoneHash,phone_number:phoneNumber})
        });
        const data = await res.json();
        return data;
    }
}