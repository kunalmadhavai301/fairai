import re
from typing import Dict, Any, List

# PII Regex Patterns
SSN_PATTERN = r'\b\d{3}-\d{2}-\d{4}\b'
CREDIT_CARD_PATTERN = r'\b(?:\d[ -]*?){13,16}\b'
EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
PHONE_PATTERN = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
API_KEY_PATTERN = r'\b(?:sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16})\b'

def scan_sensitive_pii(text: str) -> Dict[str, Any]:
    """
    Scans text for sensitive information (SSN, credit cards, emails, phone numbers, API keys).
    Returns findings count, detected types, and masked text version.
    """
    findings = []
    masked_text = text

    # SSNs
    ssns = re.findall(SSN_PATTERN, text)
    if ssns:
        findings.append({"type": "Social Security Number (SSN)", "count": len(ssns), "matches": ssns})
        masked_text = re.sub(SSN_PATTERN, '[REDACTED SSN]', masked_text)

    # Credit Cards
    cards = re.findall(CREDIT_CARD_PATTERN, text)
    if cards:
        findings.append({"type": "Credit Card Number", "count": len(cards), "matches": cards})
        masked_text = re.sub(CREDIT_CARD_PATTERN, '[REDACTED CREDIT CARD]', masked_text)

    # API Keys
    keys = re.findall(API_KEY_PATTERN, text)
    if keys:
        findings.append({"type": "Secret API Key", "count": len(keys), "matches": keys})
        masked_text = re.sub(API_KEY_PATTERN, '[REDACTED API KEY]', masked_text)

    # Emails
    emails = re.findall(EMAIL_PATTERN, text)
    if emails:
        findings.append({"type": "Email Address", "count": len(emails), "matches": emails})

    # Phones
    phones = re.findall(PHONE_PATTERN, text)
    if phones:
        findings.append({"type": "Phone Number", "count": len(phones), "matches": phones})

    total_sensitive_items = sum([item["count"] for item in findings])

    return {
        "total_pii_found": total_sensitive_items,
        "findings": findings,
        "masked_text": masked_text,
        "risk_rating": "Critical" if total_sensitive_items > 5 else ("Medium" if total_sensitive_items > 0 else "Clean")
    }
