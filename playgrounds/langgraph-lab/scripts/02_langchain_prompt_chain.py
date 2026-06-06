"""Small LangChain pipeline without a real model.

This is intentionally provider-free so the concept is easy to inspect:
- prompt templating
- runnable composition
- a lightweight stand-in for a model call
"""

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda


def mock_model(prompt_value):
    rendered = prompt_value.to_string() if hasattr(prompt_value, "to_string") else str(prompt_value)
    concept = rendered.strip().splitlines()[-1]
    return f"Mock response: LangChain is useful when you want reusable prompt and runnable composition around '{concept}'."


def main():
    prompt = PromptTemplate.from_template(
        "You are writing engineering notes about agent frameworks.\n"
        "Explain this concept in one crisp sentence:\n"
        "{concept}"
    )

    chain = prompt | RunnableLambda(mock_model)
    result = chain.invoke({"concept": "model abstraction vs raw API calls"})

    print("Rendered result:")
    print(result)
    print()
    print("What to notice:")
    print("- LangChain already gives you composition before you need a graph")
    print("- You can test prompt flow with a mock runnable first")
    print("- A graph is not the first abstraction to reach for")


if __name__ == "__main__":
    main()
