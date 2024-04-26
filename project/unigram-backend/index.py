from mimetypes import guess_extension
import os
import random
import string
import tempfile
import threading
import time
import asyncio
import json
from base64 import b64encode
from aiohttp import web
import requests
from flask import Flask, jsonify, render_template, request
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import Dialog

from AAC import AAC

app = Flask(__name__, template_folder="./templates")
app.config['CORS_HEADERS'] = 'Content-Type'

#load file settings.json
settings = {}
with open("./settings.json","r") as f:
    settings = json.load(f)

aac = AAC("it")
#load from env
api_id = settings["api_id"]
api_hash = settings["api_hash"]

# Should be a map with ["token","client]
clients_connected = {}

# Function to create a random token
def create_token():
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(32))

# Convert dialog to JSON
def dialog_to_json(dialog: Dialog):
    return {
        "name": dialog.name,
        "date": dialog.date,
        "entity": json.loads(dialog.entity.to_json()),
        "message": json.loads(dialog.message.to_json())
    }


async def gen_telegram_client(token):
    client = TelegramClient("sessions/"+token, api_id, api_hash)
    return client

def get_telegram_client(token) -> TelegramClient:
    if token in clients_connected:
        print("Client already connected")
        c = TelegramClient(StringSession(clients_connected[token]), api_id, api_hash)
        print(c.session.__dict__)
        return c
    with open("sessions/sessions.json", "r") as f:
        sessions = json.load(f)
        for session in sessions:
            if token not in session:
                continue
            client = TelegramClient(StringSession(session[token]), api_id, api_hash)
            print(client.session.__dict__)
            clients_connected[token] = session[token]
            return client
        return None


# Ask for login
async def ask_for_login(phone_number):
    token = create_token()
    client = await gen_telegram_client(token)
    await client.connect()
    result = await client.send_code_request(phone_number)
    phone_hash = result.phone_code_hash
    return {"token": token, "phone_hash": phone_hash}

# Confirm login
async def confirm(token, phone_number, code, phone_hash):
    print(token, phone_number, code, phone_hash)
    client = TelegramClient("sessions/"+token, api_id, api_hash)
    await client.connect()
    await client.sign_in(phone=phone_number, code=code, phone_code_hash=phone_hash)
    string = StringSession.save(client.session)
    with open("sessions/sessions.json","r") as f:
        sessions = json.load(f)
        sessions.append({token:string})
        with open("sessions/sessions.json","w") as f:
            json.dump(sessions,f)
    client.disconnect()
    os.remove("sessions/"+token+".session")
    return {"status": "success", "message": "Login confirmed"}
    

# Get Telegram dialog info
async def get_telegram_dialog_info(token, identifier):
    async with get_telegram_client(token) as client:
        if client:
            dialog = await client.get_entity(identifier)
            return dialog.to_json()
        return None

# Get Telegram personal info
async def get_telegram_personal_info(token):
    async with get_telegram_client(token) as client:
        return await client.get_me()

# Get Telegram messages with limit
async def get_telegram_messages_limit(token, identifier, limit):
    result = []
    async with get_telegram_client(token) as client:
        chat = await client.get_input_entity(identifier)
        messages = await client.get_messages(chat, limit=limit)
        for message in messages:
            msg = json.loads(message.to_json())
            if message.media:
                msg["media_extra"] = b64encode(await message.download_media(bytes)).decode()
            result.append(msg)
        return result

# Get Telegram messages
async def get_telegram_messages(token, identifier,media=True):
    result = []
    async with get_telegram_client(token) as client:
        chat = await client.get_input_entity(identifier)
        async for message in client.iter_messages(chat):
            msg = json.loads(message.to_json())
            if message.media and media:
                msg["media_extra"] = b64encode(await message.download_media(bytes)).decode()
            result.append(msg)
        return result

# Send Telegram message
async def send_telegram_message(token, message, to):
    async with get_telegram_client(token) as client:
        res = await client.send_message(to, message)
        return res

# Get Telegram contacts
async def get_telegram_contacts(token,media=True):
    result = []
    async with get_telegram_client(token) as client:
        async for dialog in client.iter_dialogs():
            #if dialog.is_user:
            result.append(dialog_to_json(dialog))
            if media and dialog.entity.photo:
                try:
                    photos = await client.get_profile_photos(dialog.entity.id)
                    result[-1]["image"] = b64encode(await client.download_media(photos[0], file=bytes)).decode()
                except Exception as e:
                    print("")
                print("Contact: "+dialog.name)
        return jsonify(result)

# Send Telegram message with image
async def send_telegram_message_image(token, image_url, caption, to):
    if not image_url:
        return jsonify({"error": "Image URL not provided"}), 400
    try:
        response = requests.get(image_url)
        if not response.ok:
            return jsonify({"error": "Failed to download image"}), 500
        file_extension = guess_extension(response.headers.get('content-type'))
        if not file_extension:
            file_extension = '.png'
        with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as temp_file:
            temp_file.write(response.content)
            temp_file.close()
            async with get_telegram_client(token) as client:
                res = await client.send_file(to, temp_file.name, caption=caption)
                os.unlink(temp_file.name)
                return res
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Flask routes


@app.route('/me', methods=['GET'])
async def get_me():
    token = request.headers.get('token')
    result = await get_telegram_personal_info(token)
    return result.to_json()

@app.route('/contacts', methods=['GET'])
async def get_contacts():
    current_time = time.time()
    token = request.headers.get('token')
    result = await get_telegram_contacts(token)
    print("(Contact) Time taken: "+str(time.time()-current_time))
    return result

@app.route('/contacts/<identifier>', methods=['GET'])
async def get_contact_info(identifier):
    token = request.headers.get('token')
    async with get_telegram_dialog_info(token,identifier) as result:
        return result

@app.route('/messages/<identifier>/<limit>', methods=['GET'])
async def get_messages_with_limit(identifier,limit):
    current_time = time.time()
    token = request.headers.get('token')
    result = await get_telegram_messages_limit(token,identifier,int(limit))
    
    print("(Messages) Time taken: "+str(time.time()-current_time))
    
    return jsonify(result)

@app.route('/messages/<identifier>', methods=['GET'])
async def get_messages(identifier):
    token = request.headers.get('token')
    result = await get_telegram_messages(token,identifier)
    return jsonify(result)

@app.route('/messages/send/<identifier>', methods=['POST'])
async def send_message(identifier):
    token = request.headers.get('token')
    data = request.get_json()
    return (await send_telegram_message(token,data["message"],identifier)).to_json()

@app.route('/messages/send/image/<identifier>', methods=['POST'])
async def send_image(identifier):
    token = request.headers.get('token')
    data = request.get_json()
    image_url = data.get("image")
    caption = data.get("caption")
    res = await send_telegram_message_image(token,image_url,caption,identifier)
    print(res)
    return res
    

@app.route('/login/<phone_number>', methods=['GET'])
async def login(phone_number):
    result = await ask_for_login(phone_number)
    return jsonify({"status": "success", "token": result["token"], "phone_hash": result["phone_hash"]})


@app.route('/login/confirm', methods=['POST'])
async def confirm_login():
    
    token = request.headers.get('token')
    phone_number = request.json.get('phone_number')
    code = request.json.get('code')
    phone_hash = request.json.get('phone_hash')
    
    await confirm(token,phone_number, code, phone_hash)
    return jsonify({"status": "success", "message": "Login confirmed"})

if __name__ == '__main__':
    
    get_telegram_client("uJzqxP7mpbbHTrN6LCJ7JlNnq8iysmkm")
    
    app.run(debug=True,port=5000)
    
    #read all sessions and save as string
    #result = []
    #print("Reading sessions")
    #for file in os.listdir("sessions"):
    #    if not file.endswith(".session"):
    #        continue
    #    print("Reading session: "+file)
    #    with TelegramClient("sessions/"+file, api_id, api_hash,timeout=20) as client:
    #        print("Reading session: "+file)
    #        string = StringSession.save(client.session)
    #        token = file.split(".")[0]
    #        result.append({token:string})
    #        client.disconnect()
    #write file result
    
    #print(result)
    #
    #with open("sessions/sessions.json","w") as f:
    #    json.dump(result,f)
    