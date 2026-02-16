import requests
from enum import Enum
from ollama import Client
from google import genai  # Gemini official client


# ------------------------ Providers ------------------------
class AIProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"
    GEMINI = "gemini"
    OLLAMA = "ollama"


# ------------------------ AI Client ------------------------
class AIClient:
    def __init__(self, provider: AIProvider, api_key: str, ollama_host: str = None):
        self.provider = provider
        self.api_key = api_key

        # Initialize Ollama client if selected
        if provider == AIProvider.OLLAMA:
            if not api_key:
                raise ValueError("Ollama requires a user API key")
            self.ollama_client = Client(
                host=ollama_host or "https://ollama.com",
                headers={"Authorization": f"Bearer {api_key}"},
            )
        if provider == AIProvider.GEMINI:
            if not api_key:
                raise ValueError("Gemini requires a user API key")
            self.gemini_client = genai.Client(api_key=api_key)

    def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = None,
        **kwargs,
    ):
        """
        Unified generate method for all supported AI providers.
        """
        if self.provider == AIProvider.OPENAI:
            return self._call_openai(prompt, model, temperature, max_tokens, **kwargs)
        elif self.provider == AIProvider.ANTHROPIC:
            return self._call_anthropic(
                prompt, model, temperature, max_tokens, **kwargs
            )
        elif self.provider == AIProvider.COHERE:
            return self._call_cohere(prompt, model, temperature, max_tokens, **kwargs)
        elif self.provider == AIProvider.GEMINI:
            return self._call_gemini(prompt, model, temperature, **kwargs)
        elif self.provider == AIProvider.OLLAMA:
            return self._call_ollama(prompt, model, temperature, **kwargs)
        else:
            raise ValueError("Unsupported AI provider")

    # ---------------------- OpenAI ----------------------
    def _call_openai(self, prompt, model, temperature, max_tokens, **kwargs):
        url = "https://api.openai.com/v1/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "prompt": prompt,
            "temperature": temperature,
            **kwargs,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()

    # ---------------------- Anthropic ----------------------
    def _call_anthropic(self, prompt, model, temperature, max_tokens, **kwargs):
        url = "https://api.anthropic.com/v1/complete"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "prompt": prompt,
            "temperature": temperature,
            **kwargs,
        }
        if max_tokens:
            payload["max_tokens_to_sample"] = max_tokens
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()

    # ---------------------- Cohere ----------------------
    def _call_cohere(self, prompt, model, temperature, max_tokens, **kwargs):
        url = "https://api.cohere.ai/v1/generate"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "prompt": prompt,
            "temperature": temperature,
            **kwargs,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()

    # ---------------------- Gemini ----------------------
    def _call_gemini(self, prompt, model, temperature, max_tokens, **kwargs):
        """
        Call Gemini using the official genai Python client.
        Users must provide their own Gemini API key.
        """
        print(model)
        response = self.gemini_client.models.generate_content(
            model=model,
            contents=[prompt],  # contents must be a list
            config={"temperature": temperature, **kwargs}
        )
        # Gemini Python client returns a Response object with text
        return response.text


    # ---------------------- Ollama ----------------------
    def _call_ollama(self, prompt, model, temperature, **kwargs):
        """
        Call Ollama LLM. Users must provide their own API key when initializing the client.
        Supports optional 'think' parameter in kwargs.
        """
        messages = [{"role": "user", "content": prompt}]
        response = self.ollama_client.chat(
            model, messages=messages, think=kwargs.get("think", "high")
        )
        return response.message.content
