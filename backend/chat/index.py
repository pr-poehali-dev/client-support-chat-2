import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления чатами с таймерами и автораспределением
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            if action == 'list':
                operator_name = event.get('queryStringParameters', {}).get('operatorName')
                
                if operator_name:
                    cur.execute('''
                        SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                               c.assigned_at, c.deadline, c.extension_requested, c.extension_deadline,
                               cl.name as client_name, cl.email, cl.phone, cl.ip_address,
                               (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
                        FROM chats c
                        JOIN clients cl ON c.client_id = cl.id
                        WHERE c.assigned_operator = %s OR c.status = 'waiting'
                        ORDER BY c.updated_at DESC
                    ''', (operator_name,))
                else:
                    cur.execute('''
                        SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                               c.assigned_at, c.deadline, c.extension_requested, c.extension_deadline,
                               cl.name as client_name, cl.email, cl.phone, cl.ip_address,
                               (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
                        FROM chats c
                        JOIN clients cl ON c.client_id = cl.id
                        ORDER BY c.updated_at DESC
                    ''')
                
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'status': chat['status'],
                        'assignedOperator': chat['assigned_operator'],
                        'clientName': chat['client_name'],
                        'email': chat['email'],
                        'phone': chat['phone'],
                        'ipAddress': chat['ip_address'],
                        'messageCount': chat['message_count'],
                        'createdAt': chat['created_at'].isoformat() if chat['created_at'] else None,
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None,
                        'assignedAt': chat['assigned_at'].isoformat() if chat['assigned_at'] else None,
                        'deadline': chat['deadline'].isoformat() if chat['deadline'] else None,
                        'extensionRequested': chat['extension_requested'],
                        'extensionDeadline': chat['extension_deadline'].isoformat() if chat['extension_deadline'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
            
            elif action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chatId')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId required'})
                    }
                
                cur.execute('''
                    SELECT id, sender_type, sender_name, message_text, created_at
                    FROM messages
                    WHERE chat_id = %s
                    ORDER BY created_at ASC
                ''', (chat_id,))
                messages = cur.fetchall()
                
                result = []
                for msg in messages:
                    result.append({
                        'id': msg['id'],
                        'senderType': msg['sender_type'],
                        'senderName': msg['sender_name'],
                        'text': msg['message_text'],
                        'createdAt': msg['created_at'].isoformat() if msg['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'messages': result})
                }
            
            elif action == 'clients':
                cur.execute('''
                    SELECT id, ip_address, name, email, phone, created_at, last_seen
                    FROM clients
                    ORDER BY last_seen DESC
                ''')
                clients = cur.fetchall()
                
                result = []
                for client in clients:
                    result.append({
                        'id': client['id'],
                        'ipAddress': client['ip_address'],
                        'name': client['name'],
                        'email': client['email'],
                        'phone': client['phone'],
                        'createdAt': client['created_at'].isoformat() if client['created_at'] else None,
                        'lastSeen': client['last_seen'].isoformat() if client['last_seen'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'clients': result})
                }
            
            elif action == 'knowledge':
                cur.execute('''
                    SELECT id, title, category, content, views, created_at, updated_at, author
                    FROM knowledge_base
                    ORDER BY created_at DESC
                ''')
                articles = cur.fetchall()
                
                result = []
                for article in articles:
                    result.append({
                        'id': article['id'],
                        'title': article['title'],
                        'category': article['category'],
                        'content': article['content'],
                        'views': article['views'],
                        'createdAt': article['created_at'].isoformat() if article['created_at'] else None,
                        'updatedAt': article['updated_at'].isoformat() if article['updated_at'] else None,
                        'author': article['author']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'articles': result})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'startChat':
                ip_address = body_data.get('ipAddress')
                client_name = body_data.get('name')
                email = body_data.get('email')
                phone = body_data.get('phone')
                
                if not ip_address:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'ipAddress required'})
                    }
                
                cur.execute('''
                    INSERT INTO clients (ip_address, name, email, phone, last_seen)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (ip_address) 
                    DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, 
                                  phone = EXCLUDED.phone, last_seen = CURRENT_TIMESTAMP
                    RETURNING id
                ''', (ip_address, client_name, email, phone))
                client_id = cur.fetchone()['id']
                
                cur.execute('''
                    SELECT id FROM chats 
                    WHERE client_id = %s AND status IN ('waiting', 'active')
                    ORDER BY created_at DESC LIMIT 1
                ''', (client_id,))
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    chat_id = existing_chat['id']
                else:
                    cur.execute('''
                        INSERT INTO chats (client_id, status)
                        VALUES (%s, 'waiting')
                        RETURNING id
                    ''', (client_id,))
                    chat_id = cur.fetchone()['id']
                    
                    assign_chat_to_operator(cur)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chatId': chat_id, 'clientId': client_id})
                }
            
            elif action == 'sendMessage':
                chat_id = body_data.get('chatId')
                sender_type = body_data.get('senderType')
                sender_name = body_data.get('senderName')
                message_text = body_data.get('message')
                
                if not all([chat_id, sender_type, message_text]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId, senderType, message required'})
                    }
                
                cur.execute('''
                    INSERT INTO messages (chat_id, sender_type, sender_name, message_text)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, created_at
                ''', (chat_id, sender_type, sender_name, message_text))
                result = cur.fetchone()
                
                cur.execute('''
                    UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (chat_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'messageId': result['id'],
                        'createdAt': result['created_at'].isoformat()
                    })
                }
            
            elif action == 'updateOperatorStatus':
                operator_name = body_data.get('operatorName')
                status = body_data.get('status')
                
                if not operator_name or not status:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'operatorName and status required'})
                    }
                
                cur.execute('''
                    INSERT INTO operator_status (operator_name, status, updated_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (operator_name)
                    DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
                ''', (operator_name, status))
                
                if status != 'online':
                    cur.execute('''
                        SELECT id FROM chats
                        WHERE assigned_operator = %s AND status = 'active'
                    ''', (operator_name,))
                    active_chats = cur.fetchall()
                    
                    for chat in active_chats:
                        reassign_chat(cur, chat['id'])
                
                conn.commit()
                
                if status == 'online':
                    assign_chat_to_operator(cur, operator_name)
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'createKnowledge':
                title = body_data.get('title')
                category = body_data.get('category')
                content = body_data.get('content')
                author = body_data.get('author')
                
                if not title or not content:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'title and content required'})
                    }
                
                cur.execute('''
                    INSERT INTO knowledge_base (title, category, content, author)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                ''', (title, category, content, author))
                
                article_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'articleId': article_id})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'updateStatus':
                chat_id = body_data.get('chatId')
                status = body_data.get('status')
                assigned_operator = body_data.get('assignedOperator')
                
                if not chat_id or not status:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId and status required'})
                    }
                
                if status == 'active' and assigned_operator:
                    deadline = datetime.now() + timedelta(minutes=15)
                    cur.execute('''
                        UPDATE chats 
                        SET status = %s, assigned_operator = %s, assigned_at = CURRENT_TIMESTAMP, 
                            deadline = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, assigned_operator, deadline, chat_id))
                    
                    cur.execute('''
                        UPDATE operator_status 
                        SET active_chats_count = active_chats_count + 1
                        WHERE operator_name = %s
                    ''', (assigned_operator,))
                elif status == 'closed':
                    cur.execute('''
                        SELECT assigned_operator FROM chats WHERE id = %s
                    ''', (chat_id,))
                    chat = cur.fetchone()
                    
                    cur.execute('''
                        UPDATE chats 
                        SET status = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, chat_id))
                    
                    if chat and chat['assigned_operator']:
                        cur.execute('''
                            UPDATE operator_status 
                            SET active_chats_count = GREATEST(active_chats_count - 1, 0)
                            WHERE operator_name = %s
                        ''', (chat['assigned_operator'],))
                        
                        assign_chat_to_operator(cur, chat['assigned_operator'])
                else:
                    cur.execute('''
                        UPDATE chats 
                        SET status = %s, assigned_operator = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, assigned_operator, chat_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'extendChat':
                chat_id = body_data.get('chatId')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId required'})
                    }
                
                new_deadline = datetime.now() + timedelta(minutes=15)
                cur.execute('''
                    UPDATE chats 
                    SET deadline = %s, extension_requested = FALSE, extension_deadline = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (new_deadline, chat_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'newDeadline': new_deadline.isoformat()})
                }
            
            elif action == 'updateKnowledge':
                article_id = body_data.get('articleId')
                title = body_data.get('title')
                category = body_data.get('category')
                content = body_data.get('content')
                
                if not article_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'articleId required'})
                    }
                
                cur.execute('''
                    UPDATE knowledge_base 
                    SET title = %s, category = %s, content = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (title, category, content, article_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
        
        check_expired_chats(cur)
        conn.commit()
        
        return {
            'statusCode': 405,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()

def assign_chat_to_operator(cur, preferred_operator: Optional[str] = None):
    if preferred_operator:
        cur.execute('''
            SELECT active_chats_count FROM operator_status 
            WHERE operator_name = %s AND status = 'online'
        ''', (preferred_operator,))
        operator = cur.fetchone()
        
        if operator and operator['active_chats_count'] < 2:
            cur.execute('''
                SELECT id FROM chats 
                WHERE status = 'waiting' 
                ORDER BY created_at ASC LIMIT 1
            ''')
            waiting_chat = cur.fetchone()
            
            if waiting_chat:
                deadline = datetime.now() + timedelta(minutes=15)
                cur.execute('''
                    UPDATE chats 
                    SET status = 'active', assigned_operator = %s, 
                        assigned_at = CURRENT_TIMESTAMP, deadline = %s
                    WHERE id = %s
                ''', (preferred_operator, deadline, waiting_chat['id']))
                
                cur.execute('''
                    UPDATE operator_status 
                    SET active_chats_count = active_chats_count + 1
                    WHERE operator_name = %s
                ''', (preferred_operator,))
    else:
        cur.execute('''
            SELECT operator_name, active_chats_count 
            FROM operator_status 
            WHERE status = 'online' AND active_chats_count < 2
            ORDER BY active_chats_count ASC LIMIT 1
        ''')
        operator = cur.fetchone()
        
        if operator:
            cur.execute('''
                SELECT id FROM chats 
                WHERE status = 'waiting' 
                ORDER BY created_at ASC LIMIT 1
            ''')
            waiting_chat = cur.fetchone()
            
            if waiting_chat:
                deadline = datetime.now() + timedelta(minutes=15)
                cur.execute('''
                    UPDATE chats 
                    SET status = 'active', assigned_operator = %s, 
                        assigned_at = CURRENT_TIMESTAMP, deadline = %s
                    WHERE id = %s
                ''', (operator['operator_name'], deadline, waiting_chat['id']))
                
                cur.execute('''
                    UPDATE operator_status 
                    SET active_chats_count = active_chats_count + 1
                    WHERE operator_name = %s
                ''', (operator['operator_name'],))

def reassign_chat(cur, chat_id: int):
    cur.execute('''
        SELECT assigned_operator FROM chats WHERE id = %s
    ''', (chat_id,))
    chat = cur.fetchone()
    
    if chat and chat['assigned_operator']:
        cur.execute('''
            UPDATE operator_status 
            SET active_chats_count = GREATEST(active_chats_count - 1, 0)
            WHERE operator_name = %s
        ''', (chat['assigned_operator'],))
    
    cur.execute('''
        UPDATE chats 
        SET status = 'waiting', assigned_operator = NULL, 
            assigned_at = NULL, deadline = NULL, 
            extension_requested = FALSE, extension_deadline = NULL
        WHERE id = %s
    ''', (chat_id,))
    
    assign_chat_to_operator(cur)

def check_expired_chats(cur):
    now = datetime.now()
    
    cur.execute('''
        SELECT id, deadline, extension_requested, extension_deadline 
        FROM chats 
        WHERE status = 'active' AND deadline IS NOT NULL
    ''')
    active_chats = cur.fetchall()
    
    for chat in active_chats:
        if chat['extension_requested'] and chat['extension_deadline']:
            if now > chat['extension_deadline']:
                reassign_chat(cur, chat['id'])
        elif now > chat['deadline'] and not chat['extension_requested']:
            extension_deadline = now + timedelta(seconds=15)
            cur.execute('''
                UPDATE chats 
                SET extension_requested = TRUE, extension_deadline = %s
                WHERE id = %s
            ''', (extension_deadline, chat['id']))
