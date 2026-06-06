"""Conditional routing example for LangGraph.

Use this after the plain LangChain example to see where explicit graph structure
starts earning its keep.
"""

from typing import Literal

from typing_extensions import TypedDict

from langgraph.graph import END, START, StateGraph


Route = Literal["langgraph", "langchain", "compare"]


class State(TypedDict):
    question: str
    route: Route
    answer: str


def route_question(state: State):
    question = state["question"].lower()

    if "compare" in question or "difference" in question:
        route: Route = "compare"
    elif "graph" in question or "state" in question or "routing" in question:
        route = "langgraph"
    else:
        route = "langchain"

    return {"route": route}


def answer_langgraph(_: State):
    return {
        "answer": "LangGraph is useful when the workflow has state, routing, or resumability that should be explicit."
    }

def answer_langchain(_: State):
    return {
        "answer": "LangChain is often enough when you just need prompt, model, tool, and parser composition."
    }


def answer_compare(_: State):
    return {
        "answer": "A practical rule: start with LangChain composition, then move to LangGraph when branching and state become part of the design."
    }


def choose_route(state: State):
    return state["route"]


def build_app():
    builder = StateGraph(State)
    builder.add_node("route_question", route_question)
    builder.add_node("answer_langgraph", answer_langgraph)
    builder.add_node("answer_langchain", answer_langchain)
    builder.add_node("answer_compare", answer_compare)

    builder.add_edge(START, "route_question")
    builder.add_conditional_edges(
        "route_question",
        choose_route,
        {
            "langgraph": "answer_langgraph",
            "langchain": "answer_langchain",
            "compare": "answer_compare",
        },
    )
    builder.add_edge("answer_langgraph", END)
    builder.add_edge("answer_langchain", END)
    builder.add_edge("answer_compare", END)
    return builder.compile()


def main():
    app = build_app()

    questions = [
        "When do I actually need LangGraph?",
        "What does LangChain give me by itself?",
        "Compare LangChain and LangGraph for agent workflows.",
    ]

    for question in questions:
        result = app.invoke({"question": question, "route": "langchain", "answer": ""})
        print(f"Q: {question}")
        print(f"Route: {result['route']}")
        print(f"A: {result['answer']}")
        print()


if __name__ == "__main__":
    main()
