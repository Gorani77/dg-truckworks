"""Usage known from received responses, separate from graph success."""

from dataclasses import dataclass


@dataclass
class UsageLedger:
    model_calls: int = 0
    reported_calls: int = 0
    input_tokens: int = 0
    cached_input_tokens: int = 0
    output_tokens: int = 0

    def receive(self, response: object) -> None:
        usage = response.usage
        if usage is None:
            return
        self.reported_calls += 1
        self.input_tokens += usage.input_tokens
        self.output_tokens += usage.output_tokens
        self.cached_input_tokens += usage.input_tokens_details.cached_tokens if usage.input_tokens_details else 0

    def summary(self, model: str) -> dict:
        cost = None
        if model == "gpt-5.6-luna":
            cost = ((self.input_tokens - self.cached_input_tokens) * 0.20
                    + self.cached_input_tokens * 0.02 + self.output_tokens * 1.20) / 1_000_000
        return dict(model_calls=self.model_calls, reported_calls=self.reported_calls,
            input_tokens=self.input_tokens, cached_input_tokens=self.cached_input_tokens,
            output_tokens=self.output_tokens, usage_complete=self.reported_calls == self.model_calls,
            estimated_cost_usd=cost)
