"""Tiny memory example using an in-memory checkpointer.

Concept based on the official memory docs:
https://docs.langchain.com/oss/python/langgraph/add-memory
"""

from typing_extensions import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph


class State(TypedDict):
    user_input: str
    reply: str


def echo_node(state: State):
    return {"reply": f"Echo: {state['user_input']}"}


def main():
    builder = StateGraph(State)
    builder.add_node("echo", echo_node)
    builder.add_edge(START, "echo")
    builder.add_edge("echo", END)

    app = builder.compile(checkpointer=InMemorySaver())
    config = {"configurable": {"thread_id": "demo-thread"}}

    first = app.invoke({"user_input": "What is LangGraph?", "reply": ""}, config)
    second = app.invoke({"user_input": "Now explain why state matters.", "reply": ""}, config)

    print("First:", first["reply"])
    print("Second:", second["reply"])
    print()
    print("Next experiment:")
    print("- inspect state persistence")
    print("- add a conditional edge")
    print("- replace the echo node with a real model call")


if __name__ == "__main__":
    main()
