import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления чатами клиентов с операторами
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
                cur.execute('''
                    SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
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
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None
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
        
        return {
            'statusCode': 405,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
