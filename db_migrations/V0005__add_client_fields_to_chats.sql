-- Добавляем недостающие поля в таблицу chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Заполняем данные из связанной таблицы clients для существующих чатов
UPDATE chats c
SET 
    client_name = cl.name,
    phone = cl.phone,
    email = cl.email,
    ip_address = cl.ip_address
FROM clients cl
WHERE c.client_id = cl.id AND c.client_name IS NULL;
