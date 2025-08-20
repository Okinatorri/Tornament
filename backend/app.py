import os
import io
from bson import Binary
import base64
from werkzeug.utils import secure_filename
import bcrypt
from datetime import datetime, timedelta
from flask import Flask, request, session, jsonify
from flask_cors import CORS
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson.objectid import ObjectId
from collections import defaultdict

app = Flask(__name__)

app.config.update(
    SECRET_KEY='your-secret-key-here',
    MONGO_DB='mydatabase',
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_REFRESH_EACH_REQUEST=True
)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 16 * 1024 * 1024


CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

mongo_uri = os.getenv(
    "MONGO_URI", "mongodb://admin:your-secret-key-here@mongodb:27017/")

try:
    client = MongoClient(mongo_uri, authSource='admin')
    db = client[app.config['MONGO_DB']]
    users_collection = db.users
    characters_collection = db.characters
    weapons_collection = db.weapons

    print("[INFO] Connected to database:", db.name)
    print("[INFO] Users list:")
    for user in users_collection.find():
        print(user)

except PyMongoError as e:
    import traceback

    print("Database connection failed!")
    traceback.print_exc()
    exit(1)


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(hashed, password):
    return bcrypt.checkpw(password.encode(), hashed.encode())


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/characters/banned', methods=['POST'])
def get_banned_characters():
    data = request.json
    user1_id = data.get('user1_id')
    user2_id = data.get('user2_id')

    if not user1_id or not user2_id:
        return jsonify({'error': 'user1_id and user2_id are required'}), 400

    try:

        five_star_chars = list(db.characters.find({'rarity': 5}))
        five_star_char_names = [char['name'] for char in five_star_chars]

        user_chars = list(db.user_characters.find({
            'user_id': {'$in': [user1_id, user2_id]},
            'character_data.name': {'$in': five_star_char_names}
        }))

        char_info = {}
        for char in user_chars:
            char_name = char['character_data']['name']
            user_id = char['user_id']
            if char_name not in char_info:
                char_info[char_name] = {
                    'user1': None,
                    'user2': None
                }

            char_info[char_name][user_id] = {
                'value1': char['character_data'].get('value1', 0),
                'value2': char['character_data'].get('value2', 0)
            }

        banned_characters = []
        for char_name, data in char_info.items():
            u1_data = data.get(user1_id)
            u2_data = data.get(user2_id)

            if not u1_data or not u2_data:
                banned_data = u1_data or u2_data or {'value1': 0, 'value2': 0}
                banned_characters.append({
                    'name': char_name,
                    'value1': banned_data['value1'],
                    'value2': banned_data['value2']
                })
                continue

            if char_name == "Shorekeeper":

                if not u1_data or not u2_data:
                    banned_characters.append({
                        'name': char_name,
                        'value1': (u1_data or u2_data)['value1'],
                        'value2': (u1_data or u2_data)['value2']
                    })
                    continue

                if (
                        (u1_data['value2'] >= 1 and u2_data['value2'] == 0) or
                        (u2_data['value2'] >= 1 and u1_data['value2'] == 0)
                ):
                    banned_characters.append({
                        'name': char_name,
                        'value1': (u1_data if u1_data['value2'] >= 1 else u2_data)['value1'],
                        'value2': (u1_data if u1_data['value2'] >= 1 else u2_data)['value2']
                    })
                    continue

                continue

            if u1_data['value2'] > 2 or u2_data['value2'] > 2:
                if u1_data['value2'] > 2:
                    banned_characters.append({
                        'name': char_name,
                        'value1': u1_data['value1'],
                        'value2': u1_data['value2']
                    })
                if u2_data['value2'] > 2:
                    banned_characters.append({
                        'name': char_name,
                        'value1': u2_data['value1'],
                        'value2': u2_data['value2']
                    })

        return jsonify({'banned_characters': banned_characters})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


failed_attempts = {}


@app.route("/login", methods=["POST"])
def login():
    try:

        client_ip = request.remote_addr

        if client_ip in failed_attempts:
            blocked_until = failed_attempts[client_ip].get('blocked_until')
            if blocked_until and datetime.now() < blocked_until:
                remaining_time = (blocked_until - datetime.now()).seconds
                return jsonify({
                    "status": "error",
                    "message": f"Too many attempts. Try again in {remaining_time} seconds",
                    "code": "rate_limited"
                }), 429

        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"status": "error", "message": "Username and password required"}), 400

        user = users_collection.find_one({"username": username})
        if not user or not check_password(user.get("password"), password):

            if client_ip not in failed_attempts:
                failed_attempts[client_ip] = {
                    'count': 0, 'blocked_until': None}

            failed_attempts[client_ip]['count'] += 1

            if failed_attempts[client_ip]['count'] >= 3:
                failed_attempts[client_ip]['blocked_until'] = datetime.now(
                ) + timedelta(minutes=1)
                return jsonify({
                    "status": "error",
                    "message": "Too many attempts. Try again in 1 minute",
                    "code": "rate_limited"
                }), 429

            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        if client_ip in failed_attempts:
            del failed_attempts[client_ip]

        session.permanent = True
        session["username"] = username
        session["status"] = user.get("status", "player")
        session["_fresh"] = True

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "username": username,
                "display_name": user.get("display_name"),
                "status": session["status"]
            }
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500


@app.route("/logout", methods=["POST"])
def logout():
    try:
        username = session["username"]
        session.clear()
        return jsonify({"status": "success", "message": "Logged out"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal server error"}), 500


@app.route("/check_session", methods=["GET"])
def check_session():
    try:
        if "username" in session:
            username = session["username"]
            user = users_collection.find_one({"username": username})
            if user:
                return jsonify({
                    "status": "success",
                    "is_logged_in": True,
                    "user": {
                        "username": username,
                        "display_name": user.get("display_name"),
                        "status": session.get("status", "player")
                    }
                }), 200

        return jsonify({
            "status": "success",
            "is_logged_in": False,
            "user": None
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": "Internal server error"}), 500


@app.route("/players", methods=["GET"])
def get_players():
    try:
        players = list(users_collection.find(
            {"status": "player"},
            {"display_name": 1, "username": 1, "_id": 0}
        ))
        return jsonify({"status": "success", "data": players}), 200
    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/players/<string:player_name>", methods=["GET"])
def get_player(player_name):
    try:
        player = users_collection.find_one(
            {"status": "player", "username": player_name},
            {"display_name": 1, "username": 1, "_id": 0}
        )
        if player:
            return jsonify({"status": "success", "data": player}), 200
        else:
            return jsonify({"status": "error", "message": "Player not found"}), 404
    except PyMongoError:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/characters", methods=["GET"])
def get_characters():
    try:
        characters = list(characters_collection.find({}, {"_id": 0}))
        return jsonify({"status": "success", "data": characters}), 200
    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/weapons", methods=["GET"])
def get_weapons():
    try:
        weapons = list(weapons_collection.find({}, {"_id": 0}))
        return jsonify({"status": "success", "data": weapons}), 200
    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/player/<string:player_name>/weapons", methods=["GET", "POST", "DELETE", "PATCH"])
def user_weapons(player_name):
    try:
        if request.method != "GET":
            if 'username' not in session:
                return jsonify({"status": "error", "message": "Unauthorized - not logged in"}), 401

            user = db.users.find_one({"username": session['username']})
            if not user:
                return jsonify({"status": "error", "message": "User not found"}), 404

            if user['username'] != player_name and user.get('status') != 'admin':
                return jsonify({"status": "error", "message": "Unauthorized - insufficient privileges"}), 403

        effective_username = player_name
        if request.method != "GET" and user.get('status') == 'admin' and user['username'] != player_name:
            effective_username = player_name
        elif request.method != "GET":
            effective_username = user['username']

        if request.method == "GET":

            user_weapons = list(db.user_weapons.find(
                {"user_id": player_name},
                {"_id": 0, "user_id": 0, "weapon_id": 0}
            ))

            weapons_list = [item["weapon_data"] for item in user_weapons]

            rarity_map = {}
            all_weapons_data = db.weapons.find(
                {}, {"_id": 0, "name": 1, "rarity": 1})
            for weapon in all_weapons_data:
                rarity_map[weapon["name"]] = weapon.get("rarity", 0)

            for weapon in weapons_list:
                weapon["rarity"] = rarity_map.get(weapon["name"], 0)

            weapons_list.sort(key=lambda w: w.get("rarity", 0), reverse=True)

            return jsonify({"status": "success", "data": weapons_list}), 200

        elif request.method == "POST":

            data = request.get_json()
            if not data or not isinstance(data.get('weapons'), list):
                return jsonify({"status": "error", "message": "Expected array of weapons"}), 400

            added_weapons = []
            skipped_weapons = []

            for weapon_name in data['weapons']:

                weapon = db.weapons.find_one({"name": weapon_name}, {"_id": 0})
                if not weapon:
                    skipped_weapons.append(weapon_name)
                    continue

                existing = db.user_weapons.find_one({
                    "user_id": effective_username,
                    "weapon_id": weapon_name
                })

                if existing:
                    skipped_weapons.append(weapon_name)
                    continue

                db.user_weapons.insert_one({
                    "user_id": effective_username,
                    "weapon_id": weapon_name,
                    "weapon_data": {'name': weapon_name, 'value1': 0, 'value2': 1}
                })
                added_weapons.append(weapon_name)

            response = {
                "status": "success",
                "message": "Weapons added",
            }

            if not added_weapons and skipped_weapons:
                return jsonify(response), 207
            return jsonify(response), 200

        elif request.method == "DELETE":

            data = request.get_json()
            if not data or not isinstance(data.get('weapons'), list):
                return jsonify({"status": "error", "message": "Expected array of weapons"}), 400

            deleted_weapons = []
            not_found_weapons = []

            for weapon_name in data['weapons']:

                result = db.user_weapons.delete_one({
                    "user_id": effective_username,
                    "weapon_id": weapon_name
                })

                if result.deleted_count > 0:
                    deleted_weapons.append(weapon_name)
                else:
                    not_found_weapons.append(weapon_name)

            response = {
                "status": "success",
                "message": "Weapons deleted",
                "deleted": deleted_weapons,
                "not_found": not_found_weapons
            }

            if not deleted_weapons and not_found_weapons:
                return jsonify(response), 404
            elif not_found_weapons:
                return jsonify(response), 207
            return jsonify(response), 200

        elif request.method == "PATCH":

            data = request.get_json()
            if not data or not isinstance(data, dict):
                return jsonify({"status": "error", "message": "Expected object with weapon updates"}), 400

            updated_weapons = []
            not_found_weapons = []

            for weapon_name, updates in data.items():

                if not isinstance(updates, dict) or not all(key in updates for key in ['value1', 'value2']):
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid updates for weapon {weapon_name}. Expected value1 and value2"
                    }), 400

                existing = db.user_weapons.find_one({
                    "user_id": effective_username,
                    "weapon_id": weapon_name
                })

                if not existing:
                    not_found_weapons.append(weapon_name)
                    continue

                db.user_weapons.update_one(
                    {
                        "user_id": effective_username,
                        "weapon_id": weapon_name
                    },
                    {
                        "$set": {
                            "weapon_data.value1": updates['value1'],
                            "weapon_data.value2": updates['value2']
                        }
                    }
                )
                updated_weapons.append(weapon_name)

            response = {
                "status": "success",
                "message": "Weapons updated",
            }

            if not updated_weapons and not_found_weapons:
                return jsonify(response), 404
            elif not_found_weapons:
                return jsonify(response), 207
            return jsonify(response), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/player/<string:player_name>/characters", methods=["GET", "POST", "DELETE", "PATCH"])
def user_characters(player_name):
    try:

        if request.method != "GET":
            if 'username' not in session:
                return jsonify({"status": "error", "message": "Unauthorized - not logged in"}), 401

            user = db.users.find_one({"username": session['username']})
            if not user:
                return jsonify({"status": "error", "message": "User not found"}), 404

            if user['username'] != player_name and user.get('status') != 'admin':
                return jsonify({"status": "error", "message": "Unauthorized - insufficient privileges"}), 403

        effective_username = player_name
        if request.method != "GET" and user.get('status') == 'admin' and user['username'] != player_name:
            effective_username = player_name
        elif request.method != "GET":
            effective_username = user['username']

        if request.method == "GET":

            user_chars = list(db.user_characters.find(
                {"user_id": player_name},
                {"_id": 0, "user_id": 0, "character_id": 0}
            ))

            chars_list = [item["character_data"] for item in user_chars]

            rarity_map = {}
            all_chars_data = db.characters.find(
                {}, {"_id": 0, "name": 1, "rarity": 1})
            for char in all_chars_data:
                rarity_map[char["name"]] = char.get("rarity", 0)

            for char in chars_list:
                char["rarity"] = rarity_map.get(char["name"], 0)

            chars_list.sort(key=lambda c: c.get("rarity", 0), reverse=True)

            return jsonify({"status": "success", "data": chars_list}), 200

        elif request.method == "POST":

            data = request.get_json()
            if not data or not isinstance(data.get('characters'), list):
                return jsonify({"status": "error", "message": "Expected array of characters"}), 400

            added_chars = []
            skipped_chars = []

            for char_name in data['characters']:

                character = db.characters.find_one(
                    {"name": char_name}, {"_id": 0})
                if not character:
                    skipped_chars.append(char_name)
                    continue

                existing = db.user_characters.find_one({
                    "user_id": effective_username,
                    "character_id": char_name
                })

                if existing:
                    skipped_chars.append(char_name)
                    continue

                db.user_characters.insert_one({
                    "user_id": effective_username,
                    "character_id": char_name,
                    "character_data": {'name': char_name, 'value1': 0, 'value2': 0}
                })
                added_chars.append(char_name)

            response = {
                "status": "success",
                "message": "Characters added",
            }

            if not added_chars and skipped_chars:
                return jsonify(response), 207
            return jsonify(response), 200

        elif request.method == "DELETE":

            data = request.get_json()
            if not data or not isinstance(data.get('characters'), list):
                return jsonify({"status": "error", "message": "Expected array of characters"}), 400

            deleted_chars = []
            not_found_chars = []

            for char_name in data['characters']:

                result = db.user_characters.delete_one({
                    "user_id": effective_username,
                    "character_id": char_name
                })

                if result.deleted_count > 0:
                    deleted_chars.append(char_name)
                else:
                    not_found_chars.append(char_name)

            response = {
                "status": "success",
                "message": "Characters deleted",
                "deleted": deleted_chars,
                "not_found": not_found_chars
            }

            if not deleted_chars and not_found_chars:
                return jsonify(response), 404
            elif not_found_chars:
                return jsonify(response), 207
            return jsonify(response), 200

        elif request.method == "PATCH":
            data = request.get_json()
            if not data or not isinstance(data, dict):
                return jsonify({"status": "error", "message": "Expected object with character updates"}), 400

            updated_chars = []
            not_found_chars = []

            for char_name, updates in data.items():

                if not isinstance(updates, dict) or not all(key in updates for key in ['value1', 'value2']):
                    return jsonify({
                        "status": "error",
                        "message": f"Invalid updates for character {char_name}. Expected value1 and value2"
                    }), 400

                existing = db.user_characters.find_one({
                    "user_id": effective_username,
                    "character_id": char_name
                })

                if not existing:
                    not_found_chars.append(char_name)
                    continue

                db.user_characters.update_one(
                    {
                        "user_id": effective_username,
                        "character_id": char_name
                    },
                    {
                        "$set": {
                            "character_data.value1": updates['value1'],
                            "character_data.value2": updates['value2']
                        }
                    }
                )
                updated_chars.append(char_name)

            response = {
                "status": "success",
                "message": "Characters updated",
            }

            if not updated_chars and not_found_chars:
                return jsonify(response), 404
            elif not_found_chars:
                return jsonify(response), 207
            return jsonify(response), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/player/<string:player_name>/screenshots", methods=["GET", "POST", "DELETE"])
def user_screenshots(player_name):
    try:

        if request.method != "GET":
            if 'username' not in session:
                return jsonify({"status": "error", "message": "Unauthorized - not logged in"}), 401

            user = db.users.find_one({"username": session['username']})
            if not user:
                return jsonify({"status": "error", "message": "User not found"}), 404

            if user['username'] != player_name and user.get('status') != 'admin':
                return jsonify({"status": "error", "message": "Unauthorized - insufficient privileges"}), 403

        effective_username = player_name
        if request.method != "GET" and user.get('status') == 'admin' and user['username'] != player_name:
            effective_username = player_name
        elif request.method != "GET":
            effective_username = user['username']

        if request.method == "GET":

            screenshots_cursor = db.user_screenshots.find(
                {"user_id": player_name})
            screenshots = []

            for screenshot in screenshots_cursor:

                image_base64 = base64.b64encode(
                    screenshot['image_data']).decode('utf-8')

                screenshots.append({
                    "id": str(screenshot['_id']),
                    "filename": screenshot['filename'],
                    "size": screenshot.get('size', 0),
                    "content_type": screenshot.get('content_type', 'image/png'),
                    "image_data": image_base64
                })

            return jsonify({
                "status": "success",
                "data": screenshots,
                "count": len(screenshots)
            }), 200

        elif request.method == "POST":

            if 'file' not in request.files:
                return jsonify({"status": "error", "message": "No file uploaded"}), 400

            file = request.files['file']

            if not allowed_file(file.filename):
                return jsonify({"status": "error", "message": "Invalid file type"}), 400

            file.seek(0, io.SEEK_END)
            file_size = file.tell()
            file.seek(0)

            if file_size > MAX_FILE_SIZE:
                return jsonify({"status": "error", "message": "File too large"}), 400

            existing_file = db.user_screenshots.find_one({
                "user_id": effective_username,
                "filename": secure_filename(file.filename)
            })

            if existing_file:
                return jsonify({
                    "status": "error",
                    "message": "File with this name already exists"
                }), 409

            binary_data = Binary(file.read())

            content_type = file.content_type or 'application/octet-stream'

            result = db.user_screenshots.insert_one({
                "user_id": effective_username,
                "filename": secure_filename(file.filename),
                "image_data": binary_data,
                "size": file_size,
                "content_type": content_type
            })

            return jsonify({
                "status": "success",
                "message": "Screenshot uploaded",
                "id": str(result.inserted_id),
                "filename": secure_filename(file.filename),
                "size": file_size
            }), 201

        elif request.method == "DELETE":

            if 'screenshot_id' not in request.json:
                return jsonify({"status": "error", "message": "No screenshot ID provided"}), 400

            screenshot_id = request.json['screenshot_id']

            result = db.user_screenshots.delete_one({
                "_id": ObjectId(screenshot_id),
                "user_id": effective_username
            })

            if result.deleted_count == 0:
                return jsonify({"status": "error", "message": "Screenshot not found or not owned by user"}), 404

            return jsonify({"status": "success", "message": "Screenshot deleted"}), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/screenshots/<string:screenshot_id>", methods=["GET", "DELETE"])
def get_or_delete_screenshot(screenshot_id):
    try:
        if request.method == "GET":

            screenshot = db.user_screenshots.find_one(
                {"_id": ObjectId(screenshot_id)},
                {"image_data": 1, "content_type": 1}
            )

            if not screenshot:
                return jsonify({"status": "error", "message": "Screenshot not found"}), 404

            return Response(
                screenshot['image_data'],
                content_type=screenshot['content_type']
            )

        elif request.method == "DELETE":
            if "username" not in session:
                return jsonify({"status": "error", "message": "Unauthorized - login required"}), 401

            screenshot = db.user_screenshots.find_one(
                {"_id": ObjectId(screenshot_id)},
                {"user_id": 1}
            )

            if not screenshot:
                return jsonify({"status": "error", "message": "Screenshot not found"}), 404

            current_user = db.users.find_one(
                {"username": session["username"]},
                {"status": 1}
            )

            is_admin = current_user and current_user.get("status") == "admin"
            is_owner = screenshot.get("user_id") == session["username"]

            if not is_admin and not is_owner:
                return jsonify({"status": "error", "message": "Unauthorized - not your screenshot"}), 403

            result = db.user_screenshots.delete_one(
                {"_id": ObjectId(screenshot_id)})

            if result.deleted_count == 0:
                return jsonify({"status": "error", "message": "Screenshot not found"}), 404

            return jsonify({"status": "success", "message": "Screenshot deleted"}), 200

    except PyMongoError:
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/player/<string:player_name>/name", methods=["POST"])
def change_display_name(player_name):
    try:

        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized",
            }), 401

        current_user = users_collection.find_one(
            {"username": session["username"]})
        if not current_user:
            return jsonify({
                "status": "error",
                "message": "User not found",
            }), 404

        is_admin = current_user.get("status") == "admin"
        if session["username"] != player_name and not is_admin:
            return jsonify({
                "status": "error",
                "message": "You can only change your own display name",
            }), 403

        new_name = request.json.get("newDisplayName")
        if not new_name:
            return jsonify({
                "status": "error",
                "message": "Display name cannot be empty",
            }), 400

        if len(new_name) < 3:
            return jsonify({
                "status": "error",
                "message": "Display name too short (min 3 characters)",
            }), 400

        if len(new_name) > 15:
            return jsonify({
                "status": "error",
                "message": "Display name too long (max 15 characters)",
            }), 400

        result = users_collection.update_one(
            {"username": player_name},
            {"$set": {"display_name": new_name}}
        )

        return jsonify({
            "status": "success",
            "message": "Display name updated",
        }), 200

    except PyMongoError as e:
        return jsonify({
            "status": "error",
            "message": "Database error",
        }), 500


@app.route("/tournaments", methods=["GET"])
def get_all_tournaments():
    try:
        tournaments = list(db.tournaments.find({}, {"_id": 0}))
        return jsonify({"status": "success", "data": tournaments}), 200
    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments", methods=["POST"])
def create_tournament():
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        required_fields = ["tournamentName", "startDate", "endDate", "active"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400

        if data["startDate"] > data["endDate"]:
            return jsonify({
                "status": "error",
                "message": "Start date cannot be after end date"
            }), 400

        existing_tournament = db.tournaments.find_one(
            {"tournamentName": data["tournamentName"]}
        )
        if existing_tournament:
            return jsonify({
                "status": "error",
                "message": "Tournament with this name already exists"
            }), 409

        if data["active"]:
            db.tournaments.update_many(
                {"active": True},
                {"$set": {"active": False}}
            )

        result = db.tournaments.insert_one(data)

        return jsonify({
            "status": "success",
            "message": "Tournament created successfully"
        }), 201

    except PyMongoError as e:
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500


@app.route("/tournaments/<string:tournament_name>", methods=["DELETE"])
def delete_tournament(tournament_name):
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        result = db.tournaments.delete_one(
            {"tournamentName": tournament_name}
        )

        if result.deleted_count == 0:
            return jsonify({
                "status": "error",
                "message": "Tournament not found"
            }), 404

        return jsonify({
            "status": "success",
            "message": "Tournament and associated games deleted"
        }), 200

    except PyMongoError as e:
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500


@app.route("/tournaments/<string:tournament_name>", methods=["PATCH"])
def update_tournament(tournament_name):
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        if data.get("active", False):
            db.tournaments.update_many(
                {"active": True},
                {"$set": {"active": False}}
            )

        result = db.tournaments.update_one(
            {"tournamentName": tournament_name},
            {"$set": data}
        )

        if result.modified_count == 0:
            return jsonify({"status": "error", "message": "Tournament not found"}), 404

        return jsonify({"status": "success", "message": "Tournament updated"}), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments/deactivate-all", methods=["PATCH"])
def deactivate_all_tournaments():
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        result = db.tournaments.update_many(
            {"active": True},
            {"$set": {"active": False}}
        )

        return jsonify({
            "status": "success",
            "message": f"Deactivated {result.modified_count} tournaments"
        }), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments/active", methods=["GET"])
def get_active_tournament():
    try:
        active_tournaments = list(db.tournaments.find(
            {"active": True},
            {"_id": 0}
        ))

        if len(active_tournaments) == 0:
            return jsonify({
                "status": "error",
                "message": "No active tournament found"
            }), 200

        if len(active_tournaments) > 1:
            return jsonify({
                "status": "error",
                "message": "Multiple active tournaments found",
                "count": len(active_tournaments)
            }), 409

        return jsonify({
            "status": "success",
            "data": active_tournaments[0]
        }), 200

    except PyMongoError as e:
        return jsonify({
            "status": "error",
            "message": "Database error"
        }), 500


@app.route("/tournaments/<string:tournament_name>/games", methods=["GET"])
def get_games_by_tournament(tournament_name):
    try:
        games = list(db["tournament_games"].find(
            {"tournamentName": tournament_name},
            {"created_at": 0, "tournamentName": 0, "userName1": 0, "userName2": 0}
        ).sort("created_at", 1))

        for game in games:
            game['_id'] = str(game['_id'])

        return jsonify({"status": "success", "data": games}), 200
    except PyMongoError:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments/games", methods=["POST"])
def add_tournament_game():
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        tournament_name = data.get("tournament", {}).get("tournamentName")
        player1 = data.get("players", {}).get("player1", {})
        player2 = data.get("players", {}).get("player2", {})

        user_name1 = player1.get("username")
        user_name2 = player2.get("username")

        if not (tournament_name and user_name1 and user_name2):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        if user_name1 == "-":
            data["player2Score"] = 2
        elif user_name2 == "-":
            data["player1Score"] = 2

        query = {
            "tournamentName": tournament_name,
            "userName1": user_name1,
            "userName2": user_name2
        }

        existing_game = db["tournament_games"].find_one(
            query, {"created_at": 1})

        if not existing_game:
            data["created_at"] = datetime.utcnow()
        elif "created_at" not in data:
            data["created_at"] = existing_game.get("created_at")

        db["tournament_games"].update_one(query, {"$set": data}, upsert=True)

        return jsonify({"status": "success", "message": "Game saved"}), 201

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments/games/<string:game_id>", methods=["PATCH"])
def update_tournament_game(game_id):
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        current_game = db["tournament_games"].find_one(
            {"_id": ObjectId(game_id)})
        if not current_game:
            return jsonify({"status": "error", "message": "Game not found"}), 404

        players = data.get("players", {})
        player1 = players.get("player1", current_game.get(
            "players", {}).get("player1", {}))
        player2 = players.get("player2", current_game.get(
            "players", {}).get("player2", {}))

        user_name1 = player1.get("username")
        user_name2 = player2.get("username")

        if user_name1 == "-":
            data["player2Score"] = 2
        elif user_name2 == "-":
            data["player1Score"] = 2

        result = db["tournament_games"].update_one(
            {"_id": ObjectId(game_id)},
            {"$set": data}
        )

        if result.modified_count == 0:
            return jsonify({"status": "error", "message": "Game not found or no changes made"}), 404

        return jsonify({"status": "success", "message": "Game updated"}), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/tournaments/games/<string:game_id>", methods=["DELETE"])
def delete_tournament_game(game_id):
    try:
        if "username" not in session:
            return jsonify({
                "status": "error",
                "message": "Unauthorized - not logged in"
            }), 401

        user = db.users.find_one({"username": session["username"]})
        if not user or user.get("status") != "admin":
            return jsonify({
                "status": "error",
                "message": "Forbidden - admin privileges required"
            }), 403

        result = db["tournament_games"].delete_one({"_id": ObjectId(game_id)})

        if result.deleted_count == 0:
            return jsonify({"status": "error", "message": "Game not found"}), 404

        return jsonify({"status": "success", "message": "Game deleted"}), 200

    except PyMongoError as e:
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": "Invalid game ID"}), 400


@app.route("/tournaments/games/active", methods=["GET"])
def get_active_tournament_games():
    try:
        active_tournament = db["tournaments"].find_one(
            {"active": True}, {"tournamentName": 1, "_id": 0})

        if not active_tournament:
            return jsonify({"status": "error", "message": "No active tournament found"}), 404

        games = list(db["tournament_games"].find(
            {"tournamentName": active_tournament["tournamentName"]},
            {"_id": 0, "created_at": 0, "tournamentName": 0,
                "userName1": 0, "userName2": 0}
        ).sort("created_at", 1))

        return jsonify({
            "status": "success",
            "tournamentName": active_tournament["tournamentName"],
            "data": games
        }), 200

    except PyMongoError:
        return jsonify({"status": "error", "message": "Database error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
