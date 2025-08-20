import os
import bcrypt
import json
from pathlib import Path
from pymongo import MongoClient
from pymongo.errors import PyMongoError, OperationFailure
from urllib.parse import quote_plus
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MongoDBManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.connected = False

    def get_mongo_uri(self):
        """Формирует URI для подключения к MongoDB"""
        username = quote_plus(os.getenv('MONGO_USER', 'root'))
        password = quote_plus(os.getenv('MONGO_PASS', 'example'))
        host = os.getenv('MONGO_HOST', 'localhost')
        port = os.getenv('MONGO_PORT', '27017')
        auth_db = os.getenv('MONGO_AUTH_DB', 'admin')

        return f"mongodb://{username}:{password}@{host}:{port}/{auth_db}?authSource=admin&retryWrites=true&w=majority"

    def connect(self):
        """Устанавливает соединение с MongoDB"""
        try:
            self.client = MongoClient(
                self.get_mongo_uri(),
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=3000,
                connectTimeoutMS=3000
            )
            # Проверка подключения
            self.client.server_info()
            self.connected = True
            logger.info("Successfully connected to MongoDB")
            return True
        except PyMongoError as e:
            logger.error(f"Connection error: {e}")
            return False

    def get_database(self, db_name=None):
        """Возвращает объект базы данных"""
        if not self.connected:
            if not self.connect():
                raise RuntimeError("Cannot connect to MongoDB")

        db_name = db_name or os.getenv('MONGO_DB', 'mydatabase')
        self.db = self.client[db_name]
        return self.db

    def initialize_collections(self):
        """Инициализирует коллекции и индексы"""
        if not self.connected:
            self.get_database()

        collections = {
            "users": [
                ("username", {"unique": True}),
                ("display_name", {})
            ],
            "characters": [
                ("name", {"unique": True}),
            ],
            "weapons": [
                ("name", {"unique": True}),
            ],
            "user_characters": [
                ("user_id", {}),
                ("character_id", {}),
                ([("user_id", 1), ("character_id", 1)], {
                 "unique": True})  # Составной уникальный индекс
            ],
            "user_weapons": [
                ("user_id", {}),
                ("weapon_id", {}),
                # Составной уникальный индекс
                ([("user_id", 1), ("weapon_id", 1)], {"unique": True})
            ],
            # "user_screenshots": [
            #     ("user_id", {}),
            #     ("filename", {"unique": True})
            # ],
            "tournaments": [
                ("tournamentName", {"unique": True}),
                ("active", {})
            ],
            "tournament_games": [
                ([("tournamentName", 1), ("userName1", 1),
                 ("userName2", 1)]),
                ("created_at", {})
            ]
        }

        for col_name, indexes in collections.items():
            try:
                # Создаем коллекции
                if col_name not in self.db.list_collection_names():
                    self.db.command("create", col_name)
                    logger.info(f"Created collection: {col_name}")

                # Создаем индексы
                col = self.db[col_name]
                for index_def in indexes:
                    if isinstance(index_def, tuple):
                        if isinstance(index_def[0], list):
                            # Составной индекс
                            fields, options = index_def
                            col.create_index(fields, **options)
                            logger.info(
                                f"Created compound index on {fields} for {col_name}")
                        else:
                            # Обычный индекс
                            field, options = index_def
                            col.create_index([(field, 1)], **options)
                            logger.info(
                                f"Created index on {field} for {col_name}")

            except OperationFailure as e:
                if "already exists" not in str(e):
                    logger.warning(
                        f"Could not create collection/index for {col_name}: {e}")

    def load_data_from_file(self, filename):
        """Загружает данные из JSON файла"""
        try:
            file_path = Path(__file__).parent / filename
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return None

    def initialize_collection_data(self, collection_name, filename, key_fields=None, transform_func=None):
        """
        Инициализирует данные в коллекции из файла
        :param collection_name: Имя коллекции
        :param filename: Имя файла с данными
        :param key_fields: Строка или список полей для проверки уникальности
        :param transform_func: Функция для преобразования данных перед вставкой
        """
        if not self.connected:
            self.get_database()

        try:
            data = self.load_data_from_file(filename)
            if not data:
                logger.warning(f"No data found in {filename}")
                return False

            collection = self.db[collection_name]
            upserted_count = 0

            for item in data:
                try:
                    if transform_func:
                        item = transform_func(item)

                    # Создаем запрос для поиска существующей записи
                    if isinstance(key_fields, str):
                        query = {key_fields: item[key_fields]}
                    elif isinstance(key_fields, list):
                        query = {field: item[field] for field in key_fields}
                    else:
                        # Если key_fields не указан, используем весь документ для сравнения
                        query = item

                    # Вставка или обновление (upsert)
                    result = collection.update_one(
                        query,
                        {"$set": item},
                        upsert=True
                    )

                    if result.upserted_id is not None:
                        upserted_count += 1
                        logger.debug(f"Inserted new document: {item}")
                    elif result.modified_count > 0:
                        upserted_count += 1
                        logger.debug(f"Updated existing document: {item}")

                except KeyError as e:
                    logger.error(f"Missing key in item: {e}, item: {item}")
                    continue
                except Exception as e:
                    logger.error(f"Error processing item {item}: {e}")
                    continue

            logger.info(
                f"Upserted {upserted_count} items into {collection_name} from {filename}")
            return True

        except PyMongoError as e:
            logger.error(f"Failed to initialize {collection_name}: {e}")
            return False
        except Exception as e:
            logger.error(
                f"Unexpected error in initialize_collection_data: {e}")
            return False


def hash_password(item):
    """Преобразует пароль в хеш для пользователей"""
    if 'password' in item:
        item['password'] = bcrypt.hashpw(
            item['password'].encode(), bcrypt.gensalt()).decode()
    return item


def main():
    try:
        logger.info("Starting MongoDB initialization...")

        mongo_manager = MongoDBManager()
        db = mongo_manager.get_database()

        if not mongo_manager.connected:
            raise RuntimeError("Failed to connect to MongoDB")

        mongo_manager.initialize_collections()

        # Инициализация данных
        mongo_manager.initialize_collection_data(
            'users', 'users.json', 'username', hash_password
        )
        mongo_manager.initialize_collection_data(
            'weapons', 'weapons.json'
        )
        mongo_manager.initialize_collection_data(
            'characters', 'characters.json'
        )
        # mongo_manager.initialize_collection_data(
        #     'tournaments', 'tournaments.json', 'tournamentName'
        # )

        # mongo_manager.initialize_collection_data(
        #     'tournament_games',
        #     'tournament_games.json',
        #     key_fields=['tournamentName', 'userName1', 'userName2']
        # )

        logger.info("Database initialization completed successfully")
        return 0

    except Exception as e:
        logger.error(f"Initialization failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit(main())
