import hashlib
import hmac
import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

# Security Config
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-production-key-change-in-env-928374928374")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 Hours

def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256 password hashing with random salt."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against PBKDF2 hash (supports both pbkdf2:sha256:iterations$salt$hash and salt:hash formats)."""
    try:
        if not hashed_password or not plain_password:
            return False

        if hashed_password.startswith("pbkdf2:"):
            # Format: pbkdf2:<method>:<iterations>$<salt>$<hash>
            parts = hashed_password.split(':')
            method = parts[1]
            iter_salt_hash = parts[2].split('$')
            iterations = int(iter_salt_hash[0])
            salt = iter_salt_hash[1]
            key_hex = iter_salt_hash[2]
            
            test_key = hashlib.pbkdf2_hmac(
                method,
                plain_password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations
            )
            return hmac.compare_digest(test_key.hex(), key_hex)
        elif ':' in hashed_password:
            # Format: salt:hash (100000 iterations)
            salt, key_hex = hashed_password.split(':', 1)
            test_key = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt.encode('utf-8'),
                100000
            )
            return hmac.compare_digest(test_key.hex(), key_hex)
        return False
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None