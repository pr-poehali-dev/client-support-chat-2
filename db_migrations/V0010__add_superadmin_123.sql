-- Создание супер-админа с логином 123 и паролем 803254
INSERT INTO employees (username, password_hash, name, role, status) 
SELECT '123', '803254', 'Супер Администратор', 'admin', 'online'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE username = '123');