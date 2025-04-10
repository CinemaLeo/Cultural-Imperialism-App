from googletrans import Translator, LANGUAGES, LANGCODES
import random
import asyncio
import time
import json
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# Connection Manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)


# Initialise
app = FastAPI()
translator = Translator()
manager = ConnectionManager()
BLACKLISTED_LANGUAGES = ["la", "zh", "iw", "jw", "tl", "ndc-zw"]
maximum_translations = 56 - 1  # 56, including the original language
recurrant_failures = 0
failure_threshold = 5

# API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or "*" to allow all
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

# Create randomised language list
def get_randomised_language_list():
    randomised_language_tuples = list(LANGUAGES.items())  # Create a list of tuples
    random.shuffle(randomised_language_tuples)  # Shuffle the list of tuples
    return randomised_language_tuples


async def detect_language(text):
    success = False
    detected_language = None
    print("TEXT =", text)
    try:
        detected_language = translator.detect(text)
        print(detected_language.lang, f"{LANGUAGES[detected_language.lang]}, Confidence = ", detected_language.confidence)
        if detected_language.confidence is not None and detected_language.confidence > 0.9:
            success = True
        # WebSocket version doesn't need interactive prompting
    except Exception as e:
        print(f"Error detecting language: {e}")
    
    if success:
        return success, detected_language.lang
    else:
        # Default to English if detection fails
        return False, "en"


# Translate 
async def translate_text(text, source_language, target_language, max_retries=2):
    retries = 0
    length_variation_factor = 10
    delay_s = 1.5
    success = False

    while retries < max_retries:
        try:  # Standard translation
            translation = translator.translate(text, dest=target_language, src=source_language)
            if translation.text != text:  # If successful, return
                if len(translation.text) > len(text)/length_variation_factor and len(translation.text) < len(text)*length_variation_factor:
                    success = True
                    return translation.text, success
                elif len(translation.text) < len(text):  # If WAY shorter, retry
                    print(f"TRANSLATION FAILED: Translation shorter than lower range: {len(text) / length_variation_factor} chars")
                elif len(translation.text) > len(text):  # If WAY longer, retry
                    print(f"TRANSLATION FAILED: Translation longer than upper range: {len(text) * length_variation_factor} chars")

        except Exception as e:  # Other failures
            print(f"TRANSLATION FAILED: Exception {str(e)}")

        retries += 1
        print(f"RETRY TRANSLATION: {source_language} {LANGUAGES[source_language]} -> {target_language} {LANGUAGES[target_language]}: Attempt {retries}")
        await asyncio.sleep(delay_s)  # Small delay to avoid hitting the rate limit

    # Fail and fallback to original
    print(f"{target_language}: {LANGUAGES[target_language]}: Failed after {max_retries} retries")
    return text, False


async def translate_to_original(text, source_language, original_language):
    translation = translator.translate(text, dest=original_language, src=source_language)
    return translation.text


# WebSocket endpoint for translation
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Wait for text to translate from client
            data = await websocket.receive_text()
            
            # Parse the incoming data
            try:
                request_data = json.loads(data)
                input_text = request_data.get("text", "")
                
                # Send acknowledgment
                await manager.send_message(client_id, {
                    "type": "status",
                    "message": "Translation started",
                    "input": input_text
                })
                
                # Start translation process
                asyncio.create_task(process_translation(client_id, input_text))
                
            except json.JSONDecodeError:
                await manager.send_message(client_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"Error with client {client_id}: {str(e)}")
        manager.disconnect(client_id)


async def process_translation(client_id: str, input_text: str):
    # Language detection
    detected_result = await detect_language(input_text)
    success, original_language = detected_result
    
    # Send language detection result
    await manager.send_message(client_id, {
        "type": "detection",
        "success": success,
        "language": original_language,
        "language_name": LANGUAGES.get(original_language, "Unknown")
    })
    
    if not success:
        await manager.send_message(client_id, {
            "type": "error",
            "message": "Could not detect language confidently. Defaulting to English."
        })
        original_language = "en"
    
 
    await manager.send_message(client_id, {
    "type": "translation",
    "index": 0,
    "translation": {
        "source_language": original_language,
        "source_language_name": LANGUAGES[original_language],
        "target_language": original_language,
        "target_language_name": LANGUAGES[original_language],
        "original_text": input_text,
        "translated_text": input_text,
        "back_translation": ""
    }})
    
    iterated_text = input_text  # For iteration
    
    randomised_languages = get_randomised_language_list()  # Get randomised language list
    randomised_languages = [lang for lang in randomised_languages if lang[0] != original_language]  # Remove original language from options

    # Variables and tracking
    successful_translations = 0
    translations = []  # Array of all outputs
    failed_translations = 0
    problem_languages = []
    start_time = time.time()
    
    # Translate Loop & Progressive Output
    print(f"Inputs: Language = {original_language} Text = {input_text}")
    for lang_code, lang_name in randomised_languages:
        if successful_translations >= maximum_translations:
            break
        
        if lang_code in BLACKLISTED_LANGUAGES or lang_code is original_language:
            continue

        # Send "in progress" message
        await manager.send_message(client_id, {
            "type": "progress",
            "message": f"Translating to {lang_name} ({lang_code})...",
            "current_language": lang_code,
            "current_language_name": lang_name
        })
        
        iterated_language = LANGUAGES[lang_code]  # store new language
        uniterated_text = str(iterated_text)
        output_translation, success = await translate_text(iterated_text, original_language, lang_code)
        iterated_text = output_translation

        if success:
            successful_translations += 1
            back_translation = await translate_to_original(iterated_text, lang_code, original_language)
            print(f"{LANGUAGES[original_language]} ({original_language}) to {lang_name} ({lang_code}): {uniterated_text} ==TRANS== {iterated_text} --MEANING--> {back_translation}")
            
            translation_data = {
                "source_language": original_language,
                "source_language_name": LANGUAGES[original_language],
                "target_language": lang_code,
                "target_language_name": lang_name,
                "original_text": uniterated_text,
                "translated_text": iterated_text,
                "back_translation": back_translation
            }
            
            translations.append(translation_data)
            
            # Send each successful translation immediately
            await manager.send_message(client_id, {
                "type": "translation",
                "index": successful_translations,
                "translation": translation_data
            })
            
            iterated_text = back_translation  # Use back_translation for next iteration
        else:
            failed_translations += 1
            problem_languages.append(lang_name)
            iterated_text = uniterated_text
            print("\n Failed to translate: Reverted to previous text \n")
            
            # Send failure notification
            await manager.send_message(client_id, {
                "type": "translation_failed",
                "language": lang_code,
                "language_name": lang_name
            })

    # Final Output
    end_time = time.time()
    duration = end_time - start_time
    
    # Send completion message with all translations
    await manager.send_message(client_id, {
        "type": "complete",
        "input": input_text,
        "translations": translations,
        "duration": duration,
        "successful_translations": successful_translations,
        "failed_translations": failed_translations,
        "problem_languages": problem_languages
    })


# Keep the REST endpoint for backward compatibility
@app.post("/translate")
async def translate(payload: TextInput):
    print(payload, "PAYLOAD")

    # Inputs
    input_text = str(payload.text)
    detected_language = await detect_language(input_text)
    if not detected_language[0]:
        return {"error": "Could not detect language"}
    
    original_language = detected_language[1]
    iterated_text = input_text  # For iteration
    output_translation = None
    back_translation = None

    randomised_languages = get_randomised_language_list()  # Get randomised language list
    randomised_languages = [lang for lang in randomised_languages if lang[0] != original_language]  # Remove original language from options

    # Variables and tracking
    successful_translations = 0
    translations = []  # Array of all outputs
    failed_translations = 0
    problem_languages = []
    start_time = time.time()
    iterated_language = LANGUAGES[original_language]
    
    # Translate Loop & Progressive Output
    print(f"Inputs: Language = {original_language} Text = {input_text}")
    for lang_code, lang_name in randomised_languages:
        if successful_translations >= maximum_translations:
            break
        
        if lang_code in BLACKLISTED_LANGUAGES or lang_code is original_language:
            continue

        iterated_language = LANGUAGES[lang_code]  # store new language
        uniterated_text = str(iterated_text)
        output_translation, success = await translate_text(iterated_text, original_language, lang_code)
        iterated_text = output_translation

        if success:
            successful_translations += 1
            back_translation = await translate_to_original(iterated_text, lang_code, original_language)
            print(f"{LANGUAGES[original_language]} ({original_language}) to {lang_name} ({lang_code}): {uniterated_text} ==TRANS== {iterated_text} --MEANING--> {back_translation}")
            
            translations.append((lang_name, iterated_text, back_translation))
            iterated_text = back_translation  # Use back_translation for next iteration
        else:
            failed_translations += 1
            problem_languages.append(lang_name)
            iterated_text = uniterated_text
            print("\n Failed to translate: Reverted to previous text \n")

    # Final LOCAL Output
    end_time = time.time()
    duration = end_time - start_time
    print(f"""
          INPUT: {input_text}
          ORIGINAL LANGUAGE: {original_language}
          FINAL OUTPUT: {iterated_text} 
          DURATION: {duration}
          SUCCESSFUL TRANSLATIONS: {successful_translations} 
          FAILED TRANSLATIONS: {failed_translations}
          ALL OUTPUTS:  {translations} 
          PROBLEM LANGUAGES: {problem_languages} 
          """)
    return {
        "input": input_text,
        "translations": translations,
        "output_language": iterated_language,
        "output_translation": output_translation,
        "back_translation": back_translation
    }


# Start the server with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)