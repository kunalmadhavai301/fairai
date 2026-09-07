import re
from typing import Dict

def parse_user_agent(user_agent: str) -> Dict[str, str]:
    """
    Parses User-Agent header to identify Browser, Operating System, and Device Type.
    """
    if not user_agent:
        return {"browser": "Unknown", "os": "Unknown", "device": "Desktop"}

    ua = user_agent.lower()

    # Browser Detection
    browser = "Unknown Browser"
    if "edg" in ua or "edge" in ua:
        browser = "Microsoft Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Google Chrome"
    elif "firefox" in ua:
        browser = "Mozilla Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Apple Safari"
    elif "opera" in ua or "opr" in ua:
        browser = "Opera"

    # OS Detection
    os_name = "Unknown OS"
    if "windows nt 10" in ua or "windows nt 11" in ua:
        os_name = "Windows 10/11"
    elif "windows" in ua:
        os_name = "Windows"
    elif "mac os x" in ua or "macintosh" in ua:
        os_name = "macOS"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "linux" in ua:
        os_name = "Linux"

    # Device Type
    device_type = "Desktop"
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        device_type = "Mobile"
    elif "ipad" in ua or "tablet" in ua:
        device_type = "Tablet"

    return {
        "browser": browser,
        "os": os_name,
        "device": device_type
    }
