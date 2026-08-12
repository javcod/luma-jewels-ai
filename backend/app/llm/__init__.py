# Provider-agnostic LLM abstraction. `base.py` defines the interface;
# `fake_provider.py` is the only concrete implementation so far (a
# deterministic stand-in, no real LLM integrated yet); `factory.py` selects
# a provider from configuration.
