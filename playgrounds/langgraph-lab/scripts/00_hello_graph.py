"""Smallest possible LangGraph graph.

Based on the official LangGraph overview example:
https://docs.langchain.com/oss/python/langgraph
"""

from langgraph.graph import END, START, MessagesState, StateGraph


def mock_llm(_: MessagesState):
    return {"messages": [{"role": "ai", "content": "hello from LangGraph"}]}


def main():
    graph = StateGraph(MessagesState)
    graph.add_node("mock_llm", mock_llm)
    graph.add_edge(START, "mock_llm")
    graph.add_edge("mock_llm", END)
    app = graph.compile()

    result = app.invoke({"messages": [{"role": "user", "content": "hi"}]})
    print(result)
    last_message = result["messages"][-1]
    content = last_message.content if hasattr(last_message, "content") else last_message["content"]
    print(content)


if __name__ == "__main__":
    main()
