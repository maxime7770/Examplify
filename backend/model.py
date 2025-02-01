from langchain_core.messages import HumanMessage, BaseMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_ollama.llms import OllamaLLM

MODEL = "llama3.2:3b"
llm = OllamaLLM(model=MODEL)


# prompt_text = """
# You are part of a Chrome extension that provides concise, illustrative examples to clarify selected text when appropriate.

# If the input text lends itself to examples, generate a clear, practical example in just a few sentences. If it does not, respond with: "No examples are applicable for this text."

# Your response must be concise, relevant, and contain only the generated example or the default message, without any additional explanation or unnecessary text.
# """

def run_model(system_prompt, user_input):
    

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                system_prompt
            ),
            (
                "human",
                f"""
                    Input from the user:
                    {user_input}
                    """
            )
        ]
    )
    
    # Create and run the chain
    chain = prompt | llm

    # Execute and print the result
    result = chain.invoke({})
    return result



if __name__ == "__main__":
    print(run_model("Model-free vs model-based reinforcement learning"))