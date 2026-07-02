"""Личные сообщения — список чатов, отправка и получение сообщений"""
import json
import os
import psycopg2

SCHEMA = "t_p1151301_moonlight_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def esc(s):
    return s.replace("'", "''")

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        action = params.get("action", "chats")
        my_nick = esc(params.get("nick", "").strip()[:50])
        if not my_nick:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи ник"})}

        conn = get_conn()
        cur = conn.cursor()

        if action == "messages":
            other_nick = esc(params.get("other", "").strip()[:50])
            if not other_nick:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи собеседника"})}
            cur.execute(
                f"SELECT id, sender, recipient, message, image_url, created_at FROM {SCHEMA}.dm_messages "
                f"WHERE (sender='{my_nick}' AND recipient='{other_nick}') OR (sender='{other_nick}' AND recipient='{my_nick}') "
                f"ORDER BY created_at ASC LIMIT 100"
            )
            rows = cur.fetchall()
            conn.close()
            msgs = [{"id": r[0], "sender": r[1], "recipient": r[2], "message": r[3], "image_url": r[4], "created_at": r[5].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": msgs})}

        # list of chats (unique interlocutors)
        cur.execute(
            f"SELECT DISTINCT CASE WHEN sender='{my_nick}' THEN recipient ELSE sender END as other_nick, "
            f"MAX(created_at) as last_time "
            f"FROM {SCHEMA}.dm_messages WHERE sender='{my_nick}' OR recipient='{my_nick}' "
            f"GROUP BY other_nick ORDER BY last_time DESC"
        )
        rows = cur.fetchall()
        conn.close()
        chats = [{"nick": r[0], "last_time": r[1].isoformat()} for r in rows]
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"chats": chats})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        sender = esc((body.get("sender") or "").strip()[:50])
        recipient = esc((body.get("recipient") or "").strip()[:50])
        message = esc((body.get("message") or "").strip()[:1000])
        image_url = esc((body.get("image_url") or "").strip()[:500])
        if not sender or not recipient or (not message and not image_url):
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполни все поля"})}
        msg_val = message or "📷"
        img_val = f"'{image_url}'" if image_url else "NULL"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.dm_messages (sender, recipient, message, image_url) VALUES ('{sender}', '{recipient}', '{msg_val}', {img_val}) RETURNING id, created_at")
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": row[0], "created_at": row[1].isoformat()})}

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}