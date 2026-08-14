import logging

from langchain_core.prompts import PromptTemplate

from src.graph.state import GraphState
from src.schemas.data_schemas import ParsedResume, Education
from src.agents.orchestrator import get_llm


logger = logging.getLogger(__name__)


def parse_resume_node(state: GraphState) -> dict:
    """Extracts structured information from the candidate's resume."""

    try:
        logger.info("Agent: Parsing Resume...")

        print("PARSER 1: entered parse_resume_node")

        # --------------------------------------------------
        # GET LLM
        # --------------------------------------------------
        llm = get_llm()

        print("PARSER 2: get_llm worked")

        # --------------------------------------------------
        # DEBUG SCHEMA
        # --------------------------------------------------
        print("ParsedResume:", ParsedResume)
        print("ParsedResume module:", ParsedResume.__module__)
        print("ParsedResume fields:", ParsedResume.model_fields)

        print("Education:", Education)
        print("Education module:", Education.__module__)
        print("Education fields:", Education.model_fields)

        # --------------------------------------------------
        # STRUCTURED OUTPUT
        # --------------------------------------------------
        structured_llm = llm.with_structured_output(ParsedResume)

        print("PARSER 3: with_structured_output worked")

        # --------------------------------------------------
        # PROMPT
        # --------------------------------------------------
        prompt = PromptTemplate.from_template(
            "You are an expert technical recruiter and data extractor.\n"
            "Extract the required fields from the following resume. "
            "If a field is not present, leave it empty or provide an empty list.\n\n"
            "Metadata (if any):\n{metadata}\n\n"
            "Resume Text:\n{resume}"
        )

        print("PARSER 4: prompt created")

        # --------------------------------------------------
        # CHAIN
        # --------------------------------------------------
        chain = prompt | structured_llm

        print("PARSER 5: chain created")

        metadata_str = str(
            state.get("candidate_metadata", {})
        )

        print("PARSER 6: invoking LLM")

        # --------------------------------------------------
        # LLM INVOCATION WITH RETRY
        # --------------------------------------------------
        import time
        max_retries = 3
        result = None
        for attempt in range(max_retries):
            try:
                result = chain.invoke(
                    {
                        "resume": state.get("resume_text", ""),
                        "metadata": metadata_str,
                    }
                )
                break
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"RATE LIMIT HIT (429). Retrying in 35 seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(35)
                else:
                    raise e

        print("PARSER 7: LLM invocation worked")

        # --------------------------------------------------
        # MODEL DUMP
        # --------------------------------------------------
        print("PARSER 8: about to model_dump")

        dumped = result.model_dump()

        print("PARSER 9: model_dump worked")

        print("DUMPED TYPE:", type(dumped))
        print("DUMPED:", dumped)

        # --------------------------------------------------
        # RETURN
        # --------------------------------------------------
        print("PARSER 10: returning parsed resume")

        return {
            "parsed_resume": dumped
        }

    # ======================================================
    # CATCH EVERYTHING INSIDE parse_resume_node
    # ======================================================
    except Exception as e:

        print("\n" + "=" * 70)
        print("🔥🔥🔥 PARSE RESUME NODE ERROR 🔥🔥🔥")
        print("=" * 70)

        print("ERROR TYPE:", type(e))
        print("ERROR REPR:", repr(e))
        print("ERROR STRING:", str(e))

        logger.exception(
            "🔥 parse_resume_node failed"
        )

        print("=" * 70)
        print()

        raise