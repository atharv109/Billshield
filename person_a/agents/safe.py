import json
import logging
from collections.abc import Awaitable, Callable

logger = logging.getLogger(__name__)


async def safe_agent_call(
    prompt: str,
    content: str,
    fallback: dict | list,
    run_agent: Callable[[str, str], Awaitable[str]],
) -> dict | list:
    result = ""
    try:
        result = await run_agent(prompt, content)
        return json.loads(result)
    except json.JSONDecodeError:
        cleaned = result.replace("```json", "").replace("```", "")
        try:
            return json.loads(cleaned)
        except Exception:
            return fallback
    except Exception:
        logger.exception("agent failure")
        return fallback
