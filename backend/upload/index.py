"""Загрузка фото в S3 — принимает base64, возвращает CDN-ссылку"""
import json
import os
import base64
import uuid
import boto3

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    data_url = body.get("image", "")

    if not data_url or "," not in data_url:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Нет изображения"})}

    header, b64 = data_url.split(",", 1)
    ext = "jpg"
    if "png" in header:
        ext = "png"
    elif "gif" in header:
        ext = "gif"
    elif "webp" in header:
        ext = "webp"

    content_type = f"image/{ext}"
    file_bytes = base64.b64decode(b64)

    if len(file_bytes) > 8 * 1024 * 1024:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Файл слишком большой (макс 8 МБ)"})}

    key = f"chat/{uuid.uuid4()}.{ext}"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=file_bytes, ContentType=content_type)

    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"url": cdn_url})}
