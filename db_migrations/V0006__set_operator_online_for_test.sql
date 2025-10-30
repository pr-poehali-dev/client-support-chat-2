-- Устанавливаем оператору статус online для теста автораспределения
UPDATE employees SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE username = 'operator1';
