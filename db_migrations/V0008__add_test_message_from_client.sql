-- Добавляем тестовое сообщение от клиента
INSERT INTO messages (chat_id, sender_type, sender_name, message_text, created_at)
VALUES 
    (1, 'client', 'Тестовый клиент', 'Здравствуйте! У меня вопрос по заказу.', CURRENT_TIMESTAMP);
