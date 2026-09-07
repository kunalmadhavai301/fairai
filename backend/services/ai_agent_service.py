import os
import json
import re
import urllib.request
import pandas as pd
from typing import Dict, Any, Optional
from openai import OpenAI
from backend.config import OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, PROCESSED_DIR, REPORTS_DIR
from backend.services.file_service import extract_file_content, save_edited_file_content
from backend.services.cleaning_service import clean_tabular_data
from backend.services.analytics_service import analyze_dataset
from backend.services.conversion_service import convert_file
from backend.services.report_service import generate_report
from backend.services.pptx_service import generate_powerpoint_presentation
from backend.services.pdf_service import delete_pdf_page, extract_pdf_tables
from backend.services.pii_service import scan_sensitive_pii
from backend.services.rag_service import retrieve_rag_context
from backend.services.security_service import protect_pdf_file, unlock_pdf_file

CYBER_INCIDENT_KEYWORDS = [
    "cyber", "security", "soc", "threat", "hunting", "malware", "phishing", "osint",
    "mitre", "att&ck", "nist", "owasp", "cve", "cwe", "forensics", "incident", "response",
    "network", "penetration", "linux", "windows", "log"
]

GREETING_PATTERNS = [
    r'^(hi|hello|hey|greetings|hola|namaste|heyy|heya|good\s+morning|good\s+afternoon|good\s+evening|what\'?s\s+up)\b',
    r'^(who\s+are\s+you|what\s+can\s+you\s+do|help|help\s+me|how\s+are\s+you)\b'
]

SYSTEM_PLATFORM_PERSONA = """You are SurveySnap AI, an advanced Autonomous AI Agent & Real-Time Document Intelligence Assistant created and developed by Kunal Madhavai.

Your Primary Capabilities & Direct Navigation Instructions:
1. File Format Conversions (PDF to Word, XLSX to PDF, CSV to JSON, HTML):
   - Instruct the user to navigate to the 'Convert Section' (#convert tab) on the top menu bar, select their uploaded document, pick their desired target format (PDF, DOCX, XLSX, HTML, Markdown), and click 'Convert File'.

2. Live PDF & Document Editing:
   - Instruct the user to open the 'Dual Workspace Section' (#workspace tab).
   - They can execute live commands right here in the chat:
     * 'Delete page X' (e.g. 'Delete page 1') to remove pages live.
     * 'Replace Company A with Company B' to replace text across the document.
     * Click 'Start Editing Live' to edit text directly.

3. Excel & Spreadsheet Editing / Automated Data Cleaning:
   - Go to Dual Workspace (#workspace tab) for interactive spreadsheet grid editing, or type 'Clean tabular data' in chat to remove duplicate rows, impute missing values, and handle outliers.

4. PowerPoint Presentation Generation:
   - Instruct the user to type 'Create PowerPoint presentation' in the chat to automatically convert any document into a formatted .pptx slide deck.

5. Real-Time Data Analytics & Charts:
   - Instruct the user to scroll to the 'Analytics Section' (#analytics tab) to view dynamic Bar, Pie, and Line charts generated live from their database records.

6. AES-256 Security Encryption & File Protection:
   - Instruct the user to scroll to the 'Security Section' (#security tab), enter a password, and click 'Lock File with AES-256'.

7. Out-of-the-Box & General Knowledge Queries:
   - For general knowledge, coding, science, history, cyber security, or out-of-the-box questions, provide intelligent, detailed, and accurate answers using your LLM intelligence while maintaining your identity as SurveySnap AI!
"""

def call_realtime_llm_api(system_prompt: str, user_prompt: str) -> Optional[str]:
    """
    Executes real-time AI completion using Groq Llama, OpenAI, or Google Gemini API Keys.
    """
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    openai_key = os.getenv("OPENAI_API_KEY", OPENAI_API_KEY)
    gemini_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)

    full_system_prompt = f"{SYSTEM_PLATFORM_PERSONA}\n\n{system_prompt}"

    # 1. Groq High-Speed Llama API (gsk_...) - Verified Active
    if groq_key and len(groq_key) > 15:
        try:
            client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key)
            comp = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return comp.choices[0].message.content
        except Exception:
            pass

    # 2. OpenAI API (sk-...)
    if openai_key and (openai_key.startswith("sk-") or len(openai_key) > 20):
        try:
            client = OpenAI(api_key=openai_key)
            comp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return comp.choices[0].message.content
        except Exception:
            pass

    # 3. Google Gemini API
    if gemini_key and len(gemini_key) > 15:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [{"text": f"{full_system_prompt}\n\n{user_prompt}"}]
                    }
                ]
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            pass

    return None

# ─── HELPER FUNCTIONS FOR SMART TEXT EDIT DETECTION ───

# Patterns that indicate a text edit/replace command
_EDIT_VERBS = ["replace", "change", "rename", "update", "modify", "edit", "set", "alter", "switch", "swap"]
_EDIT_PREPOSITIONS = ["with", "to", "into", "as"]

def _is_text_edit_command(msg_lower: str) -> bool:
    """Detect if the user message is a text edit command (change X to Y, replace X with Y, etc.)"""
    # Direct pattern: verb ... preposition
    for verb in _EDIT_VERBS:
        if verb in msg_lower:
            for prep in _EDIT_PREPOSITIONS:
                if prep in msg_lower:
                    return True
    # "from X to Y" pattern
    if "from" in msg_lower and " to " in msg_lower:
        return True
    return False

def _extract_replace_pair(original_msg: str, msg_lower: str):
    """Extract (target_text, replacement_text) from various natural language patterns.
    Uses original case message for replacement to preserve capitalization."""
    
    # Pattern 1: "replace X with Y"
    match = re.search(r'replace\s+[\'"]?(.+?)[\'"]?\s+with\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 2: "change X to Y" / "change the title X to Y"
    match = re.search(r'change\s+(?:the\s+)?(?:title\s+|heading\s+|name\s+|text\s+)?[\'"]?(.+?)[\'"]?\s+to\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 3: "rename X to Y"
    match = re.search(r'rename\s+[\'"]?(.+?)[\'"]?\s+to\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 4: "update X to Y" / "modify X to Y"
    match = re.search(r'(?:update|modify|edit|alter)\s+[\'"]?(.+?)[\'"]?\s+(?:to|with|into|as)\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 5: "change the title from X to Y"
    match = re.search(r'(?:change|update|modify|set|switch|swap)\s+(?:the\s+)?(?:\w+\s+)?from\s+[\'"]?(.+?)[\'"]?\s+to\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 6: "replace X by Y"
    match = re.search(r'replace\s+[\'"]?(.+?)[\'"]?\s+by\s+[\'"]?(.+?)[\'"]?\s*$', original_msg, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Pattern 7: Generic verb + "X" + preposition + "Y"
    for verb in _EDIT_VERBS:
        for prep in _EDIT_PREPOSITIONS:
            pattern = rf'{verb}\s+[\'"]?(.+?)[\'"]?\s+{prep}\s+[\'"]?(.+?)[\'"]?\s*$'
            match = re.search(pattern, original_msg, re.IGNORECASE)
            if match:
                return match.group(1).strip(), match.group(2).strip()
    
    return None, None

def _find_best_match(doc_text: str, target: str) -> Optional[str]:
    """Find the exact text in the document that matches the target, case-insensitive.
    Returns the actual text from the document (preserving its original case) or None."""
    # Exact match first
    if target in doc_text:
        return target
    
    # Case-insensitive match
    idx = doc_text.lower().find(target.lower())
    if idx != -1:
        return doc_text[idx:idx + len(target)]
    
    # Try matching with flexible whitespace (collapse multiple spaces)
    normalized_target = re.sub(r'\s+', r'\\s+', re.escape(target))
    match = re.search(normalized_target, doc_text, re.IGNORECASE)
    if match:
        return match.group(0)
    
    return None

def _detect_edit_intent_via_llm(user_message: str, doc_text: str, file_path: str, file_type: str) -> Optional[Dict]:
    """Use LLM to detect if user wants to edit the document and extract old/new text.
    Returns a dict with response_text, action_taken, modified_content if edit detected, else None."""
    
    sys_prompt = (
        "You are a document editing assistant. The user may want to edit the document.\n"
        "If the user's message is clearly asking to change/edit/modify/update text in the document, "
        "respond with EXACTLY this JSON format (no markdown, no code fences):\n"
        '{\"edit\": true, \"old_text\": \"exact text to find\", \"new_text\": \"replacement text\"}\n'
        "The old_text MUST be text that actually exists in the document.\n"
        "If the user is NOT asking to edit the document, respond with:\n"
        '{\"edit\": false}\n'
        "ONLY output the JSON, nothing else."
    )
    
    # Only send first 2000 chars of doc to LLM for context
    doc_preview = doc_text[:2000]
    user_prompt = f"Document content (first 2000 chars):\n{doc_preview}\n\nUser command: {user_message}"
    
    llm_reply = call_realtime_llm_api(sys_prompt, user_prompt)
    if not llm_reply:
        return None
    
    try:
        # Try to extract JSON from the LLM response
        clean = llm_reply.strip()
        # Remove code fences if present
        if clean.startswith("```"):
            clean = re.sub(r'^```\w*\n?', '', clean)
            clean = re.sub(r'\n?```$', '', clean)
        
        data = json.loads(clean)
        if data.get("edit") and data.get("old_text") and data.get("new_text"):
            old_text = data["old_text"]
            new_text = data["new_text"]
            
            found = _find_best_match(doc_text, old_text)
            if found:
                updated = doc_text.replace(found, new_text)
                save_edited_file_content(file_path, updated, file_type)
                
                return {
                    "response_text": (
                        f"### ✏️ Tool Executed: AI-Powered Text Edit!\n\n"
                        f"✅ **Successfully edited** your document:\n\n"
                        f"- **Old text:** `{found}`\n"
                        f"- **New text:** `{new_text}`\n\n"
                        f"📄 File: `{os.path.basename(file_path)}`\n\n"
                        f"*Your Dual Preview Workspace has been refreshed to show the changes.*"
                    ),
                    "action_taken": "replace_text",
                    "modified_content": updated
                }
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    
    return None

def process_agent_command(
    user_message: str,
    file_info: Optional[Dict[str, Any]] = None,
    db_session: Any = None,
    compare_file_info: Optional[Dict[str, Any]] = None,
    db: Any = None,
    file_id: Optional[int] = None,
    incident_mode: bool = False
) -> Dict[str, Any]:
    """
    Tool-Calling AI Agent: Decodes intent, executes exact file tools live, computes diffs/versions, and performs RAG or Incident Response Q&A.
    """
    db_conn = db or db_session
    msg_lower = user_message.lower().strip()

    if file_id and db_conn:
        from backend.models.file import UploadedFile
        file_rec = db_conn.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        if file_rec:
            file_info = {
                "file_path": file_rec.storage_location,
                "file_type": file_rec.file_type,
                "file_id": file_rec.id,
                "original_name": file_rec.original_filename
            }

    file_path = file_info.get("file_path") if file_info else None
    file_type = file_info.get("file_type", "") if file_info else ""
    file_id = file_info.get("file_id") if file_info else file_id

    action_taken = None
    modified_content = None
    action_result = {}
    response_text = ""

    # Check for general conversational greetings ("hi", "hello", "hey", "how may I help you")
    is_greeting = any(re.search(pat, msg_lower) for pat in GREETING_PATTERNS) or msg_lower in ["hi", "hello", "hey", "heyy", "hie", "hola", "namaste", "help"]

    if is_greeting:
        sys_prompt = "Greet the user warmly as SurveySnap AI assistant. Inform them how you can help them navigate the platform or answer questions."
        llm_reply = call_realtime_llm_api(sys_prompt, user_message)

        if llm_reply:
            response_text = f"### 👋 Hello & Welcome to SurveySnap AI!\n\n{llm_reply}"
        else:
            response_text = (
                "### 👋 Hello! Welcome to SurveySnap AI\n\n"
                "How may I help you today? What task would you like to perform?\n\n"
                "#### 🛠️ Here is how to navigate and use SurveySnap AI:\n"
                "- **🔄 Convert Files:** Go to **Convert Section** (#convert tab) to convert files to PDF, DOCX, XLSX, or HTML.\n"
                "- **📄 Edit Documents & Delete PDF Pages:** Open **Dual Workspace** (#workspace tab), or type `Delete page 1` / `Replace Company A with Company B`.\n"
                "- **📊 Edit & Clean Excel:** Open **Dual Workspace** for grid editing, or type `Clean tabular data`.\n"
                "- **🛡️ Protect Files:** Go to **Security Section** (#security tab) to encrypt with AES-256.\n"
                "- **📽️ PowerPoint Generation:** Type `Create PowerPoint presentation` in chat.\n"
                "- **📈 Real-Time Analytics:** View Bar, Pie, and Line charts in **Analytics Section** (#analytics tab).\n\n"
                "*Upload or select a file to get started, or type your question below!*"
            )
        
        return {
            "reply": response_text,
            "response": response_text,
            "action_taken": "greeting",
            "modified_content": None,
            "action_result": {}
        }

    # 1. HOW TO EDIT EXCEL / SPREADSHEETS
    if "edit excel" in msg_lower or "edit csv" in msg_lower or "edit spreadsheet" in msg_lower:
        response_text = (
            "### 📊 How to Edit & Clean Excel / CSV Files in SurveySnap AI\n\n"
            "You have 2 powerful ways to edit and clean spreadsheet datasets:\n\n"
            "1. **Interactive Grid Editing:** Navigate to **Dual Workspace** (`#workspace` tab) on the top menu bar to view your Excel or CSV table with editable cells (`contenteditable`).\n"
            "2. **Automated AI Data Cleaning:** Type `Clean tabular data` directly in this chat! The AI will automatically remove duplicate rows, impute missing values, clip numeric outliers, and update your dataset live.\n"
            "3. **Visual Analytics:** Scroll to **Analytics Section** (`#analytics` tab) to inspect Bar, Pie, and Line charts generated live from your dataset!"
        )
        return {"reply": response_text, "response": response_text, "action_taken": "guide_excel", "modified_content": None, "action_result": {}}

    # 2. HOW TO PROTECT / ENCRYPT FILES
    if "protect" in msg_lower or "encrypt" in msg_lower or "lock file" in msg_lower or "password" in msg_lower:
        response_text = (
            "### 🛡️ How to Password Protect Files (AES-256) in SurveySnap AI\n\n"
            "To encrypt and password lock any file:\n\n"
            "1. **Navigate to Security Section:** Click **Security** on the top navigation bar (or scroll to `#security`).\n"
            "2. **Select Active File:** Pick the document you want to encrypt from your workspace file queue.\n"
            "3. **Enter Password:** Type your secret password into the encryption field.\n"
            "4. **Click Lock File:** Click **Lock File with AES-256**. SurveySnap AI encrypts your document and generates a secure download link immediately!"
        )
        return {"reply": response_text, "response": response_text, "action_taken": "guide_protect", "modified_content": None, "action_result": {}}

    # 3. HOW TO CONVERT FILES
    if "how to convert" in msg_lower or "how can i convert" in msg_lower or "convert pdf" in msg_lower:
        response_text = (
            "### 🔄 How to Convert Files in SurveySnap AI\n\n"
            "To convert any PDF, Word `.docx`, Excel `.xlsx`, CSV, or Markdown file:\n\n"
            "1. **Navigate to the Convert Section:** Click **Convert** on the top navigation bar (or scroll to `#convert`).\n"
            "2. **Select Active File:** Pick the document you want to convert from the file dropdown.\n"
            "3. **Choose Target Format:** Select your desired format (**PDF**, **DOCX**, **XLSX**, **HTML**, or **Markdown**).\n"
            "4. **Click Convert:** Click **Convert File** to generate your converted file instantly with original formatting intact!"
        )
        return {"reply": response_text, "response": response_text, "action_taken": "guide_convert", "modified_content": None, "action_result": {}}

    # 4. HOW TO EDIT PDF / DOCUMENTS
    if "how to edit" in msg_lower or "how can i edit" in msg_lower or "how to delete page" in msg_lower:
        response_text = (
            "### ✏️ How to Edit PDFs & Documents in SurveySnap AI\n\n"
            "You have 2 easy ways to edit documents:\n\n"
            "1. **AI Chat Commands (Instant):** Type commands directly in this chat:\n"
            "   - `Delete page 1` ➔ Deletes PDF page 1 and updates the dual workspace.\n"
            "   - `Replace Old Text with New Text` ➔ Replaces text across the entire file.\n\n"
            "2. **Dual Workspace Section:** Go to **Dual Workspace** (`#workspace` tab) on the top menu bar to view your original file on the left and perform side-by-side edits on the right."
        )
        return {"reply": response_text, "response": response_text, "action_taken": "guide_edit", "modified_content": None, "action_result": {}}

    # Check if this is a tool-calling command on an active document
    if file_path and os.path.exists(file_path):
        extracted = extract_file_content(file_path, file_type)
        doc_text = extracted.get("text", "")

        # 1. TOOL COMMAND: DELETE PDF PAGE ("delete page 5")
        if "delete page" in msg_lower or "remove page" in msg_lower:
            match = re.search(r'(?:delete|remove) page (\d+)', msg_lower)
            if match:
                pg_num = int(match.group(1))
                success, err_msg = delete_pdf_page(file_path, pg_num)
                if success:
                    response_text = f"### ✂️ Tool Executed: Deleted Page {pg_num}\n\nSuccessfully removed page {pg_num} from `{os.path.basename(file_path)}`. Dual preview & workspace updated."
                    action_taken = "delete_pdf_page"
                    modified_content = extract_file_content(file_path, file_type).get("text", "")
                else:
                    response_text = f"❌ Page Deletion Failed: {err_msg}"
            else:
                response_text = "Please specify page number to delete (e.g. 'delete page 3')."

        # 2. TOOL COMMAND: REPLACE / CHANGE / RENAME / UPDATE TEXT
        #    Handles: "replace X with Y", "change X to Y", "rename X to Y", 
        #    "update X to Y", "modify X to Y", "change the title from X to Y", etc.
        elif _is_text_edit_command(msg_lower):
            target_str, replace_str = _extract_replace_pair(user_message, msg_lower)
            
            if target_str and replace_str:
                # Case-insensitive search for the target text in the document
                found_target = _find_best_match(doc_text, target_str)
                
                if found_target:
                    updated_text = doc_text.replace(found_target, replace_str)
                    save_edited_file_content(file_path, updated_text, file_type)
                    
                    # Update version in DB (non-critical)
                    if db_conn and file_id:
                        try:
                            from backend.services.version_service import create_version_snapshot
                            create_version_snapshot(db_conn, file_id, f"AI Agent: Replaced '{found_target[:30]}' with '{replace_str[:30]}'")
                        except Exception:
                            pass
                    
                    response_text = (
                        f"### ✏️ Tool Executed: Text Replacement Live!\n\n"
                        f"✅ **Successfully replaced** every occurrence of:\n\n"
                        f"- **Old text:** `{found_target}`\n"
                        f"- **New text:** `{replace_str}`\n\n"
                        f"📄 File: `{os.path.basename(file_path)}`\n\n"
                        f"*Your Dual Preview Workspace has been refreshed to show the changes.*"
                    )
                    action_taken = "replace_text"
                    modified_content = updated_text
                else:
                    response_text = (
                        f"### ⚠️ Text Not Found in Document\n\n"
                        f"Could not find `{target_str}` in `{os.path.basename(file_path)}`.\n\n"
                        f"**Tip:** Try using the exact text as it appears in the document. "
                        f"Open Dual Workspace to see the current content."
                    )
            else:
                response_text = (
                    "### ✏️ Text Replacement\n\n"
                    "Please specify what to change, for example:\n"
                    "- `Replace Company A with Company B`\n"
                    "- `Change the title Cyber Security Awareness to Cyber Awareness`\n"
                    "- `Rename Project Alpha to Project Beta`\n"
                    "- `Update old heading to new heading`"
                )

        # 3. TOOL COMMAND: CREATE POWERPOINT ("create powerpoint", "create pptx")
        elif "powerpoint" in msg_lower or "pptx" in msg_lower or "presentation" in msg_lower:
            pptx_path = generate_powerpoint_presentation(f"Presentation - {os.path.basename(file_path)}", doc_text, str(REPORTS_DIR))
            response_text = f"### 📽️ Tool Executed: PowerPoint Generated!\n\n"
            response_text += f"- **File:** `{os.path.basename(pptx_path)}`\n\n"
            response_text += f"Slides populated directly from `{os.path.basename(file_path)}`."
            action_taken = "create_pptx"
            action_result = {"pptx_path": pptx_path}

        # 4. TOOL COMMAND: SCAN PII / SENSITIVE DATA
        elif "pii" in msg_lower or "sensitive" in msg_lower or "redact" in msg_lower:
            pii_results = scan_sensitive_pii(doc_text)
            response_text = f"### 🛡️ Tool Executed: PII & Security Audit\n\n"
            response_text += f"- **Risk Level:** `{pii_results.get('risk_level', 'Low')}`\n"
            response_text += f"- **Total Entities Found:** `{pii_results.get('total_found', 0)}`\n\n"
            if pii_results.get("matches"):
                response_text += "#### Detected Sensitive Entities:\n"
                for match in pii_results["matches"][:6]:
                    response_text += f"- `{match['type']}`: `{match['masked_val']}`\n"
            action_taken = "scan_pii"
            action_result = pii_results

        # 5. TOOL COMMAND: EXTRACT TABLES
        elif "extract table" in msg_lower or "tables" in msg_lower:
            tables = extract_pdf_tables(file_path) if file_type.lower() == ".pdf" else []
            response_text = f"### 📊 Tool Executed: Extracted {len(tables)} Embedded Tables\n\n"
            action_taken = "extract_tables"
            action_result = {"tables": tables}

        # 6. TOOL COMMAND: CLEAN DATA
        elif "clean" in msg_lower and ("data" in msg_lower or "table" in msg_lower or "csv" in msg_lower):
            if file_type.lower() in [".csv", ".xlsx"]:
                stats, table_data = clean_tabular_data(file_path, file_type)
                response_text = f"### 🧹 Tool Executed: Automated Data Cleaning Complete!\n\n"
                response_text += f"- Rows Cleaned: `{stats['rows_cleaned']}`\n"
                response_text += f"- Duplicates Removed: `{stats['duplicates_removed']}`\n"
                response_text += f"- Missing Values Imputed: `{stats['missing_filled']}`\n"
                response_text += f"- Outliers Clipped: `{stats['outliers_handled']}`"
                action_taken = "clean_data"
                action_result = {"stats": stats, "table_data": table_data}
            else:
                response_text = "Data cleaning is available for CSV and XLSX files."

        # 7. RAG DOCUMENT QUESTION ANSWERING + LLM EDIT INTENT FALLBACK
        else:
            # First check if the LLM thinks this is an edit command
            edit_intent = _detect_edit_intent_via_llm(user_message, doc_text, file_path, file_type)
            if edit_intent:
                response_text = edit_intent["response_text"]
                action_taken = edit_intent.get("action_taken", "replace_text")
                modified_content = edit_intent.get("modified_content")
                
                # Save version if edit was made
                if modified_content and db_conn and file_id:
                    try:
                        from backend.services.version_service import create_version_snapshot
                        create_version_snapshot(db_conn, file_id, f"AI Agent Edit: {user_message[:50]}")
                    except Exception:
                        pass
            else:
                rag_res = retrieve_rag_context(doc_text, user_message)
                context = rag_res["context_text"]

                sys_prompt = "Answer the question accurately based on the document context. Also include SurveySnap AI platform tips if relevant."
                user_prompt = f"Document Context:\n{context}\n\nUser Question: {user_message}"

                llm_reply = call_realtime_llm_api(sys_prompt, user_prompt)
                if llm_reply:
                    response_text = f"### 🤖 Real-Time AI Response\n\n{llm_reply}"
                else:
                    response_text = f"### 📖 RAG Document Citation Answer\n\nBased on `{os.path.basename(file_path)}`:\n\n> {context[:450]}..."

                action_taken = "rag_qa"
                action_result = {"citations": rag_res["citations"]}

    # No document active: General AI + Out-of-the-box / Cyber Incident Response Mode
    else:
        sys_prompt = "Answer the user inquiry intelligently, accurately, and enthusiastically as SurveySnap AI."
        llm_reply = call_realtime_llm_api(sys_prompt, user_message)

        if llm_reply:
            response_text = f"### 🤖 Real-Time AI Response\n\n{llm_reply}"
        else:
            response_text = f"### 👋 Welcome to SurveySnap AI!\n\n"
            response_text += f"How may I help you today? Upload or select a document to perform **Live Document Edits**, **RAG Question Answering**, **Dual Preview Mode**, and **Data Cleaning**!\n\n"
            response_text += f"You asked: *\"{user_message}\"*."

    return {
        "reply": response_text,
        "response": response_text,
        "action_taken": action_taken,
        "modified_content": modified_content,
        "action_result": action_result
    }
